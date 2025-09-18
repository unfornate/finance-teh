export type CurrencyCode = 'RUB' | string;

export interface Operation {
  id: string;
  externalId?: string;
  bank?: string;
  postedAt: string; // ISO date string
  operationAt?: string;
  amount: number;
  descriptionRaw: string;
  counterparty?: string;
  counterpartyNormalized: string;
  mcc?: string;
  currency: CurrencyCode;
  accountMask?: string;
  fingerprint: string;
  isInvest: boolean;
  manualCategory?: CategorySelection;
  manualTags?: string[];
}

export interface CategorySelection {
  category: string;
  subcategory: string;
}

export interface CategorizedOperation extends Operation {
  category: string;
  subcategory: string;
  categorySource: 'manual' | 'rule' | 'dictionary' | 'uncategorized';
}

export interface RulePattern {
  type: 'contains' | 'equals';
  value: string;
}

export interface CategorizationRule {
  id: string;
  label: string;
  patterns: RulePattern[];
  category: string;
  subcategory: string;
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDictionaryItem {
  category: string;
  subcategory: string;
}

export interface BaseDictionaryRule {
  patterns: string[];
  category: string;
  subcategory: string;
}

export interface FilterState {
  includePeriod: boolean;
  startDate?: string;
  endDate?: string;
  banks: string[];
  counterparties: string[];
  categories: string[];
  subcategories: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface LoadSummary {
  total: number;
  invest: number;
  main: number;
  duplicates: number;
  skipped: number;
}
