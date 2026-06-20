import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeEntity, ChangeOp } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { ChangeRequestService } from '../change-requests/change-request.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import {
  activeWhere,
  resolvePaging,
  type Paginated,
} from 'src/common/dto/pagination.dto';
import { Prisma, Supplier } from '@prisma/client';

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
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Server-paginated + filtered list for the suppliers page. The plain findAll
  // above stays for the purchase supplier picker (needs the full array).
  async findAllPaged(
    orgId: string,
    userId: string,
    query: SupplierQueryDto,
  ): Promise<Paginated<Supplier>> {
    await this.membershipService.verifyAccess(userId, orgId);
    const { skip, take, page, pageSize } = resolvePaging(query);

    const search = query.search?.trim();
    const where: Prisma.SupplierWhereInput = {
      organizationId: orgId,
      ...activeWhere(query.status),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return { data, total, page, pageSize };
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
    await this.assertWithinSupplierLimit(orgId);
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

  // Lenient plan-limit guard for the `max_suppliers` feature (absent → unlimited).
  private async assertWithinSupplierLimit(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: {
            plan: { include: { planFeatures: { include: { feature: true } } } },
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    const feature = org.subscription?.plan.planFeatures.find(
      (f) => f.feature.key === 'max_suppliers',
    );
    if (!feature) return;
    const allowed = parseInt(feature.value, 10);
    if (Number.isNaN(allowed)) return;
    const count = await this.prisma.supplier.count({
      where: { organizationId: orgId, isActive: true },
    });
    if (count >= allowed) {
      throw new BadRequestException(
        `Limit reached. Your plan allows only ${allowed} suppliers.`,
      );
    }
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
      // Soft delete: keep the row so historical purchases still resolve it.
      apply: () =>
        this.prisma.supplier.update({
          where: { id: supplierId },
          data: { isActive: false },
        }),
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
      throw new ForbiddenException(
        'Missing required permission: SUPPLIERS_MANAGE',
      );
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
