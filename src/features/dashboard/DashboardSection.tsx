import React from 'react';
import dayjs from 'dayjs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppState } from '../../context/AppStateContext';
import { CategorizedOperation } from '../../lib/types';

interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  net: number;
}

function computeMonthlyStats(operations: CategorizedOperation[]): MonthlyStats[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const operation of operations) {
    const month = dayjs(operation.postedAt).format('YYYY-MM');
    const entry = map.get(month) ?? { income: 0, expense: 0 };
    if (operation.amount >= 0) {
      entry.income += operation.amount;
    } else {
      entry.expense += operation.amount; // negative
    }
    map.set(month, entry);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, value]) => ({
      month,
      income: value.income,
      expense: value.expense,
      net: value.income + value.expense,
    }));
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`;
}

const DashboardSection: React.FC = () => {
  const { filteredActive } = useAppState();
  const operations = filteredActive;
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const analytics = React.useMemo(() => {
    const monthly = computeMonthlyStats(operations);
    const categoryTotals = new Map<string, number>();
    const subcategoryTotals = new Map<string, Map<string, number>>();
    const counterparties = new Map<string, { amount: number; count: number }>();

    for (const operation of operations) {
      const absAmount = Math.abs(operation.amount);
      if (operation.amount < 0) {
        categoryTotals.set(
          operation.category,
          (categoryTotals.get(operation.category) ?? 0) + absAmount,
        );
        const subMap = subcategoryTotals.get(operation.category) ?? new Map<string, number>();
        subMap.set(operation.subcategory, (subMap.get(operation.subcategory) ?? 0) + absAmount);
        subcategoryTotals.set(operation.category, subMap);
      }
      const cp = operation.counterpartyNormalized || '—';
      const entry = counterparties.get(cp) ?? { amount: 0, count: 0 };
      entry.amount += absAmount;
      entry.count += 1;
      counterparties.set(cp, entry);
    }

    const counterpartyList = Array.from(counterparties.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 10)
      .map(([name, info]) => ({
        name,
        amount: Number(info.amount.toFixed(2)),
        count: info.count,
      }));

    return { monthly, categoryTotals, subcategoryTotals, counterpartyList };
  }, [operations]);

  const monthlyStats = analytics.monthly;
  const totalIncome = monthlyStats.reduce((acc, item) => acc + item.income, 0);
  const totalExpense = monthlyStats.reduce((acc, item) => acc + item.expense, 0); // expense negative
  const net = totalIncome + totalExpense;
  const monthCount = monthlyStats.length || 1;
  const avgIncome = totalIncome / monthCount;
  const avgExpense = Math.abs(totalExpense / monthCount);
  const medianIncome = calculateMedian(monthlyStats.map((item) => item.income));
  const medianExpense = Math.abs(calculateMedian(monthlyStats.map((item) => item.expense)));
  const minExpense = monthlyStats.length ? Math.min(...monthlyStats.map((item) => item.expense)) : 0;
  const maxExpense = monthlyStats.length ? Math.max(...monthlyStats.map((item) => item.expense)) : 0;

  const pieData = React.useMemo(() => {
    if (selectedCategory) {
      const map = analytics.subcategoryTotals.get(selectedCategory) ?? new Map<string, number>();
      return Array.from(map.entries()).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }));
    }
    return Array.from(analytics.categoryTotals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [analytics.categoryTotals, analytics.subcategoryTotals, selectedCategory]);

  const counterpartyData = analytics.counterpartyList;

  React.useEffect(() => {
    if (operations.length === 0) {
      setSelectedCategory(null);
    }
  }, [operations.length]);

  if (operations.length === 0) {
    return (
      <section className="card">
        <h2>Дашборд</h2>
        <p className="placeholder">Нет данных — загрузите CSV или проверьте фильтры.</p>
      </section>
    );
  }

  const monthlyChartData = monthlyStats.map((item) => ({
    month: dayjs(item.month).format('MMM YY'),
    income: Number(item.income.toFixed(2)),
    expense: Number(Math.abs(item.expense).toFixed(2)),
    net: Number(item.net.toFixed(2)),
  }));

  return (
    <section className="grid-layout">
      <div className="card span-2">
        <h2>KPI</h2>
        <div className="kpi-grid">
          <div>
            <span className="label">Расходы</span>
            <strong>{formatCurrency(Math.abs(totalExpense))}</strong>
            <small>Среднее: {formatCurrency(avgExpense)}</small>
            <small>Медиана: {formatCurrency(Math.abs(medianExpense))}</small>
            <small>Минимум мес: {formatCurrency(Math.abs(minExpense))}</small>
            <small>Максимум мес: {formatCurrency(Math.abs(maxExpense))}</small>
          </div>
          <div>
            <span className="label">Доходы</span>
            <strong>{formatCurrency(totalIncome)}</strong>
            <small>Среднее: {formatCurrency(avgIncome)}</small>
            <small>Медиана: {formatCurrency(medianIncome)}</small>
          </div>
          <div>
            <span className="label">Чистый поток</span>
            <strong>{formatCurrency(net)}</strong>
            <small>Месяцев в выборке: {monthCount}</small>
          </div>
        </div>
      </div>
      <div className="card span-2">
        <h2>P&amp;L по месяцам</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" name="Доходы" fill="#10b981" />
            <Bar dataKey="expense" name="Расходы" fill="#ef4444" />
            <Line type="monotone" dataKey="net" name="Нетто" stroke="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Структура расходов</h2>
          {selectedCategory ? (
            <button className="secondary" onClick={() => setSelectedCategory(null)}>
              Назад к категориям
            </button>
          ) : null}
        </div>
        {pieData.length === 0 ? (
          <p className="placeholder">Нет расходных операций для построения структуры.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                dataKey="value"
                data={pieData}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                onClick={(data) => {
                  if (!selectedCategory) {
                    setSelectedCategory(data.name);
                  }
                }}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2>Топ контрагентов</h2>
        {counterpartyData.length === 0 ? (
          <p className="placeholder">Нет операций для анализа.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={counterpartyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={160} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" name="Сумма" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default DashboardSection;
