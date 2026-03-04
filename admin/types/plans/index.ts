import { IFeature } from "../features";

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PAID',
}

export interface IPlanFeature {
  planId: string;
  featureId: string;
  value: string;
  overrideDescription?: string;
  feature?: IFeature;
}

export interface IPlan {
  id: string;
  slug: string;
  name: string;
  type: PlanType;
  tagline?: string;
  description?: string;
  badge?: string;
  sortOrder: number;
  currency: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  trialDays?: number;
  isActive: boolean;
  isPublic: boolean;
  planFeatures?: IPlanFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatureInput {
  featureId: string;
  value: string;
  overrideDescription?: string;
}

export interface CreatePlanRequest {
  slug: string;
  name: string;
  type: PlanType;
  tagline?: string;
  description?: string;
  badge?: string;
  sortOrder?: number;
  currency?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  trialDays?: number;
  isActive?: boolean;
  isPublic?: boolean;
  features?: PlanFeatureInput[];
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>;

export interface SyncFeaturesRequest {
  features: PlanFeatureInput[];
}
