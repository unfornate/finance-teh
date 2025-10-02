import React from 'react';
import { useCRM } from '../context/CRMContext';
import { SectionCard } from '../components/SectionCard';

const channelLabels: Record<string, string> = {
  organic: 'Органика',
  referral: 'Рекомендации',
  ads: 'Платный трафик',
  community: 'Комьюнити',
};

const ClientsPage: React.FC = () => {
  const { clients, timeline } = useCRM();

  const avgOrders = Math.round(clients.reduce((acc, client) => acc + client.monthlyOrders, 0) / clients.length);
  const avgCheck = Math.round(clients.reduce((acc, client) => acc + client.avgCheck, 0) / clients.length);
  const totalActive = clients.reduce((acc, client) => acc + client.activeTickets, 0);

  const latestWeek = timeline[timeline.length - 1];

  const opportunities = clients
    .filter((client) => client.healthScore < 80 || client.unlockShare < 0.3)
    .map((client) => ({
      id: client.id,
      title: client.name,
      reason: client.healthScore < 80 ? 'Снижается здоровье аккаунта' : 'Мало анлоков в структуре заказов',
      action:
        client.healthScore < 80
          ? 'Запланируйте совместный аудит продаж, подключите голосовые протоколы к каждой точке.'
          : 'Предложите пакет «Анлок + продвижение», сделайте оффер в базе клиентов.',
      owner: client.owner,
    }));

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">Клиенты • база и аналитика</p>
          <h1>Вся сеть сервисов под рукой</h1>
          <p className="page-lead">
            Видим обороты, спад и потенциал. CRM сама подскажет, кому позвонить, чтобы вырасти в рекламе или продаже анлока.
          </p>
        </div>
      </header>

      <SectionCard title="Сводка по базе" description="Средние показатели по активным клиентам сети">
        <div className="client-summary-grid">
          <div className="client-summary-card">
            <span className="client-summary-card__label">Средний поток заказов</span>
            <span className="client-summary-card__value">{avgOrders} / мес</span>
            <p>Держим среднюю скорость точек по базе CRM</p>
          </div>
          <div className="client-summary-card">
            <span className="client-summary-card__label">Средний чек</span>
            <span className="client-summary-card__value">{avgCheck.toLocaleString('ru-RU')} ₽</span>
            <p>Учитываем апселлы, ремонты и анлоки</p>
          </div>
          <div className="client-summary-card">
            <span className="client-summary-card__label">Активных заказов</span>
            <span className="client-summary-card__value">{totalActive}</span>
            <p>Контроль загрузки мастеров по всей сети</p>
          </div>
          <div className="client-summary-card">
            <span className="client-summary-card__label">Последняя неделя</span>
            <span className="client-summary-card__value">{latestWeek.intake} приёмок</span>
            <p>Видим динамику в онлайне и офлайне</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Клиентская база" description="Каналы, здоровье аккаунтов, готовность к апгрейду">
        <table className="data-table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Владелец</th>
              <th>Город</th>
              <th>Активные тикеты</th>
              <th>Средний чек</th>
              <th>Анлок в обороте</th>
              <th>Здоровье</th>
              <th>Канал</th>
              <th>Подписки</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  <span className="table-sub">{client.tags.join(' • ')}</span>
                </td>
                <td>{client.owner}</td>
                <td>{client.city}</td>
                <td>{client.activeTickets}</td>
                <td>{client.avgCheck.toLocaleString('ru-RU')} ₽</td>
                <td>{Math.round(client.unlockShare * 100)}%</td>
                <td>
                  <span className={`status-pill status-pill--health-${client.healthScore >= 80 ? 'good' : client.healthScore >= 60 ? 'warn' : 'bad'}`}>
                    {client.healthScore} / 100
                  </span>
                </td>
                <td>{channelLabels[client.channel]}</td>
                <td>{client.marketingOptIn ? 'Маркетинг + Новости' : 'Только CRM'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Возможности роста" description="Фокусируемся на точках, где есть провал по заказам или анлокам">
        <div className="opportunity-grid">
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} className="opportunity-card">
              <header>
                <h3>{opportunity.title}</h3>
                <span className="opportunity-card__owner">{opportunity.owner}</span>
              </header>
              <p className="opportunity-card__reason">{opportunity.reason}</p>
              <p>{opportunity.action}</p>
              <button type="button" className="secondary-button">
                Созвониться • подготовить план
              </button>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default ClientsPage;
