import React from 'react';
import dayjs from 'dayjs';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppState } from '../../context/AppStateContext';
import { CategorizedOperation } from '../../lib/types';

interface RegularGroup {
  key: string;
  counterparty: string;
  normalized: string;
  roundedAmount: number;
  count: number;
  firstDate: string;
  lastDate: string;
}

export function buildRegulars(operations: CategorizedOperation[]): RegularGroup[] {
  const map = new Map<string, { ops: string[]; counterparty: string; normalized: string; amount: number[] }>();
  for (const op of operations) {
    const rounded = Math.round(Math.abs(op.amount));
    if (!op.counterpartyNormalized) continue;
    const key = `${op.counterpartyNormalized}|${rounded}`;
    const entry = map.get(key) ?? { ops: [], counterparty: op.counterparty ?? op.counterpartyNormalized, normalized: op.counterpartyNormalized, amount: [] };
    entry.ops.push(op.postedAt);
    entry.amount.push(op.amount);
    entry.counterparty = op.counterparty ?? entry.counterparty;
    map.set(key, entry);
  }

  const groups: RegularGroup[] = [];
  map.forEach((entry, key) => {
    if (entry.ops.length < 6) return;
    const sorted = entry.ops.sort();
    const firstDate = sorted[0];
    const lastDate = sorted[sorted.length - 1];
    if (dayjs(lastDate).diff(dayjs(firstDate), 'day') < 90) {
      return;
    }
    const roundedAmount = Math.round(
      entry.amount.reduce((acc, value) => acc + value, 0) / entry.amount.length,
    );
    groups.push({
      key,
      counterparty: entry.counterparty,
      normalized: entry.normalized,
      roundedAmount,
      count: entry.ops.length,
      firstDate,
      lastDate,
    });
  });
  return groups.sort((a, b) => b.count - a.count);
}

const RegularsSection: React.FC = () => {
  const { filteredActive } = useAppState();
  const groups = React.useMemo(() => buildRegulars(filteredActive), [filteredActive]);

  const chartData = groups.map((group) => ({
    name: group.counterparty.slice(0, 18),
    count: group.count,
  }));

  return (
    <section className="column">
      <div className="card">
        <h2>Регулярные операции</h2>
        <p className="hint">Определяются по ≥6 повторов за ≥90 дней с одинаковым контрагентом и суммой.</p>
        {groups.length === 0 ? (
          <p className="placeholder">Подписок не найдено.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Повторы" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h3>Детали подписок</h3>
        {groups.length === 0 ? (
          <p className="placeholder">Нет регулярных платежей.</p>
        ) : (
          <div className="table simple">
            <div className="table-header">
              <div>Контрагент</div>
              <div>Сумма</div>
              <div>Повторы</div>
              <div>Период</div>
            </div>
            {groups.map((group) => (
              <div key={group.key} className="table-row">
                <div className="cell description">
                  <div className="primary">{group.counterparty}</div>
                  <div className="secondary">{group.normalized}</div>
                </div>
                <div className="cell amount expense">{group.roundedAmount.toLocaleString('ru-RU')} ₽</div>
                <div className="cell narrow">{group.count}</div>
                <div className="cell">
                  {group.firstDate} → {group.lastDate}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RegularsSection;
