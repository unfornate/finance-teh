import React, { useContext, useMemo, useReducer } from 'react';
import { sha256 } from 'js-sha256';
import {
  CategorizedOperation,
  CategorizationRule,
  CategorySelection,
  FilterState,
  LoadSummary,
  Operation,
  RulePattern,
} from '../lib/types';
import { BASE_DICTIONARY } from '../data/baseDictionary';
import { cleanDescription, normalizeCounterparty } from '../lib/text';
import { ensureSubcategory } from '../data/categories';
import { applyFilters } from '../lib/filters';

type Action =
  | { type: 'LOAD_OPERATIONS'; payload: { operations: Operation[]; summary: LoadSummary } }
  | { type: 'UPSERT_RULE'; payload: CategorizationRule }
  | { type: 'DELETE_RULE'; payload: { id: string } }
  | { type: 'TOGGLE_RULE'; payload: { id: string; active: boolean } }
  | { type: 'SET_RULE_PRIORITY'; payload: { id: string; priority: number } }
  | { type: 'SET_INCLUDE_INVEST'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'SET_MANUAL_CATEGORY'; payload: { id: string; selection?: CategorySelection } }
  | { type: 'SET_OPERATION_TAGS'; payload: { id: string; tags: string[] } }
  | { type: 'RESET_STATE' }
  | { type: 'SET_RULE_PATTERNS'; payload: { id: string; patterns: RulePattern[] } };

export interface PersistedState {
  operations: Operation[];
  rules: CategorizationRule[];
  includeInvest: boolean;
  filters: FilterState;
  summary?: LoadSummary;
}

export interface AppState extends PersistedState {
  lastUpdated: string;
}

export const defaultFilters: FilterState = {
  includePeriod: false,
  startDate: undefined,
  endDate: undefined,
  banks: [],
  counterparties: [],
  categories: [],
  subcategories: [],
  minAmount: undefined,
  maxAmount: undefined,
  search: undefined,
};

