import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChangeEntity, ChangeOp } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { ChangeRequestService } from '../change-requests/change-request.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
    private changeRequests: ChangeRequestService,
  ) {}

  async findAll(orgId: string, userId: string) {
    // Suppliers are org-wide reference data: any member may list them (e.g. to
    // attach one when recording a purchase). Mutations are maker-checker below.
    await this.membershipService.verifyAccess(userId, orgId);
    return this.prisma.supplier.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, supplierId: string) {
    await this.membershipService.verifyAccess(userId, orgId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
      include: { purchases: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  // ============================================================
  //  MUTATIONS (maker–checker via ChangeRequestService)
  //  SUPPLIERS_MANAGE holders queue changes; approvers apply instantly.
  // ============================================================

  async create(orgId: string, userId: string, dto: CreateSupplierDto) {
    await this.assertCanManage(orgId, userId);
    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.SUPPLIER,
      operation: ChangeOp.CREATE,
      payload: dto,
      apply: () =>
        this.prisma.supplier.create({
          data: { ...dto, organizationId: orgId },
        }),
    });
  }

  async update(
    orgId: string,
    userId: string,
    supplierId: string,
    dto: UpdateSupplierDto,
  ) {
    await this.assertCanManage(orgId, userId);
    await this.assertInOrg(orgId, supplierId);
    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.SUPPLIER,
      operation: ChangeOp.UPDATE,
      supplierId,
      payload: dto,
      apply: () =>
        this.prisma.supplier.update({ where: { id: supplierId }, data: dto }),
    });
  }

  async remove(orgId: string, userId: string, supplierId: string) {
    await this.assertCanManage(orgId, userId);
    await this.assertInOrg(orgId, supplierId);
    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.SUPPLIER,
      operation: ChangeOp.DELETE,
      supplierId,
      apply: () => this.prisma.supplier.delete({ where: { id: supplierId } }),
    });
  }

  /** Allowed for SUPPLIERS_MANAGE holders (queued) or approvers (instant). */
  private async assertCanManage(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.SUPPLIERS_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException('Missing required permission: SUPPLIERS_MANAGE');
    }
  }

  private async assertInOrg(orgId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }
}
