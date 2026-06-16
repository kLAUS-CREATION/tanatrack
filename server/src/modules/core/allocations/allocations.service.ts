import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeEntity, ChangeOp, MovementType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { InventoryService } from '../inventory/inventory.service';
import { ChangeRequestService } from '../change-requests/change-request.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateAllocationDto } from './dto/allocation.dto';

/**
 * Allocations move purchased stock from the org-wide receiving pool (StockLevel with
 * no location) to a branch/warehouse. Mutations run through the shared maker-checker
 * engine: INVENTORY_MANAGE holders queue a PENDING request (no stock moves until
 * approved); approvers (Owner / ADMINISTRATION_ACCESS) apply instantly.
 */
@Injectable()
export class AllocationsService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => ChangeRequestService))
    private changeRequests: ChangeRequestService,
  ) {}

  async create(orgId: string, userId: string, dto: CreateAllocationDto) {
    await this.assertCanManage(orgId, userId);
    // Validate up front so makers get immediate feedback; the real mutation
    // (re-validated) only runs when the change is applied/approved.
    const variant = await this.assertVariantInOrg(orgId, dto.variantId);
    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
    });

    // Snapshot human-readable labels into the payload so approval rows read well.
    const destinationName = await this.destinationName(dest);
    const payload = {
      ...dto,
      variantName: variant.name,
      destinationName,
    };

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.STOCK_MOVE,
      operation: ChangeOp.CREATE,
      variantId: dto.variantId,
      payload,
      apply: () => this.applyMove(orgId, userId, dto),
    });
  }

  /**
   * Apply an approved allocation change request. Invoked by ChangeRequestService;
   * `appliedBy` is recorded as the actor on the ledger movement.
   */
  async applyChange(
    orgId: string,
    request: { payload: Prisma.JsonValue },
    appliedBy: string,
  ): Promise<string> {
    const dto = (request.payload ?? {}) as unknown as CreateAllocationDto;
    const movement = await this.applyMove(orgId, appliedBy, dto);
    return movement.id;
  }

  /** The transactional core: take from the pool, place at the destination, log it. */
  private async applyMove(
    orgId: string,
    performedBy: string,
    dto: CreateAllocationDto,
  ) {
    await this.assertVariantInOrg(orgId, dto.variantId);
    const dest = await this.inventoryService.resolveLocation(orgId, {
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
    });

    return this.prisma.$transaction(async (tx) => {
      // Source is the receiving pool (empty location = both null). The guarded
      // decrement surfaces a clear error when there isn't enough unallocated stock.
      await this.inventoryService.decrementStock(
        tx,
        dto.variantId,
        {},
        dto.quantity,
      );
      await this.inventoryService.incrementStock(
        tx,
        dto.variantId,
        dest,
        dto.quantity,
      );
      return tx.stockMovement.create({
        data: {
          organizationId: orgId,
          variantId: dto.variantId,
          type: MovementType.TRANSFER,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference,
          performedBy,
          // No from* location: stock comes out of the org receiving pool.
          toBranchId: dest.branchId,
          toWarehouseId: dest.warehouseId,
        },
      });
    });
  }

  /** Allocating requires INVENTORY_MANAGE (queued) or approver (instant). */
  private async assertCanManage(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.INVENTORY_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: INVENTORY_MANAGE',
      );
    }
  }

  private async assertVariantInOrg(orgId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { organizationId: orgId } },
    });
    if (!variant)
      throw new NotFoundException(
        'Product variant not found in this organization',
      );
    return variant;
  }

  private async destinationName(dest: {
    branchId?: string;
    warehouseId?: string;
  }): Promise<string | undefined> {
    if (dest.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dest.branchId },
        select: { name: true },
      });
      return branch?.name;
    }
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dest.warehouseId },
      select: { name: true },
    });
    return warehouse?.name;
  }
}
