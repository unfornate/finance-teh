import React from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import UploadSection from './features/upload/UploadSection';
import DashboardSection from './features/dashboard/DashboardSection';
import OperationsSection from './features/operations/OperationsSection';
import CounterpartiesSection from './features/counterparties/CounterpartiesSection';
import RulesSection from './features/rules/RulesSection';
import InvestSection from './features/invest/InvestSection';
import RegularsSection from './features/regulars/RegularsSection';
import AnomaliesSection from './features/anomalies/AnomaliesSection';
import ExportSection from './features/export/ExportSection';
import IncludeInvestToggle from './components/IncludeInvestToggle';

const tabs = [
  { id: 'upload', label: 'Загрузка', component: UploadSection },
  { id: 'dashboard', label: 'Дашборд', component: DashboardSection },
  { id: 'operations', label: 'Операции', component: OperationsSection },
  { id: 'counterparties', label: 'Контрагенты', component: CounterpartiesSection },
  { id: 'rules', label: 'Правила', component: RulesSection },
  { id: 'invest', label: 'Инвесткопилка', component: InvestSection },
  { id: 'regulars', label: 'Регулярные', component: RegularsSection },
  { id: 'anomalies', label: 'Аномалии', component: AnomaliesSection },
  { id: 'export', label: 'Экспорт', component: ExportSection },
] as const;

type TabId = (typeof tabs)[number]['id'];

const TAB_STORAGE_KEY = 'finance-teh-active-tab';

const AppContent: React.FC = () => {
  const { state } = useAppState();
  const hasData = state.operations.length > 0;
  const [activeTab, setActiveTab] = React.useState<TabId>(() => {
    const stored = typeof window !== 'undefined' ? (window.localStorage.getItem(TAB_STORAGE_KEY) as TabId | null) : null;
    if (stored) return stored;
    return hasData ? 'dashboard' : 'upload';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (!hasData) {
      setActiveTab('upload');
    }
  }, [hasData]);

  const CurrentComponent = tabs.find((tab) => tab.id === activeTab)?.component ?? UploadSection;

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Локальная админка финансов</h1>
          <p className="subtitle">Личные финансы из CSV, полностью офлайн</p>
        </div>
        <IncludeInvestToggle />
      </header>
      <nav className="app-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-button ${tab.id === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="app-main">
        <CurrentComponent />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AppStateProvider>
    <AppContent />
  </AppStateProvider>
);

export default App;
