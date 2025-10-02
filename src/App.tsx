import React from 'react';
import { CRMProvider } from './context/CRMContext';
import OverviewPage from './pages/OverviewPage';
import IntakePage from './pages/IntakePage';
import ClientsPage from './pages/ClientsPage';
import UnlockPage from './pages/UnlockPage';
import GrowthPage from './pages/GrowthPage';
import VoicePage from './pages/VoicePage';

type PageId = 'overview' | 'intake' | 'clients' | 'unlock' | 'growth' | 'voice';

type PageConfig = {
  id: PageId;
  label: string;
  component: React.ComponentType;
  description: string;
};

const pages: PageConfig[] = [
  { id: 'overview', label: 'Обзор', component: OverviewPage, description: 'KPIs, загрузка и автоматизации' },
  { id: 'intake', label: 'Приёмка', component: IntakePage, description: 'IMEI → карточка клиента → чек' },
  { id: 'clients', label: 'Клиенты', component: ClientsPage, description: 'Здоровье сети и cross-sell' },
  { id: 'unlock', label: 'Анлок', component: UnlockPage, description: 'Очередь Apple и SLA' },
  { id: 'growth', label: 'Рост', component: GrowthPage, description: 'Маркетинг и эксперименты' },
  { id: 'voice', label: 'Голос', component: VoicePage, description: 'Протоколы и QA' },
];

const PageRenderer: React.FC<{ activePage: PageId }> = ({ activePage }) => {
  const current = pages.find((page) => page.id === activePage) ?? pages[0];
  const Component = current.component;
  return <Component />;
};

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = React.useState<PageId>('overview');
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    setNavOpen(false);
  }, [activePage]);

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${navOpen ? 'app-sidebar--open' : ''}`}>
        <div className="app-brand">
          <button className="app-brand__toggle" type="button" onClick={() => setNavOpen((prev) => !prev)}>
            ≡
          </button>
          <div>
            <p className="app-brand__title">Приёмка+</p>
            <span className="app-brand__subtitle">CRM для сервисных центров</span>
          </div>
        </div>
        <nav className="app-nav">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setActivePage(page.id)}
              className={`app-nav__item ${activePage === page.id ? 'app-nav__item--active' : ''}`}
            >
              <span className="app-nav__label">{page.label}</span>
              <span className="app-nav__desc">{page.description}</span>
            </button>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <p>Free CRM MVP • Объединяем кассу, приёмку и маркетинг</p>
        </div>
      </aside>
      <main className="app-main">
        <PageRenderer activePage={activePage} />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <CRMProvider>
    <AppContent />
  </CRMProvider>
);

export default App;
