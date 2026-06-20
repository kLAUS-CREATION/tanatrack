import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import {
  activeWhere,
  resolvePaging,
  type Paginated,
} from 'src/common/dto/pagination.dto';
import { Customer, Prisma } from '@prisma/client';

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
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Server-paginated + filtered list for the customers page. The plain findAll
  // above stays for the sale dialog's customer picker (needs the full array).
  async findAllPaged(
    orgId: string,
    userId: string,
    query: CustomerQueryDto,
  ): Promise<Paginated<Customer>> {
    await this.assertCanList(orgId, userId);
    const { skip, take, page, pageSize } = resolvePaging(query);

    const search = query.search?.trim();
    const where: Prisma.CustomerWhereInput = {
      organizationId: orgId,
      ...activeWhere(query.status),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // Lenient plan-limit guard for the `max_customers` feature (absent → unlimited).
  private async assertWithinCustomerLimit(orgId: string) {
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
      (f) => f.feature.key === 'max_customers',
    );
    if (!feature) return;
    const allowed = parseInt(feature.value, 10);
    if (Number.isNaN(allowed)) return;
    const count = await this.prisma.customer.count({
      where: { organizationId: orgId, isActive: true },
    });
    if (count >= allowed) {
      throw new BadRequestException(
        `Limit reached. Your plan allows only ${allowed} customers.`,
      );
    }
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
    await this.assertWithinCustomerLimit(orgId);
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
    // Soft delete: hide from lists but keep the row so historical sales still
    // resolve the customer by id.
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false },
    });
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
