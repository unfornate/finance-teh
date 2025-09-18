import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useAppState, createRuleFromCounterparty, defaultFilters } from '../../context/AppStateContext';
import { CategorySelection, CategorizedOperation } from '../../lib/types';
import CategorySelect from '../../components/CategorySelect';
import { listCategories, listSubcategories } from '../../data/categories';

interface RowData {
  operations: CategorizedOperation[];
  onCategoryChange: (id: string, value?: CategorySelection) => void;
  onCreateRule: (operation: CategorizedOperation) => void;
  onToggleOneOff: (operation: CategorizedOperation) => void;
}

const OperationsRow: React.FC<ListChildComponentProps<RowData>> = ({ index, style, data }) => {
  const operation = data.operations[index];
  const manualValue: CategorySelection = operation.manualCategory ?? {
    category: operation.category,
    subcategory: operation.subcategory,
  };

  const amountDisplay = operation.amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
  });

  const handleCategoryChange = (value: CategorySelection) => {
    data.onCategoryChange(operation.id, value);
  };

  const handleClear = () => {
    data.onCategoryChange(operation.id, undefined);
  };

  return (
    <div className="table-row" style={style}>
      <div className="cell narrow">{operation.postedAt}</div>
      <div className={`cell amount ${operation.amount < 0 ? 'expense' : 'income'}`}>{amountDisplay}</div>
      <div className="cell narrow">{operation.bank ?? '—'}</div>
      <div className="cell description">
        <div className="primary">{operation.descriptionRaw}</div>
        <div className="secondary">{operation.counterparty ?? operation.counterpartyNormalized ?? '—'}</div>
      </div>
      <div className="cell">
        <CategorySelect value={manualValue} onChange={handleCategoryChange} />
        {operation.manualCategory ? (
          <button className="link" onClick={handleClear}>
            Сбросить
          </button>
        ) : null}
        <small className="hint">Источник: {translateSource(operation.categorySource)}</small>
      </div>
      <div className="cell actions">
        <button onClick={() => data.onCreateRule(operation)} className="secondary">
          Создать правило
        </button>
        <button onClick={() => data.onToggleOneOff(operation)} className={operation.manualTags?.includes('one-off') ? 'secondary active' : 'secondary'}>
          Разовое
        </button>
      </div>
    </div>
  );
};

function translateSource(source: CategorizedOperation['categorySource']): string {
  switch (source) {
    case 'manual':
      return 'ручная правка';
    case 'rule':
      return 'правило';
    case 'dictionary':
      return 'словарь';
    default:
      return 'не определено';
  }
}

