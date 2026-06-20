import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeEntity, ChangeOp, ChangeStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { ProductsService } from '../products/products.service';
import { PurchasesService } from '../purchases/purchases.service';
import { AllocationsService } from '../allocations/allocations.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';

/** The persisted change-request row shape (raw, before actor enrichment). */
type ChangeRequestRow = Prisma.ChangeRequestGetPayload<{}>;

/** Where a maker-checker change targets + how to apply it directly. */
export interface ChangeSpec<R extends { id: string } = { id: string }> {
  entity: ChangeEntity;
  operation: ChangeOp;
  productId?: string;
  variantId?: string;
  categoryId?: string;
  supplierId?: string;
  payload?: object;
  /** Performs the underlying mutation (instant/approver path). Returns the row. */
  apply: () => Promise<R>;
}

/**
 * Shared maker-checker engine. A manager-permission member's mutation is queued
 * as PENDING; an Owner/ADMINISTRATION_ACCESS member's mutation is applied
 * instantly and recorded as APPROVED. Doubles as the org-wide audit log.
 */
@Injectable()
export class ChangeRequestService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    @Inject(forwardRef(() => ProductsService))
    private products: ProductsService,
    @Inject(forwardRef(() => PurchasesService))
    private purchases: PurchasesService,
    @Inject(forwardRef(() => AllocationsService))
    private allocations: AllocationsService,
  ) {}

  /** True when the actor may apply changes directly (Owner or ADMINISTRATION_ACCESS). */
  isApprover(orgId: string, userId: string): Promise<boolean> {
    return this.membershipService.hasPermission(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );
  }

  /**
   * Instant-or-queue. Approvers apply via `spec.apply()` and we log an APPROVED
   * audit row; everyone else gets a PENDING request that mutates nothing.
   */
  async submit<R extends { id: string }>(
    orgId: string,
    userId: string,
    spec: ChangeSpec<R>,
  ): Promise<R | ChangeRequestRow> {
    if (await this.isApprover(orgId, userId)) {
      const row = await spec.apply();
      await this.record(orgId, userId, spec, ChangeStatus.APPROVED, row.id);
      return row;
    }
    return this.record(orgId, userId, spec, ChangeStatus.PENDING);
  }

  /** Persist a queue/audit row. */
  private record(
    orgId: string,
    userId: string,
    spec: ChangeSpec,
    status: ChangeStatus,
    appliedRefId?: string,
  ) {
    const applied = status === ChangeStatus.APPROVED;
    return this.prisma.changeRequest.create({
      data: {
        organizationId: orgId,
        entity: spec.entity,
        operation: spec.operation,
        productId: spec.productId,
        variantId: spec.variantId,
        categoryId: spec.categoryId,
        supplierId: spec.supplierId,
        payload: (spec.payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        status,
        requestedBy: userId,
        reviewedBy: applied ? userId : undefined,
        reviewedAt: applied ? new Date() : undefined,
        appliedRefId,
      },
    });
  }

  // ============================================================
  //  APPROVAL QUEUE
  // ============================================================

  /** Approver view: all change requests in the org (optionally filtered by status). */
  async list(orgId: string, userId: string, status?: ChangeStatus) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );
    const requests = await this.prisma.changeRequest.findMany({
      where: { organizationId: orgId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return this.enrichWithActors(requests);
  }

  /** Maker view: the requests this user submitted. */
  async listMine(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(userId, orgId);
    const requests = await this.prisma.changeRequest.findMany({
      where: { organizationId: orgId, requestedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return this.enrichWithActors(requests);
  }

  /**
   * Approve a pending request: apply the change, then mark APPROVED.
   *
   * The PENDING→APPROVED transition is claimed atomically with a guarded
   * updateMany so two concurrent approvers (or a double-click) can't both pass
   * the status check and apply the same request twice — which would double a
   * purchase's stock, re-run an allocation, etc. Only the approver whose claim
   * flips the row actually applies; if that apply then fails, the claim is
   * released back to PENDING so the request can be retried or rejected.
   */
  async approve(orgId: string, userId: string, requestId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );

    const request = await this.prisma.changeRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
    });
    if (!request) throw new NotFoundException('Change request not found');
    if (request.status !== ChangeStatus.PENDING) {
      throw new BadRequestException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    // Atomic claim: exactly one caller transitions the row out of PENDING.
    const claim = await this.prisma.changeRequest.updateMany({
      where: { id: requestId, status: ChangeStatus.PENDING },
      data: {
        status: ChangeStatus.APPROVED,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
    if (claim.count === 0) {
      throw new BadRequestException('Request is no longer pending');
    }

    try {
      const appliedRefId = await this.applyChangeRequest(
        orgId,
        request,
        userId,
      );
      return this.prisma.changeRequest.update({
        where: { id: request.id },
        data: { appliedRefId },
      });
    } catch (err) {
      // Apply failed after the claim — release it so the change isn't left
      // marked APPROVED without having actually run.
      await this.prisma.changeRequest.update({
        where: { id: request.id },
        data: {
          status: ChangeStatus.PENDING,
          reviewedBy: null,
          reviewedAt: null,
        },
      });
      throw err;
    }
  }

  /** Reject a pending request: record the decision, change nothing. */
  async reject(
    orgId: string,
    userId: string,
    requestId: string,
    reason?: string,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );

    const request = await this.prisma.changeRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
    });
    if (!request) throw new NotFoundException('Change request not found');
    if (request.status !== ChangeStatus.PENDING) {
      throw new BadRequestException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    return this.prisma.changeRequest.update({
      where: { id: request.id },
      data: {
        status: ChangeStatus.REJECTED,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reason,
      },
    });
  }

  // ============================================================
  //  APPLY DISPATCH
  // ============================================================

  /**
   * Execute a pending request's underlying operation. Returns the affected row
   * id. `appliedBy` is the approver — purchases record them as the receiver.
   */
  private async applyChangeRequest(
    orgId: string,
    request: ChangeRequestRow,
    appliedBy: string,
  ): Promise<string> {
    if (request.entity === ChangeEntity.SUPPLIER) {
      return this.applySupplierChange(orgId, request);
    }
    if (request.entity === ChangeEntity.PURCHASE) {
      // Re-validated + transactionally applied (stock + ledger) in PurchasesService.
      return this.purchases.applyChange(orgId, request, appliedBy);
    }
    if (request.entity === ChangeEntity.STOCK_MOVE) {
      // Pool → location move, applied transactionally in AllocationsService.
      return this.allocations.applyChange(orgId, request, appliedBy);
    }
    // Product / variant / category live in (and re-validate within) ProductsService.
    return this.products.applyChange(orgId, request);
  }

  /** Supplier writes are trivial enough to apply inline here. */
  private async applySupplierChange(
    orgId: string,
    request: ChangeRequestRow,
  ): Promise<string> {
    const payload = (request.payload ?? {}) as Record<string, unknown>;

    if (request.operation === ChangeOp.CREATE) {
      const supplier = await this.prisma.supplier.create({
        data: { ...(payload as object), organizationId: orgId } as any,
      });
      return supplier.id;
    }

    const supplierId = request.supplierId!;
    const exists = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!exists) throw new NotFoundException('Supplier not found');

    if (request.operation === ChangeOp.UPDATE) {
      await this.prisma.supplier.update({
        where: { id: supplierId },
        data: payload as any,
      });
    } else {
      await this.prisma.supplier.delete({ where: { id: supplierId } });
    }
    return supplierId;
  }

  // ============================================================
  //  ACTOR ENRICHMENT
  // ============================================================

  /** Attach requester/reviewer display names (raw userIds, no FK — resolved here). */
  private async enrichWithActors<
    T extends { requestedBy: string; reviewedBy: string | null },
  >(requests: T[]) {
    const ids = new Set<string>();
    for (const r of requests) {
      ids.add(r.requestedBy);
      if (r.reviewedBy) ids.add(r.reviewedBy);
    }
    if (ids.size === 0) {
      return requests.map((r) => ({
        ...r,
        requestedByUser: null,
        reviewedByUser: null,
      }));
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, name: true, email: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return requests.map((r) => ({
      ...r,
      requestedByUser: byId.get(r.requestedBy) ?? null,
      reviewedByUser: r.reviewedBy ? (byId.get(r.reviewedBy) ?? null) : null,
    }));
  }
}
