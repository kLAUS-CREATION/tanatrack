export enum FeatureType {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  LIST = 'LIST',
}

export enum FeatureCategory {
  AI = 'AI',
  INVENTORY = 'INVENTORY',
  WAREHOUSING = 'WAREHOUSING',
  ORDERS = 'ORDERS',
  PURCHASE = 'PURCHASE',
  REPORTS = 'REPORTS',
  HELP = 'HELP',
  USERS = 'USERS',
  SUPPLIERS = 'SUPPLIERS',
  SALES = 'SALES',
  PRODUCTS = 'PRODUCTS'
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