const OperationsSection: React.FC = () => {
  const { filteredActive, dispatch, state, categorized } = useAppState();
  const operations = filteredActive;
  const filters = state.filters;

  const handleCategoryChange = (id: string, value?: CategorySelection) => {
    dispatch({ type: 'SET_MANUAL_CATEGORY', payload: { id, selection: value } });
  };

  const handleCreateRule = (operation: CategorizedOperation) => {
    const counterparty = operation.counterparty ?? operation.counterpartyNormalized;
    if (!counterparty) return;
    const rule = createRuleFromCounterparty(counterparty, operation.category, operation.subcategory);
    dispatch({ type: 'UPSERT_RULE', payload: rule });
  };

  const handleToggleOneOff = (operation: CategorizedOperation) => {
    const tags = new Set(operation.manualTags ?? []);
    if (tags.has('one-off')) {
      tags.delete('one-off');
    } else {
      tags.add('one-off');
    }
    dispatch({ type: 'SET_OPERATION_TAGS', payload: { id: operation.id, tags: Array.from(tags) } });
  };

  const totals = React.useMemo(() => {
    const expense = operations.filter((op) => op.amount < 0).reduce((acc, op) => acc + op.amount, 0);
    const income = operations.filter((op) => op.amount >= 0).reduce((acc, op) => acc + op.amount, 0);
    return { expense, income };
  }, [operations]);

  const availableBanks = React.useMemo(() => {
    return Array.from(new Set(categorized.map((op) => op.bank).filter((bank): bank is string => Boolean(bank))));
  }, [categorized]);

  const availableCounterparties = React.useMemo(() => {
    return Array.from(
      new Set(
        categorized
          .map((op) => op.counterpartyNormalized)
          .filter((name): name is string => Boolean(name) && name !== '—'),
      ),
    );
  }, [categorized]);

  const handleMultiSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: 'banks' | 'counterparties' | 'categories' | 'subcategories',
  ) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    dispatch({ type: 'SET_FILTERS', payload: { [key]: values } });
  };

  const handleAmountChange = (key: 'minAmount' | 'maxAmount', value: string) => {
    const numeric = value === '' ? undefined : Number(value);
    dispatch({ type: 'SET_FILTERS', payload: { [key]: numeric } });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FILTERS', payload: { search: event.target.value } });
  };

  const handleDateToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FILTERS', payload: { includePeriod: event.target.checked } });
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { [key]: value || undefined } });
  };

  const handleResetFilters = () => {
    dispatch({ type: 'SET_FILTERS', payload: { ...defaultFilters } });
  };

  return (
    <section className="column">
      <div className="card filters">
        <h2>Фильтры</h2>
        <div className="filters-grid">
          <label>
            <span>Период</span>
            <div className="inline">
              <input type="checkbox" checked={filters.includePeriod} onChange={handleDateToggle} />
              <span>Включить фильтр по дате</span>
            </div>
            {filters.includePeriod ? (
              <div className="period-inputs">
                <input type="date" value={filters.startDate ?? ''} onChange={(event) => handleDateChange('startDate', event.target.value)} />
                <input type="date" value={filters.endDate ?? ''} onChange={(event) => handleDateChange('endDate', event.target.value)} />
              </div>
            ) : null}
          </label>
          <label>
            <span>Банк</span>
            <select multiple value={filters.banks} onChange={(event) => handleMultiSelect(event, 'banks')}>
              {availableBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Контрагенты</span>
            <select multiple value={filters.counterparties} onChange={(event) => handleMultiSelect(event, 'counterparties')}>
              {availableCounterparties.map((cp) => (
                <option key={cp} value={cp}>
                  {cp}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Категория</span>
            <select multiple value={filters.categories} onChange={(event) => handleMultiSelect(event, 'categories')}>
              {listCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Подкатегория</span>
            <select
              multiple
              value={filters.subcategories}
              onChange={(event) => handleMultiSelect(event, 'subcategories')}
            >
              {listCategories().flatMap((category) =>
                listSubcategories(category).map((sub) => (
                  <option key={`${category}-${sub}`} value={sub}>
                    {sub}
                  </option>
                )),
              )}
            </select>
          </label>
          <label>
            <span>Сумма от</span>
            <input
              type="number"
              value={filters.minAmount ?? ''}
              onChange={(event) => handleAmountChange('minAmount', event.target.value)}
            />
          </label>
          <label>
            <span>Сумма до</span>
            <input
              type="number"
              value={filters.maxAmount ?? ''}
              onChange={(event) => handleAmountChange('maxAmount', event.target.value)}
            />
          </label>
          <label>
            <span>Поиск по описанию</span>
            <input type="search" value={filters.search ?? ''} onChange={handleSearchChange} placeholder="Текст, телефон, комментарий" />
          </label>
        </div>
        <div className="actions">
          <button onClick={handleResetFilters} className="secondary">
            Сбросить фильтры
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Операции</h2>
            <p className="hint">
              {operations.length} строк. Расходы: {Math.abs(totals.expense).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ · Доходы: {totals.income.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </p>
          </div>
        </div>
        {operations.length === 0 ? (
          <p className="placeholder">Нет операций с учётом текущих фильтров.</p>
        ) : (
          <div className="table-container">
            <AutoSizer disableHeight>
              {({ width }) => (
                <List
                  height={480}
                  itemCount={operations.length}
                  itemSize={120}
                  width={width}
                  itemData={{
                    operations,
                    onCategoryChange: handleCategoryChange,
                    onCreateRule: handleCreateRule,
                    onToggleOneOff: handleToggleOneOff,
                  }}
                >
                  {OperationsRow}
                </List>
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    </section>
  );
};

export default OperationsSection;
