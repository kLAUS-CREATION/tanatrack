import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpgradePlanDto } from './dto/organization.dto';
import {
  OrganizationRole,
  SubscriptionStatus,
  PlanType,
  InvoiceStatus,
  BillingInterval,
} from '../../../generated/prisma/client';
import { MembershipService } from '../core/membership/membership.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService, private perm: MembershipService) {}
  private readonly logger = new Logger(OrganizationService.name);

  // Creating A New Organization
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async create(userId: string, dto: CreateOrganizationDto) {
    // Check if the Plan is Exist
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Selected plan not found');

    // Only One Free Organization Per User
    // this means the user cant create more than one free organization
    if (plan.type === PlanType.FREE) {
      const existingFreeOrg = await this.prisma.membership.findFirst({
        where: {
          userId: userId,
          roleType: OrganizationRole.OWNER,
          organization: { subscription: { plan: { type: PlanType.FREE } } }
        }
      });
      if (existingFreeOrg) {
        throw new ForbiddenException('Limit reached: You already own a Free organization.');
      }
    }

    //  Has the user have created a non-free organization before ? -->  this means the user cant have a free trial
    const isTheUserHasNonFreeOrg = await this.prisma.membership.findFirst({
      where: {
        userId: userId,
        roleType: OrganizationRole.OWNER,
        organization: { subscription: { plan: { type: { not: PlanType.FREE } } } }
      }
    })

    const isEligibleForTrial = !isTheUserHasNonFreeOrg && plan.type !== PlanType.FREE && (plan.trialDays ?? 0) > 0;

    // 4. TRANSACTION
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      let trialEndsAt: Date | null = null;
      let status: SubscriptionStatus = SubscriptionStatus.PENDING;
      const periodEnd = new Date(now);

      if (plan.type === PlanType.FREE) {
        status = SubscriptionStatus.ACTIVE;
        // this should be forever
        periodEnd.setFullYear(9999);
      } else if (isEligibleForTrial) {
          trialEndsAt = new Date(now);
          trialEndsAt.setDate(trialEndsAt.getDate() + (plan.trialDays ?? 0));
          periodEnd.setTime(trialEndsAt.getTime());
          status = SubscriptionStatus.ONFREETRIAL;
      } else {
          status = SubscriptionStatus.PENDING;
          // In here there will be real payment thing in here

          // after some operation in here
          status = SubscriptionStatus.ACTIVE;
          trialEndsAt = null;
          if (dto.billingInterval === 'YEARLY') {
            periodEnd.setFullYear(now.getFullYear() + 1);
          } else if (dto.billingInterval === 'MONTHLY') {
            periodEnd.setMonth(now.getMonth() + 1);
          }
      }


      const organization = await tx.organization.create({
        data: { name: dto.name },
      });

      await tx.membership.create({
        data: {
          userId: userId,
          organizationId: organization.id,
          roleType: OrganizationRole.OWNER,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          status: status,
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

  // Upgrading A Plan
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    if (membership?.roleType !== OrganizationRole.OWNER) {
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
        trialEndsAt: null,
        status: SubscriptionStatus.PENDING // Await payment for new plan
      }
    });
  }

  // Handle Trial Expiration
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async handleTrialExpiration() {
    const now = new Date();

    // Find all subscriptions that are currently on trial and expired
    const expiredTrials = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ONFREETRIAL,
        trialEndsAt: { lte: now },
      },
      include: { plan: true, organization: true },
    });

    for (const sub of expiredTrials) {
      // Decide next status
      let newStatus: SubscriptionStatus;

      if ((sub.plan.monthlyPrice || 0) > 0 || (sub.plan.yearlyPrice || 0) > 0) {
        // Payment required → mark PENDING
        newStatus = SubscriptionStatus.PENDING;
      } else {
        // Free plan (rare), mark ACTIVE
        newStatus = SubscriptionStatus.ACTIVE;
      }

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: newStatus,
          trialEndsAt: null, // trial is over
        },
      });

      this.logger.log(
        `Trial expired for subscription ${sub.id}, organization ${sub.organizationId}. New status: ${newStatus}`,
      );
    }

    return expiredTrials.length;

  }

  // Handle Subscription Expiration
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async handleSubscriptionExpiration() {
    const now = new Date();

    // Find all ACTIVE subscriptions where current period has ended
    const expiredSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { lte: now },
      },
      include: { plan: true, organization: true },
    });

    for (const sub of expiredSubs) {
      await this.prisma.$transaction(async (tx) => {
        // Generate invoice for next period
        const amount =
          sub.billingInterval === BillingInterval.YEARLY ? sub.plan.yearlyPrice : sub.plan.monthlyPrice;

        await tx.invoice.create({
          data: {
            organizationId: sub.organizationId,
            subscriptionId: sub.id,
            amount: amount || 0,
            currency: sub.plan.currency,
            status: (amount || 0) === 0 ? InvoiceStatus.PAID : InvoiceStatus.OPEN,
          },
        });

        // Move subscription period forward
        const newPeriodStart = sub.currentPeriodEnd;
        const newPeriodEnd = new Date(newPeriodStart);

        if (sub.billingInterval === BillingInterval.MONTHLY) {
          newPeriodEnd.setMonth(newPeriodStart.getMonth() + 1);
        } else if (sub.billingInterval === BillingInterval.YEARLY) {
          newPeriodEnd.setFullYear(newPeriodStart.getFullYear() + 1);
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
          },
        });

        this.logger.log(
          `Subscription period renewed for ${sub.id}, organization ${sub.organizationId}. New periodEnd: ${newPeriodEnd}`,
        );
      });
    }

    return expiredSubs.length;
  }


  // Handle Finding All the Organizations For the User
  async findAllForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      include: { subscription: { include: { plan: true } } }
    });
  }

  // Handle Finding One Organization
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

    // Getting all the users under the Organizations
    async getOrgMembers(orgId: string, userId: string) {
        await this.perm.verifyAccess(userId, orgId, 'USERS_VIEW');

        const members =  await this.prisma.membership.findMany({
            where: { organizationId: orgId },
            include: { role: { include: { permissions: true } } }
        });

        if (!members) {
            throw new Error("Cant get the members");
        }

        return members;
    }
}
