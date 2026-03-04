export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  ONFREETRIAL = 'ONFREETRIAL',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PlanType {
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum FeatureType {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  UNLIMITED = 'UNLIMITED',
  COUNT = 'COUNT',
  LIST = 'LIST',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

// --- Entity Interfaces ---

export interface IFeature {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  category?: string;
}

export interface IPlanFeature {
  planId: string;
  featureId: string;
  value?: string;
  overrideDescription?: string;
  feature?: IFeature; // Included via Prisma relations
}

export interface IPlan {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  badge?: string;
  sortOrder: number;
  type: PlanType;
  currency: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  setupFee?: number;
  trialDays?: number;
  isActive: boolean;
  isPublic: boolean;
  isLegacy: boolean;
  planFeatures?: IPlanFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface ISubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  hasFreeTrial: boolean;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
  plan?: IPlan; // Usually included in frontend views
}

export interface IOrganization {
  id: string;
  name: string;
  isActive: boolean;
  logoUrl?: string;
  timeZone?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  // Relations often included in responses
  subscription?: ISubscription;
  _count?: {
    memberships: number;
    invoices: number;
  };
}

export interface IMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  createdAt: string;
  organization?: IOrganization;
}

// --- Request DTOs (Matching your NestJS Controller) ---
export interface CreateOrganizationRequest {
  name: string;
  planId: string;
  billingInterval?: BillingInterval; // Optional because of the default value in DTO
}

export interface UpgradePlanRequest {
  newPlanId: string;
}

// --- Response Types ---
export type OrganizationDetailResponse = IOrganization & {
  subscription: ISubscription & { plan: IPlan };
};
