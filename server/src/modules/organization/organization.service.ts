import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpgradePlanDto } from './dto/organization.dto';
import {
  OrganizationRole,
  SubscriptionStatus,
  PlanType,
  InvoiceStatus
} from '../../../generated/prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    // Check if the Plan is Exist
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Selected plan not found');

    // Only One Free Organization Per User
    if (plan.type === PlanType.FREE) {
      const existingFreeOrg = await this.prisma.membership.findFirst({
        where: {
          userId: userId,
          role: OrganizationRole.OWNER,
          organization: { subscription: { plan: { type: PlanType.FREE } } }
        }
      });
      if (existingFreeOrg) {
        throw new ForbiddenException('Limit reached: You already own a Free organization.');
      }
    }

    // 3. ANTI-ABUSE: Has this user used a trial for this PLAN TYPE before?
    const previousSub = await this.prisma.subscription.findFirst({
      where: {
        plan: { type: plan.type },
        organization: { memberships: { some: { userId, role: OrganizationRole.OWNER } } },
        hasFreeTrial: true,
      }
    });

    const isEligibleForTrial = !previousSub && plan.type !== PlanType.FREE && (plan.trialDays ?? 0) > 0;

    // 4. TRANSACTION
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.name },
      });

      await tx.membership.create({
        data: {
          userId: userId,
          organizationId: organization.id,
          role: OrganizationRole.OWNER,
        },
      });

      const now = new Date();
      let trialEndsAt: Date | null = null;
      let status: SubscriptionStatus = SubscriptionStatus.PENDING;
      const periodEnd = new Date();

      if (isEligibleForTrial) {
        trialEndsAt = new Date();
        trialEndsAt.setDate(now.getDate() + (plan.trialDays ?? 0));
        periodEnd.setTime(trialEndsAt.getTime());
        status = SubscriptionStatus.ONFREETRIAL;
      } else if (plan.type === PlanType.FREE) {
        status = SubscriptionStatus.ACTIVE;
        periodEnd.setFullYear(now.getFullYear() + 10); // Free is essentially forever
      } else {
        // No trial eligibility: Plan stays PENDING until first invoice is paid
        status = SubscriptionStatus.PENDING;
        periodEnd.setMonth(now.getMonth() + 1);
      }

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          status: status,
          hasFreeTrial: isEligibleForTrial,
          trialEndsAt: trialEndsAt,
          billingInterval: dto.billingInterval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      const amount = dto.billingInterval === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

      await tx.invoice.create({
        data: {
          organizationId: organization.id,
          subscriptionId: subscription.id,
          amount: amount || 0,
          currency: plan.currency,
          status: (amount || 0) === 0 ? InvoiceStatus.PAID : InvoiceStatus.OPEN,
        },
      });

      return organization;
    });
  }

  async upgrade(orgId: string, userId: string, dto: UpgradePlanDto) {
    const currentSub = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true }
    });
    if (!currentSub) throw new NotFoundException('Subscription not found');

    const newPlan = await this.prisma.plan.findUnique({ where: { id: dto.newPlanId } });
    if (!newPlan) throw new NotFoundException('New plan not found');

    // 1. Verify Ownership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } }
    });
    if (membership?.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only owners can upgrade plans');
    }

    // 2. Upgrade-Only Rule (Check Monthly Price)
    if ((newPlan.monthlyPrice || 0) < (currentSub.plan.monthlyPrice || 0)) {
      throw new BadRequestException('Downgrading is not allowed via this portal.');
    }

    return this.prisma.subscription.update({
      where: { organizationId: orgId },
      data: {
        planId: newPlan.id,
        // When upgrading, we usually reset trial to null as they've made a choice
        hasFreeTrial: false,
        trialEndsAt: null,
        status: SubscriptionStatus.PENDING // Await payment for new plan
      }
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      include: { subscription: { include: { plan: true } } }
    });
  }

  async findOne(orgId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId, memberships: { some: { userId } } },
      include: {
        subscription: {
          include: { plan: { include: { planFeatures: { include: { feature: true } } } } }
        },
        memberships: { include: { user: true } }
      }
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
