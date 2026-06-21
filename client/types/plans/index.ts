export enum PlanType {
  FREE = 'FREE',
  PRO = 'PAID',
}

export interface IFeature {
  id: string;
  key: string;
  name: string;
  description?: string;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
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

