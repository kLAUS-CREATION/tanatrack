import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  async findAll(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SUPPLIERS_VIEW_ALL,
    );
    return this.prisma.supplier.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, supplierId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SUPPLIERS_VIEW_ALL,
    );
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
      include: { purchases: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(orgId: string, userId: string, dto: CreateSupplierDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SUPPLIERS_MANAGE,
    );
    return this.prisma.supplier.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async update(
    orgId: string,
    userId: string,
    supplierId: string,
    dto: UpdateSupplierDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SUPPLIERS_MANAGE,
    );
    await this.assertInOrg(orgId, supplierId);
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: dto,
    });
  }

  async remove(orgId: string, userId: string, supplierId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.SUPPLIERS_MANAGE,
    );
    await this.assertInOrg(orgId, supplierId);
    return this.prisma.supplier.delete({ where: { id: supplierId } });
  }

  private async assertInOrg(orgId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }
}
