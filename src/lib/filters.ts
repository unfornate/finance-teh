import dayjs from 'dayjs';
import { CategorizedOperation, FilterState } from './types';

export function applyFilters(
  operations: CategorizedOperation[],
  filters: FilterState,
): CategorizedOperation[] {
  return operations.filter((operation) => {
    if (filters.includePeriod) {
      const date = dayjs(operation.postedAt);
      if (filters.startDate && date.isBefore(dayjs(filters.startDate))) {
        return false;
      }
      if (filters.endDate && date.isAfter(dayjs(filters.endDate))) {
        return false;
      }
    }
    if (filters.banks.length > 0) {
      if (!operation.bank || !filters.banks.includes(operation.bank)) {
        return false;
      }
    }
    if (filters.counterparties.length > 0) {
      if (!filters.counterparties.includes(operation.counterpartyNormalized)) {
        return false;
      }
    }
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(operation.category)) {
        return false;
      }
    }
    if (filters.subcategories.length > 0) {
      if (!filters.subcategories.includes(operation.subcategory)) {
        return false;
      }
    }
    if (filters.minAmount !== undefined && Math.abs(operation.amount) < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && Math.abs(operation.amount) > filters.maxAmount) {
      return false;
    }
    if (filters.search && filters.search.trim().length > 0) {
      const query = filters.search.trim().toLowerCase();
      const haystack = `${operation.descriptionRaw} ${operation.counterpartyNormalized}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}
