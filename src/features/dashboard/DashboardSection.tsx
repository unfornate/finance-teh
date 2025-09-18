import React from 'react';
import dayjs from 'dayjs';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppState } from '../../context/AppStateContext';
import { CategorizedOperation } from '../../lib/types';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const LINE_COLORS = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#0ea5e9'];

const AMOUNT_BUCKETS = [
  { key: 'b0', label: 'до 100 ₽', min: 0, max: 100 },
  { key: 'b1', label: '100–300 ₽', min: 100, max: 300 },
  { key: 'b2', label: '300–500 ₽', min: 300, max: 500 },
  { key: 'b3', label: '500–1 000 ₽', min: 500, max: 1000 },
  { key: 'b4', label: '1–2 тыс. ₽', min: 1000, max: 2000 },
  { key: 'b5', label: '2–5 тыс. ₽', min: 2000, max: 5000 },
  { key: 'b6', label: '5–10 тыс. ₽', min: 5000, max: 10000 },
  { key: 'b7', label: '10–20 тыс. ₽', min: 10000, max: 20000 },
  { key: 'b8', label: '20–50 тыс. ₽', min: 20000, max: 50000 },
  { key: 'b9', label: '50 тыс.+ ₽', min: 50000, max: Number.POSITIVE_INFINITY },
] as const;

interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface DailyFlowEntry {
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
}

