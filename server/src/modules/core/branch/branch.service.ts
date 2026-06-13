import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';

@Injectable()
export class BranchService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService
  ) {}

  private async validateLimit(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: { plan: { include: { planFeatures: { include: { feature: true } } } } }
        },
        _count: { select: { branches: true } }
      }
    });

    if (!org) throw new NotFoundException('Organization not found');

    const limitFeature = org.subscription?.plan.planFeatures.find(f => f.feature.key === 'max_branches');
    if (!limitFeature) throw new BadRequestException('Branch limit not configured for this plan');

    const allowed = parseInt(limitFeature.value);
    if (org._count.branches >= allowed) {
      throw new BadRequestException(`Limit reached. Your plan allows only ${allowed} branches.`);
    }
  }

  async findAll(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(userId, orgId, PERMISSIONS.BRANCHES_LIST_ALL);
    return this.prisma.branch.findMany({ where: { organizationId: orgId } });
  }

  async create(orgId: string, userId: string, dto: CreateBranchDto) {
    await this.membershipService.verifyAccess(userId, orgId, PERMISSIONS.ADMINISTRATION_ACCESS);
    await this.validateLimit(orgId);

    return this.prisma.branch.create({
      data: { ...dto, organizationId: orgId }
    });
  }

  async update(orgId: string, userId: string, branchId: string, dto: UpdateBranchDto) {
    // Branch management is centralized under the Administration permission.
    await this.membershipService.verifyAccess(userId, orgId, PERMISSIONS.ADMINISTRATION_ACCESS);

    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  async delete(orgId: string, userId: string, branchId: string) {
    await this.membershipService.verifyAccess(userId, orgId, PERMISSIONS.ADMINISTRATION_ACCESS);
    return this.prisma.branch.deleteMany({ where: { id: branchId, organizationId: orgId } });
  }
}
