import React from 'react';
import { useAppState, createRuleFromCounterparty } from '../../context/AppStateContext';
import { CategorizedOperation } from '../../lib/types';
import CategorySelect from '../../components/CategorySelect';

interface AnomalyItem {
  operation: CategorizedOperation;
  reason: string;
}

function analyzeAnomalies(operations: CategorizedOperation[]): AnomalyItem[] {
  const byCategory = new Map<string, number[]>();
  operations.forEach((operation) => {
    if (operation.amount >= 0) return;
    const abs = Math.abs(operation.amount);
    const list = byCategory.get(operation.category) ?? [];
    list.push(abs);
    byCategory.set(operation.category, list);
  });

  const thresholds = new Map<string, { limit: number; percentile: number }>();
  byCategory.forEach((values, category) => {
    if (values.length < 4) {
      thresholds.set(category, { limit: Infinity, percentile: Infinity });
      return;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const limit = q3 + iqr * 1.5;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    thresholds.set(category, { limit, percentile: p95 });
  });

  const anomalies: AnomalyItem[] = [];
  operations.forEach((operation) => {
    if (operation.amount >= 0) return;
    const stats = thresholds.get(operation.category);
    if (!stats) return;
    const abs = Math.abs(operation.amount);
    if (abs >= stats.limit || abs >= stats.percentile) {
      anomalies.push({
        operation,
        reason: `Сумма ${abs.toLocaleString('ru-RU')} ₽ превосходит порог категории (${Math.round(
          Math.min(stats.limit, stats.percentile),
        ).toLocaleString('ru-RU')} ₽)`,
      });
    }
  });
  return anomalies;
}

const AnomaliesSection: React.FC = () => {
  const { filteredActive, dispatch } = useAppState();
  const anomalies = React.useMemo(() => analyzeAnomalies(filteredActive), [filteredActive]);
  const [selected, setSelected] = React.useState<CategorizedOperation | null>(null);

  const handleRule = (operation: CategorizedOperation) => {
    const counterparty = operation.counterparty ?? operation.counterpartyNormalized;
    if (!counterparty) return;
    const rule = createRuleFromCounterparty(counterparty, operation.category, operation.subcategory);
    dispatch({ type: 'UPSERT_RULE', payload: rule });
  };

  const handleOneOff = (operation: CategorizedOperation) => {
    const tags = new Set(operation.manualTags ?? []);
    if (tags.has('one-off')) {
      tags.delete('one-off');
    } else {
      tags.add('one-off');
    }
    dispatch({ type: 'SET_OPERATION_TAGS', payload: { id: operation.id, tags: Array.from(tags) } });
  };

  return (
    <section className="column">
      <div className="card">
        <h2>Аномальные операции</h2>
        <p className="hint">Ищем крупные списания на основе IQR и верхних 5% по категории.</p>
        {anomalies.length === 0 ? (
          <p className="placeholder">Выбросов не найдено.</p>
        ) : (
          <div className="table simple">
            <div className="table-header">
              <div>Дата</div>
              <div>Сумма</div>
              <div>Категория</div>
              <div>Контрагент</div>
              <div>Причина</div>
              <div>Действия</div>
            </div>
            {anomalies.map((item) => (
              <div key={item.operation.id} className="table-row">
                <div className="cell narrow">{item.operation.postedAt}</div>
                <div className="cell amount expense">{item.operation.amount.toLocaleString('ru-RU')}</div>
                <div className="cell">
                  {item.operation.category} → {item.operation.subcategory}
                </div>
                <div className="cell description">
                  <div className="primary">{item.operation.counterparty ?? item.operation.counterpartyNormalized}</div>
                  <div className="secondary">{item.reason}</div>
                </div>
                <div className="cell actions">
                  <button className="secondary" onClick={() => handleRule(item.operation)}>
                    Проверить правило
                  </button>
                  <button
                    className={item.operation.manualTags?.includes('one-off') ? 'secondary active' : 'secondary'}
                    onClick={() => handleOneOff(item.operation)}
                  >
                    Пометить разовое
                  </button>
                  <button className="link" onClick={() => setSelected(item.operation)}>
                    Изменить категорию
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected ? (
        <div className="card">
          <h3>Изменить категорию</h3>
          <CategorySelect
            value={{
              category: selected.manualCategory?.category ?? selected.category,
              subcategory: selected.manualCategory?.subcategory ?? selected.subcategory,
            }}
            onChange={(value) => dispatch({ type: 'SET_MANUAL_CATEGORY', payload: { id: selected.id, selection: value } })}
          />
          <div className="actions">
            <button className="primary" onClick={() => setSelected(null)}>
              Готово
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AnomaliesSection;