const initialState: AppState = {
  operations: [],
  rules: [],
  includeInvest: false,
  filters: defaultFilters,
  summary: undefined,
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'finance-teh-state-v1';

function hydrateState(): AppState {
  if (typeof window === 'undefined') {
    return initialState;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }
    const parsed = JSON.parse(stored) as PersistedState;
    return {
      ...initialState,
      ...parsed,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to hydrate state', error);
    return initialState;
  }
}

function persistState(state: AppState) {
  if (typeof window === 'undefined') return;
  const payload: PersistedState = {
    operations: state.operations,
    rules: state.rules,
    includeInvest: state.includeInvest,
    filters: state.filters,
    summary: state.summary,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_OPERATIONS': {
      const nextOperations = dedupeWithExisting(state.operations, action.payload.operations);
      return {
        ...state,
        operations: nextOperations,
        summary: action.payload.summary,
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'UPSERT_RULE': {
      const rules = [...state.rules];
      const idx = rules.findIndex((rule) => rule.id === action.payload.id);
      if (idx >= 0) {
        rules[idx] = { ...action.payload, updatedAt: new Date().toISOString() };
      } else {
        rules.push(action.payload);
      }
      return { ...state, rules, lastUpdated: new Date().toISOString() };
    }
    case 'DELETE_RULE': {
      return {
        ...state,
        rules: state.rules.filter((rule) => rule.id !== action.payload.id),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'TOGGLE_RULE': {
      return {
        ...state,
        rules: state.rules.map((rule) =>
          rule.id === action.payload.id
            ? { ...rule, active: action.payload.active, updatedAt: new Date().toISOString() }
            : rule,
        ),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'SET_RULE_PRIORITY': {
      return {
        ...state,
        rules: state.rules.map((rule) =>
          rule.id === action.payload.id
            ? { ...rule, priority: action.payload.priority, updatedAt: new Date().toISOString() }
            : rule,
        ),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'SET_RULE_PATTERNS': {
      return {
        ...state,
        rules: state.rules.map((rule) =>
          rule.id === action.payload.id
            ? { ...rule, patterns: action.payload.patterns, updatedAt: new Date().toISOString() }
            : rule,
        ),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'SET_INCLUDE_INVEST': {
      return { ...state, includeInvest: action.payload, lastUpdated: new Date().toISOString() };
    }
    case 'SET_FILTERS': {
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'SET_MANUAL_CATEGORY': {
      return {
        ...state,
        operations: state.operations.map((op) =>
          op.id === action.payload.id ? { ...op, manualCategory: action.payload.selection } : op,
        ),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'SET_OPERATION_TAGS': {
      return {
        ...state,
        operations: state.operations.map((op) =>
          op.id === action.payload.id ? { ...op, manualTags: action.payload.tags } : op,
        ),
        lastUpdated: new Date().toISOString(),
      };
    }
    case 'RESET_STATE': {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  categorized: CategorizedOperation[];
  activeOperations: CategorizedOperation[];
  filteredActive: CategorizedOperation[];
  investOperations: CategorizedOperation[];
  filteredInvest: CategorizedOperation[];
  dispatch: React.Dispatch<Action>;
}

const AppStateContext = React.createContext<AppContextValue | undefined>(undefined);

function dedupeWithExisting(existing: Operation[], incoming: Operation[]): Operation[] {
  const externalIds = new Set(existing.map((op) => op.externalId).filter(Boolean) as string[]);
  const fingerprints = new Set(existing.map((op) => op.fingerprint));
  const merged = [...existing];
  for (const op of incoming) {
    if (op.externalId && externalIds.has(op.externalId)) {
      continue;
    }
    if (fingerprints.has(op.fingerprint)) {
      continue;
    }
    merged.push(op);
    if (op.externalId) {
      externalIds.add(op.externalId);
    }
    fingerprints.add(op.fingerprint);
  }
  return merged;
}

function applyCategorization(
  operations: Operation[],
  rules: CategorizationRule[],
): CategorizedOperation[] {
  const activeRules = [...rules.filter((rule) => rule.active)];
  activeRules.sort((a, b) => b.priority - a.priority);

  return operations.map((operation) => {
    if (operation.manualCategory) {
      return {
        ...operation,
        category: operation.manualCategory.category,
        subcategory: operation.manualCategory.subcategory,
        categorySource: 'manual',
      };
    }

    const normalizedCounterparty = operation.counterpartyNormalized.toLowerCase();
    const normalizedDescription = cleanDescription(operation.descriptionRaw);

    for (const rule of activeRules) {
      for (const pattern of rule.patterns) {
        const candidate = pattern.value.toLowerCase();
        if (pattern.type === 'equals') {
          if (
            normalizedCounterparty === candidate ||
            normalizedDescription === candidate ||
            normalizedDescription.includes(candidate)
          ) {
            const { category, subcategory } = ensureSubcategory(rule.category, rule.subcategory);
            return {
              ...operation,
              category,
              subcategory,
              categorySource: 'rule',
            };
          }
        } else {
          if (
            normalizedCounterparty.includes(candidate) ||
            normalizedDescription.includes(candidate)
          ) {
            const { category, subcategory } = ensureSubcategory(rule.category, rule.subcategory);
            return {
              ...operation,
              category,
              subcategory,
              categorySource: 'rule',
            };
          }
        }
      }
    }

    for (const entry of BASE_DICTIONARY) {
      const matches = entry.patterns.some((pattern) => {
        const loweredPattern = pattern.toLowerCase();
        return (
          normalizedCounterparty.includes(loweredPattern) ||
          normalizedDescription.includes(loweredPattern)
        );
      });
      if (matches) {
        const { category, subcategory } = ensureSubcategory(entry.category, entry.subcategory);
        return {
          ...operation,
          category,
          subcategory,
          categorySource: 'dictionary',
        };
      }
    }

    return {
      ...operation,
      category: 'Не уточнено',
      subcategory: 'Не уточнено',
      categorySource: 'uncategorized',
    };
  });
}

export const AppStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, hydrateState);

  React.useEffect(() => {
    persistState(state);
  }, [state]);

  const categorized = useMemo(
    () => applyCategorization(state.operations, state.rules),
    [state.operations, state.rules],
  );

  const activeOperations = useMemo(() => {
    if (state.includeInvest) {
      return categorized;
    }
    return categorized.filter((op) => !op.isInvest);
  }, [categorized, state.includeInvest]);

  const investOperations = useMemo(
    () => categorized.filter((op) => op.isInvest),
    [categorized],
  );

  const filteredActive = useMemo(
    () => applyFilters(activeOperations, state.filters),
    [activeOperations, state.filters],
  );

  const filteredInvest = useMemo(
    () => applyFilters(investOperations, state.filters),
    [investOperations, state.filters],
  );

  const value = useMemo(
    () => ({ state, dispatch, categorized, activeOperations, filteredActive, investOperations, filteredInvest }),
    [state, categorized, activeOperations, filteredActive, investOperations, filteredInvest],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export function useAppState(): AppContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

export function createRuleFromCounterparty(
  counterparty: string,
  category: string,
  subcategory: string,
): CategorizationRule {
  const normalized = normalizeCounterparty(counterparty).toLowerCase();
  const basePatterns: RulePattern[] = [
    { type: 'contains', value: normalized },
  ];
  if (normalized.length > 2) {
    basePatterns.push({ type: 'equals', value: normalized });
    basePatterns.push({ type: 'contains', value: normalized.replace(/\*/g, '') });
  }
  const now = new Date().toISOString();
  return {
    id: `rule-${sha256(now + normalized).slice(0, 10)}`,
    label: counterparty,
    patterns: basePatterns,
    category,
    subcategory,
    active: true,
    priority: 100,
    createdAt: now,
    updatedAt: now,
  };
}
