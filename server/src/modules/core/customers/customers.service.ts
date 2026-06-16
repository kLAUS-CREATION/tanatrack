import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  async findAll(orgId: string, userId: string) {
    // Customer directory readers OR anyone who can record a sale (so the sale
    // dialog's customer picker loads even without CUSTOMERS_VIEW_ALL).
    await this.assertCanList(orgId, userId);
    return this.prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, customerId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.CUSTOMERS_VIEW_ALL,
    );
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
      include: { sales: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(orgId: string, userId: string, dto: CreateCustomerDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.CUSTOMERS_MANAGE,
    );
    return this.prisma.customer.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async update(
    orgId: string,
    userId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.CUSTOMERS_MANAGE,
    );
    await this.assertInOrg(orgId, customerId);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: dto,
    });
  }

  async remove(orgId: string, userId: string, customerId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.CUSTOMERS_MANAGE,
    );
    await this.assertInOrg(orgId, customerId);
    return this.prisma.customer.delete({ where: { id: customerId } });
  }

  private async assertInOrg(orgId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /** Directory viewers, customer managers, or sellers may read the customer list. */
  private async assertCanList(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.CUSTOMERS_VIEW_ALL,
      )) ||
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.CUSTOMERS_MANAGE,
      )) ||
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.SALES_CREATE,
      ));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: CUSTOMERS_VIEW_ALL',
      );
    }
  }
}
