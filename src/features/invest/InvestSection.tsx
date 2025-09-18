import React from 'react';
import dayjs from 'dayjs';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppState } from '../../context/AppStateContext';

const InvestSection: React.FC = () => {
  const { filteredInvest, state } = useAppState();
  const operations = filteredInvest;

  const total = operations.reduce((acc, op) => acc + op.amount, 0);
  const count = operations.length;

  const monthly = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const op of operations) {
      const month = dayjs(op.postedAt).format('YYYY-MM');
      map.set(month, (map.get(month) ?? 0) + op.amount);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, value]) => ({
        month: dayjs(month).format('MMM YY'),
        amount: Number(value.toFixed(2)),
      }));
  }, [operations]);

  return (
    <section className="column">
      <div className="card">
        <h2>Инвесткопилка</h2>
        <p className="hint">Раздел выключен из общих KPI по умолчанию. Используйте тумблер наверху для включения.</p>
        {!state.includeInvest ? (
          <p className="warning">Инвесткопилка выключена — включите сверху, если хотите учесть.</p>
        ) : null}
        <div className="kpi-grid">
          <div>
            <span className="label">Всего операций</span>
            <strong>{count}</strong>
          </div>
          <div>
            <span className="label">Сумма</span>
            <strong>{total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</strong>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Месячный тренд</h3>
        {monthly.length === 0 ? (
          <p className="placeholder">Пока нет операций копилки.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
              <Line type="monotone" dataKey="amount" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h3>Список операций</h3>
        {operations.length === 0 ? (
          <p className="placeholder">Операций нет.</p>
        ) : (
          <div className="table simple">
            <div className="table-header">
              <div>Дата</div>
              <div>Сумма</div>
              <div>Описание</div>
            </div>
            {operations.map((op) => (
              <div key={op.id} className="table-row">
                <div className="cell narrow">{op.postedAt}</div>
                <div className="cell amount expense">{op.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</div>
                <div className="cell description">{op.descriptionRaw}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InvestSection;
