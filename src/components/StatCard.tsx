import React from 'react';
import { KPICard } from '../context/CRMContext';

interface StatCardProps extends KPICard {
  accent?: 'purple' | 'blue' | 'green' | 'orange';
}

const accentMap: Record<NonNullable<StatCardProps['accent']>, string> = {
  purple: 'stat-card--purple',
  blue: 'stat-card--blue',
  green: 'stat-card--green',
  orange: 'stat-card--orange',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, trendLabel, trendDirection, hint, accent = 'purple' }) => {
  return (
    <div className={`stat-card ${accentMap[accent]}`}>
      <p className="stat-card__label">{label}</p>
      <div className="stat-card__value-row">
        <span className="stat-card__value">{value}</span>
        <span className={`stat-card__trend stat-card__trend--${trendDirection}`}>{trendLabel}</span>
      </div>
      {hint ? <p className="stat-card__hint">{hint}</p> : null}
    </div>
  );
};
