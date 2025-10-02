import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRM } from '../context/CRMContext';
import { StatCard } from '../components/StatCard';
import { SectionCard } from '../components/SectionCard';

const intakeStatusLabels: Record<string, string> = {
  diagnostics: 'Диагностика',
  'waiting-parts': 'Ждём запчасти',
  unlock: 'Анлок',
  ready: 'Готово',
  handover: 'Выдача',
};

const unlockStatusLabels: Record<string, string> = {
  'waiting-payment': 'Ожидает оплату',
  submitted: 'Отправлено',
  'apple-review': 'На проверке Apple',
  completed: 'Завершено',
};

const accentCycle: Array<'purple' | 'blue' | 'green' | 'orange'> = ['purple', 'blue', 'green', 'orange'];

const OverviewPage: React.FC = () => {
  const { kpiCards, timeline, intakeStatusBreakdown, unlockStatusBreakdown, automations, voiceCoverage } = useCRM();

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">MVP / сервисные центры • Apple + multi-brand</p>
          <h1>CRM «Приёмка+» — контроль потока, анлоков и продаж</h1>
          <p className="page-lead">
            Быстрая приёмка с автоподбором по IMEI, голосовые протоколы, анлоки и маркетинговый радар — всё в одной
            бесплатной экосистеме.
          </p>
        </div>
        <div className="page-highlight">
          <span className="page-highlight__value">{voiceCoverage}%</span>
          <span className="page-highlight__label">приёмок с голосовым протоколом</span>
        </div>
      </header>

      <div className="stat-card-grid">
        {kpiCards.map((card, index) => (
          <StatCard key={card.id} {...card} accent={accentCycle[index % accentCycle.length]} />
        ))}
      </div>

      <SectionCard title="Динамика приёмок и анлоков" description="Следим за загрузкой точек и средней выручкой">
        <div className="chart-row">
          <div className="chart-item">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="intakeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="unlockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip formatter={(value: number) => value.toLocaleString('ru-RU')} />
                <Area type="monotone" dataKey="intake" stroke="#4f46e5" fill="url(#intakeGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="unlocks" stroke="#16a34a" fill="url(#unlockGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-side">
            <div className="chart-side__block">
              <h3>Статусы приёмок</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={intakeStatusBreakdown} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" tickFormatter={(value) => intakeStatusLabels[value] ?? value} width={120} />
                  <Bar dataKey="count" radius={6} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-side__block">
              <h3>Очередь анлоков</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={unlockStatusBreakdown} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" tickFormatter={(value) => unlockStatusLabels[value] ?? value} width={120} />
                  <Bar dataKey="count" radius={6} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Активные автомations" description="Связываем приёмку, анлоки и маркетинг">
        <div className="automation-grid">
          {automations.map((automation) => (
            <article key={automation.id} className={`automation-card automation-card--${automation.status}`}>
              <header>
                <span className="automation-card__status">{automation.status === 'active' ? 'Активно' : automation.status === 'pilot' ? 'Пилот' : 'Бэклог'}</span>
                <h3>{automation.title}</h3>
              </header>
              <p className="automation-card__description">{automation.description}</p>
              <dl className="automation-card__meta">
                <div>
                  <dt>Ответственный</dt>
                  <dd>{automation.owner}</dd>
                </div>
                <div>
                  <dt>Покрытие сети</dt>
                  <dd>{automation.coverage}%</dd>
                </div>
                <div>
                  <dt>KPI</dt>
                  <dd>{automation.kpi}</dd>
                </div>
                <div>
                  <dt>Ревью</dt>
                  <dd>{automation.nextReview}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default OverviewPage;
