import { IPlan } from "../plans";

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  ONFREETRIAL = 'ONFREETRIAL',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
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
  plan?: IPlan; // Populated via include
  createdAt: string;
  updatedAt: string;
}

export interface IMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface IOrganization {
  id: string;
  name: string;
  isActive: boolean;
  logoUrl?: string;
  timeZone?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  subscription?: ISubscription;
  memberships?: IMembership[];
  /** The current user's role in this organization (set by the list endpoint). */
  roleType?: OrganizationRole | null;
}

// Request Types (Matching your NestJS DTOs)
export interface CreateOrganizationRequest {
  name: string;
  planId: string;
  billingInterval?: BillingInterval;
}

export interface UpgradePlanRequest {
  newPlanId: string;
}