interface WeekdayStat {
  weekday: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

interface HistogramEntry {
  bucket: string;
  count: number;
  avg: number;
  amount: number;
}

interface CategoryTrend {
  categories: string[];
  data: Array<Record<string, string | number>>;
}

interface AnalyticsResult {
  monthly: MonthlyStats[];
  categoryTotals: Map<string, number>;
  subcategoryTotals: Map<string, Map<string, number>>;
  counterpartyList: Array<{ name: string; amount: number; count: number }>;
  dailyFlow: DailyFlowEntry[];
  weekdayStats: WeekdayStat[];
  histogram: HistogramEntry[];
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
  uniqueDays: number;
  biggestIncome: CategorizedOperation | null;
  biggestExpense: CategorizedOperation | null;
  categoryTrend: CategoryTrend;
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

function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })} ₽`;
}

type AmountBucket = (typeof AMOUNT_BUCKETS)[number];

function resolveAmountBucket(value: number): AmountBucket['key'] {
  for (const bucket of AMOUNT_BUCKETS) {
    if (value >= bucket.min && value < bucket.max) {
      return bucket.key;
    }
  }
  return AMOUNT_BUCKETS[AMOUNT_BUCKETS.length - 1].key;
}

function buildAnalytics(operations: CategorizedOperation[]): AnalyticsResult {
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const categoryTotals = new Map<string, number>();
  const subcategoryTotals = new Map<string, Map<string, number>>();
  const counterparties = new Map<string, { amount: number; count: number }>();
  const categoryMonthly = new Map<string, Map<string, number>>();
  const dailyMap = new Map<string, { income: number; expense: number }>();
  const weekdayMap = new Map<number, { income: number; expense: number; count: number }>();
  const histogramMap = new Map<AmountBucket['key'], { count: number; total: number }>();
  const daySet = new Set<string>();
  const monthSet = new Set<string>();

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let biggestIncome: CategorizedOperation | null = null;
  let biggestExpense: CategorizedOperation | null = null;

  for (const operation of operations) {
    const month = dayjs(operation.postedAt).format('YYYY-MM');
    monthSet.add(month);
    daySet.add(operation.postedAt);

    const monthlyEntry = monthlyMap.get(month) ?? { income: 0, expense: 0 };
    const dailyEntry = dailyMap.get(operation.postedAt) ?? { income: 0, expense: 0 };
    const weekdayIndex = (dayjs(operation.postedAt).day() + 6) % 7;
    const weekdayEntry = weekdayMap.get(weekdayIndex) ?? { income: 0, expense: 0, count: 0 };

    if (operation.amount >= 0) {
      monthlyEntry.income += operation.amount;
      dailyEntry.income += operation.amount;
      weekdayEntry.income += operation.amount;
      totalIncome += operation.amount;
      incomeCount += 1;
      if (!biggestIncome || operation.amount > biggestIncome.amount) {
        biggestIncome = operation;
      }
    } else {
      monthlyEntry.expense += operation.amount;
      dailyEntry.expense += operation.amount;
      weekdayEntry.expense += operation.amount;
      totalExpense += operation.amount;
      expenseCount += 1;
      if (!biggestExpense || operation.amount < biggestExpense.amount) {
        biggestExpense = operation;
      }
      const absAmount = Math.abs(operation.amount);
      categoryTotals.set(
        operation.category,
        (categoryTotals.get(operation.category) ?? 0) + absAmount,
      );
      const subMap = subcategoryTotals.get(operation.category) ?? new Map<string, number>();
      subMap.set(operation.subcategory, (subMap.get(operation.subcategory) ?? 0) + absAmount);
      subcategoryTotals.set(operation.category, subMap);

      const categoryMonth = categoryMonthly.get(operation.category) ?? new Map<string, number>();
      categoryMonth.set(month, (categoryMonth.get(month) ?? 0) + absAmount);
      categoryMonthly.set(operation.category, categoryMonth);

      const bucketKey = resolveAmountBucket(absAmount);
      const bucketEntry = histogramMap.get(bucketKey) ?? { count: 0, total: 0 };
      bucketEntry.count += 1;
      bucketEntry.total += absAmount;
      histogramMap.set(bucketKey, bucketEntry);
    }

    const counterpartyName =
      operation.counterpartyNormalized || operation.counterparty || '—';
    const counterpartyEntry = counterparties.get(counterpartyName) ?? { amount: 0, count: 0 };
    counterpartyEntry.amount += Math.abs(operation.amount);
    counterpartyEntry.count += 1;
    counterparties.set(counterpartyName, counterpartyEntry);

    monthlyMap.set(month, monthlyEntry);
    dailyMap.set(operation.postedAt, dailyEntry);
    weekdayEntry.count += 1;
    weekdayMap.set(weekdayIndex, weekdayEntry);
  }

  const monthly: MonthlyStats[] = Array.from(monthlyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, value]) => ({
      month,
      income: Number(value.income.toFixed(2)),
      expense: Number(value.expense.toFixed(2)),
      net: Number((value.income + value.expense).toFixed(2)),
    }));

  const counterpartyList = Array.from(counterparties.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10)
    .map(([name, info]) => ({
      name,
      amount: Number(info.amount.toFixed(2)),
      count: info.count,
    }));

  const dailyFlow: DailyFlowEntry[] = Array.from(dailyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .reduce<DailyFlowEntry[]>((acc, [date, value]) => {
      const net = value.income + value.expense;
      const cumulative = (acc[acc.length - 1]?.cumulative ?? 0) + net;
      acc.push({
        date,
        label: dayjs(date).format('DD MMM'),
        income: Number(value.income.toFixed(2)),
        expense: Number(Math.abs(value.expense).toFixed(2)),
        net: Number(net.toFixed(2)),
        cumulative: Number(cumulative.toFixed(2)),
      });
      return acc;
    }, []);

  const weekdayStats: WeekdayStat[] = WEEKDAY_LABELS.map((label, index) => {
    const entry = weekdayMap.get(index) ?? { income: 0, expense: 0, count: 0 };
    return {
      weekday: label,
      income: Number(entry.income.toFixed(2)),
      expense: Number(Math.abs(entry.expense).toFixed(2)),
      net: Number((entry.income + entry.expense).toFixed(2)),
      count: entry.count,
    };
  });

  const histogram: HistogramEntry[] = AMOUNT_BUCKETS.map((bucket) => {
    const entry = histogramMap.get(bucket.key);
    const count = entry?.count ?? 0;
    const amount = entry?.total ?? 0;
    return {
      bucket: bucket.label,
      count,
      avg: count > 0 ? Number((amount / count).toFixed(2)) : 0,
      amount: Number(amount.toFixed(2)),
    };
  });

  const monthsSorted = Array.from(monthSet).sort((a, b) => (a < b ? -1 : 1));
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const categoryTrend: CategoryTrend = {
    categories: topCategories,
    data: monthsSorted.map((month) => {
      const base: Record<string, string | number> = {
        month,
        label: dayjs(month).format('MMM YY'),
      };
      for (const category of topCategories) {
        const value = categoryMonthly.get(category)?.get(month) ?? 0;
        base[category] = Number(value.toFixed(2));
      }
      return base;
    }),
  };

  return {
    monthly,
    categoryTotals,
    subcategoryTotals,
    counterpartyList,
    dailyFlow,
    weekdayStats,
    histogram,
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    incomeCount,
    expenseCount,
    uniqueDays: daySet.size,
    biggestIncome,
    biggestExpense,
    categoryTrend,
  };
}

const DashboardSection: React.FC = () => {
  const { filteredActive } = useAppState();
  const operations = filteredActive;
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const analytics = React.useMemo(() => buildAnalytics(operations), [operations]);

  const monthlyStats = analytics.monthly;
  const totalIncome = analytics.totalIncome;
  const totalExpense = analytics.totalExpense;
  const net = totalIncome + totalExpense;
  const monthCount = monthlyStats.length || 1;
  const avgIncome = monthCount ? totalIncome / monthCount : 0;
  const avgExpense = monthCount ? Math.abs(totalExpense) / monthCount : 0;
  const medianIncome = calculateMedian(monthlyStats.map((item) => item.income));
  const medianExpense = Math.abs(calculateMedian(monthlyStats.map((item) => item.expense)));
  const monthlyExpenseValues = monthlyStats.map((item) => Math.abs(item.expense));
  const minExpense = monthlyExpenseValues.length ? Math.min(...monthlyExpenseValues) : 0;
  const maxExpense = monthlyExpenseValues.length ? Math.max(...monthlyExpenseValues) : 0;

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
  const dailyFlowData = analytics.dailyFlow;
  const weekdayData = analytics.weekdayStats;
  const histogramData = analytics.histogram;
  const categoryTrend = analytics.categoryTrend;

  const avgDailyExpense = analytics.uniqueDays
    ? Math.abs(totalExpense) / analytics.uniqueDays
    : 0;
  const avgExpenseTicket = analytics.expenseCount
    ? Math.abs(totalExpense) / analytics.expenseCount
    : 0;
  const avgIncomeTicket = analytics.incomeCount ? totalIncome / analytics.incomeCount : 0;

  const topCategoryEntry = React.useMemo(() => {
    const entries = Array.from(analytics.categoryTotals.entries());
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], value: entries[0][1] };
  }, [analytics.categoryTotals]);

  const topCategoryShare =
    topCategoryEntry && Math.abs(totalExpense) > 0
      ? Math.round((topCategoryEntry.value / Math.abs(totalExpense)) * 100)
      : 0;

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
            <small>Медиана: {formatCurrency(medianExpense)}</small>
            <small>Минимум мес: {formatCurrency(minExpense)}</small>
            <small>Максимум мес: {formatCurrency(maxExpense)}</small>
          </div>
          <div>
            <span className="label">Доходы</span>
            <strong>{formatCurrency(totalIncome)}</strong>
            <small>Среднее: {formatCurrency(avgIncome)}</small>
            <small>Медиана: {formatCurrency(medianIncome)}</small>
            <small>Средний чек: {formatCurrency(avgIncomeTicket)}</small>
          </div>
          <div>
            <span className="label">Чистый поток</span>
            <strong>{formatCurrency(net)}</strong>
            <small>Месяцев в выборке: {monthCount}</small>
            <small>Средний день: {formatCurrency(net / (analytics.uniqueDays || 1), 0)}</small>
          </div>
          <div>
            <span className="label">Средние расходы</span>
            <strong>{formatCurrency(avgDailyExpense)}</strong>
            <small>В день по {analytics.uniqueDays} дн.</small>
            <small>Средний чек: {formatCurrency(avgExpenseTicket)}</small>
          </div>
          <div>
            <span className="label">Топ категория</span>
            <strong>{topCategoryEntry ? topCategoryEntry.name : '—'}</strong>
            <small>
              Сумма: {topCategoryEntry ? formatCurrency(topCategoryEntry.value) : '—'}
            </small>
            <small>
              Доля расходов: {topCategoryEntry ? `${topCategoryShare}%` : '—'}
            </small>
          </div>
          <div>
            <span className="label">Крупные операции</span>
            <small>
              Расход:{' '}
              {analytics.biggestExpense
                ? `${formatCurrency(Math.abs(analytics.biggestExpense.amount))} · ${
                    analytics.biggestExpense.counterpartyNormalized ||
                    analytics.biggestExpense.counterparty ||
                    analytics.biggestExpense.descriptionRaw
                  }`
                : '—'}
            </small>
            <small>
              Доход:{' '}
              {analytics.biggestIncome
                ? `${formatCurrency(analytics.biggestIncome.amount)} · ${
                    analytics.biggestIncome.counterpartyNormalized ||
                    analytics.biggestIncome.counterparty ||
                    analytics.biggestIncome.descriptionRaw
                  }`
                : '—'}
            </small>
            <small>
              Всего операций: {operations.length}
            </small>
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
            <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
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
              <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
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
              <YAxis type="category" dataKey="name" width={180} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, 2)}
                labelFormatter={(label, payload) => {
                  const count = payload && payload[0]?.payload?.count;
                  return `${label} — ${count ?? 0} операций`;
                }}
              />
              <Bar dataKey="amount" name="Сумма" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card span-2">
        <h2>Кумулятивный поток</h2>
        {dailyFlowData.length === 0 ? (
          <p className="placeholder">Недостаточно данных для построения графика.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={dailyFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={20} />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, 2),
                  name,
                ]}
                labelFormatter={(label, payload) => {
                  const original = payload && payload[0]?.payload?.date;
                  return original ? dayjs(original).format('DD MMM YYYY') : label;
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Кумулятивно"
                fill="#bfdbfe"
                stroke="#2563eb"
              />
              <Line type="monotone" dataKey="net" name="Чистый день" stroke="#10b981" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2>Активность по дням недели</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekday" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, 2)}
              labelFormatter={(label, payload) => {
                const count = payload && payload[0]?.payload?.count;
                return `${label} — ${count ?? 0} операций`;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="expense" name="Расходы" fill="#ef4444" />
            <Bar yAxisId="left" dataKey="income" name="Доходы" fill="#10b981" />
            <Line yAxisId="right" type="monotone" dataKey="net" name="Чистый итог" stroke="#3b82f6" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card span-2">
        <h2>Динамика топ-категорий</h2>
        {categoryTrend.categories.length === 0 ? (
          <p className="placeholder">Нет расходных категорий для анализа.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={categoryTrend.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={20} />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
              <Legend />
              {categoryTrend.categories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={category}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2>Размер чеков</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis yAxisId="left" />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === 'Кол-во операций'
                  ? value
                  : formatCurrency(value, 2)
              }
            />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Кол-во операций" fill="#3b82f6" />
            <Line yAxisId="right" type="monotone" dataKey="avg" name="Средний чек" stroke="#f97316" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default DashboardSection;
