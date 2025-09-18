import React from 'react';
import { useAppState, createRuleFromCounterparty } from '../../context/AppStateContext';
import { CategorizedOperation, CategorySelection, CategorizationRule } from '../../lib/types';
import CategorySelect from '../../components/CategorySelect';
import { ensureSubcategory } from '../../data/categories';

interface CounterpartyStat {
  id: string;
  counterparty: string;
  normalized: string;
  amount: number;
  income: number;
  expense: number;
  count: number;
  sample: CategorizedOperation;
}

function suggestCategory(normalized: string): CategorySelection {
  const lower = normalized.toLowerCase();
  if (lower.includes('ozon') || lower.includes('market') || lower.includes('wb') || lower.includes('wildberries')) {
    return ensureSubcategory('Шопинг', 'Шопинг: маркетплейсы');
  }
  if (lower.includes('taxi') || lower.includes('taks') || lower.includes('yandex')) {
    return ensureSubcategory('Транспорт', 'Транспорт: такси');
  }
  if (lower.includes('netflix') || lower.includes('youtube') || lower.includes('ivi') || lower.includes('okko')) {
    return ensureSubcategory('Подписки', 'Подписки: телеграм');
  }
  if (lower.includes('mts') || lower.includes('tele2') || lower.includes('beeline')) {
    return ensureSubcategory('Связь', 'Связь: мобильная');
  }
  if (lower.includes('apteka')) {
    return ensureSubcategory('Здоровье', 'Здоровье: услуги');
  }
  return ensureSubcategory('Не уточнено', 'Не уточнено');
}

const CounterpartiesSection: React.FC = () => {
  const { filteredActive, dispatch, state } = useAppState();
  const [selection, setSelection] = React.useState<CounterpartyStat | null>(null);
  const [categoryDraft, setCategoryDraft] = React.useState<CategorySelection>(ensureSubcategory('Не уточнено', 'Не уточнено'));
  const [importError, setImportError] = React.useState<string | null>(null);

  const stats = React.useMemo(() => {
    const map = new Map<string, CounterpartyStat>();
    for (const operation of filteredActive) {
      const normalized = operation.counterpartyNormalized || '—';
      const counterparty = operation.counterparty ?? normalized;
      const entry = map.get(normalized);
      if (entry) {
        entry.amount += operation.amount;
        if (operation.amount >= 0) {
          entry.income += operation.amount;
        } else {
          entry.expense += operation.amount;
        }
        entry.count += 1;
      } else {
        map.set(normalized, {
          id: `cp-${normalized}`,
          counterparty,
          normalized,
          amount: operation.amount,
          income: operation.amount >= 0 ? operation.amount : 0,
          expense: operation.amount < 0 ? operation.amount : 0,
          count: 1,
          sample: operation,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => Math.abs(b.expense) - Math.abs(a.expense));
  }, [filteredActive]);

  const totalExpense = stats.reduce((acc, item) => acc + item.expense, 0);
  const totalIncome = stats.reduce((acc, item) => acc + item.income, 0);

  const handlePick = (stat: CounterpartyStat) => {
    setSelection(stat);
    setCategoryDraft(suggestCategory(stat.normalized));
  };

  const handleCreateRule = () => {
    if (!selection) return;
    const rule = createRuleFromCounterparty(selection.counterparty, categoryDraft.category, categoryDraft.subcategory);
    dispatch({ type: 'UPSERT_RULE', payload: rule });
    setSelection(null);
  };

  const handleExport = () => {
    const content = JSON.stringify(state.rules, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance-rules.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as CategorizationRule[];
      parsed.forEach((rule) => {
        dispatch({ type: 'UPSERT_RULE', payload: { ...rule, id: rule.id || `rule-${Date.now()}` } });
      });
      setImportError(null);
    } catch (error) {
      console.error(error);
      setImportError('Не удалось прочитать JSON со словарём правил');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section className="column">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Контрагенты</h2>
            <p className="hint">
              Всего: {stats.length}. Расходы: {Math.abs(totalExpense).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ · Доходы: {totalIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </p>
          </div>
          <div className="inline">
            <button className="secondary" onClick={handleExport}>
              Экспорт правил
            </button>
            <label className="secondary file-input small">
              <input type="file" accept="application/json" onChange={handleImport} />
              <span>Импорт JSON</span>
            </label>
          </div>
        </div>
        {importError && <p className="warning">{importError}</p>}
        <div className="table simple">
          <div className="table-header">
            <div>Контрагент</div>
            <div>Операции</div>
            <div>Расходы</div>
            <div>Доходы</div>
            <div>Действия</div>
          </div>
          {stats.map((stat) => (
            <div key={stat.id} className="table-row">
              <div className="cell description">
                <div className="primary">{stat.counterparty}</div>
                <div className="secondary">{stat.normalized}</div>
              </div>
              <div className="cell narrow">{stat.count}</div>
              <div className="cell amount expense">{Math.abs(stat.expense).toLocaleString('ru-RU')}</div>
              <div className="cell amount income">{stat.income.toLocaleString('ru-RU')}</div>
              <div className="cell actions">
                <button className="secondary" onClick={() => handlePick(stat)}>
                  Сделать правило
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selection ? (
        <div className="card">
          <h3>Новое правило для {selection.counterparty}</h3>
          <p className="hint">Правило сразу применится ко всем операциям.</p>
          <CategorySelect value={categoryDraft} onChange={setCategoryDraft} />
          <div className="actions">
            <button className="primary" onClick={handleCreateRule}>
              Сохранить правило
            </button>
            <button className="secondary" onClick={() => setSelection(null)}>
              Отмена
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CounterpartiesSection;
