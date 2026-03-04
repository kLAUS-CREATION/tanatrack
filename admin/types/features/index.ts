export enum FeatureType {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  UNLIMITED = 'UNLIMITED',
  COUNT = 'COUNT',
  LIST = 'LIST',
}

export enum FeatureCategory {
  CORE = 'CORE',
  INVENTORY = 'INVENTORY',
  WAREHOUSING = 'WAREHOUSING',
  ORDERS = 'ORDERS',
  PURCHASE = 'PURCHASE',
  INTEGRATIONS = 'INTEGRATIONS',
  REPORTS = 'REPORTS',
  AUTOMATION = 'AUTOMATION',
  CUSTOMIZATION = 'CUSTOMIZATION',
  OTHER = 'OTHER',
}

export interface IFeature {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  category?: FeatureCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeatureRequest {
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  category?: FeatureCategory;
}

export type UpdateFeatureRequest = Partial<CreateFeatureRequest>;
