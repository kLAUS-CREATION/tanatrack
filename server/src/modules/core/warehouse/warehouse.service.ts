import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';

@Injectable()
export class WarehouseService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  private async validateLimit(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: {
            plan: { include: { planFeatures: { include: { feature: true } } } },
          },
        },
        _count: { select: { warehouses: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');

    const limitFeature = org.subscription?.plan.planFeatures.find(
      (f) => f.feature.key === 'max_warehouses',
    );
    if (!limitFeature)
      throw new BadRequestException(
        'Warehouse limit not configured for this plan',
      );

    const allowed = parseInt(limitFeature.value);
    if (org._count.warehouses >= allowed) {
      throw new BadRequestException(
        `Limit reached. Your plan allows only ${allowed} warehouses.`,
      );
    }
  }

  async findAll(orgId: string, userId: string) {
    // Holders of the org-wide WAREHOUSING_LIST_ALL permission (and the owner) see
    // every warehouse in the organization.
    const canListAll = await this.membershipService.hasPermission(
      userId,
      orgId,
      PERMISSIONS.WAREHOUSING_LIST_ALL,
    );
    if (canListAll) {
      return this.prisma.warehouse.findMany({
        where: { organizationId: orgId, isActive: true },
      });
    }

    // A member with only a LOCAL role sees just the warehouses they're assigned to.
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.warehouse.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        memberships: { some: { membershipId: membership.id } },
      },
    });
  }

  async create(orgId: string, userId: string, dto: CreateWarehouseDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );
    await this.validateLimit(orgId);

    return this.prisma.warehouse.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async update(
    orgId: string,
    userId: string,
    warehouseId: string,
    dto: UpdateWarehouseDto,
  ) {
    // Warehouse management is centralized under the Administration permission.
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId: orgId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    return this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: dto,
    });
  }

  async delete(orgId: string, userId: string, warehouseId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.ADMINISTRATION_ACCESS,
    );
    // Soft delete: preserve stock levels and ledger references.
    return this.prisma.warehouse.updateMany({
      where: { id: warehouseId, organizationId: orgId },
      data: { isActive: false },
    });
  }
}
