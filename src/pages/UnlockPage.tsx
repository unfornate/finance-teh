import React from 'react';
import { useCRM } from '../context/CRMContext';
import { SectionCard } from '../components/SectionCard';

const statusLabels: Record<string, string> = {
  'waiting-payment': 'Ожидает оплату',
  submitted: 'Отправлено',
  'apple-review': 'Apple review',
  completed: 'Завершено',
};

const riskClass = (risk: 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'high':
      return 'risk-pill risk-pill--high';
    case 'medium':
      return 'risk-pill risk-pill--medium';
    default:
      return 'risk-pill risk-pill--low';
  }
};

const UnlockPage: React.FC = () => {
  const { unlockPipeline, intakes, clients } = useCRM();

  const backlog = unlockPipeline.filter((item) => item.status !== 'completed');
  const completed = unlockPipeline.filter((item) => item.status === 'completed');

  const unlockPlaybook = [
    {
      title: 'Автоотправка заявки',
      description: 'Генерируем пакет в Apple, подставляем IMEI, чек и протокол приёмки автоматически.',
    },
    {
      title: 'Контроль SLA',
      description: 'Отслеживаем срок в Apple, дергаем техника и клиента, если задержка выше 12 часов.',
    },
    {
      title: 'Монетизация базы',
      description: 'После анлока запускаем апселл на аксессуары и страховки, фиксируем в CRM.',
    },
  ];

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">Анлок + техника</p>
          <h1>Контролируем разблокировки и технические кейсы</h1>
          <p className="page-lead">
            Видим, на каком этапе заявка в Apple, где залипла оплата и кто из клиентов требует дозвона прямо сейчас.
          </p>
        </div>
        <div className="page-highlight">
          <span className="page-highlight__value">{backlog.length}</span>
          <span className="page-highlight__label">активных заявок</span>
        </div>
      </header>

      <SectionCard title="Очередь анлоков" description="Синхронизируемся с Apple, партнёрами и кассой">
        <table className="data-table">
          <thead>
            <tr>
              <th>Заявка</th>
              <th>Клиент</th>
              <th>Устройство</th>
              <th>Этап</th>
              <th>Маржа</th>
              <th>ETA</th>
              <th>Риск</th>
            </tr>
          </thead>
          <tbody>
            {unlockPipeline.map((item) => {
              const intake = intakes.find((intakeItem) => intakeItem.id === item.intakeId);
              const client = clients.find((c) => c.id === item.clientId);
              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <strong>{client?.name}</strong>
                    <span className="table-sub">{client?.city}</span>
                  </td>
                  <td>{item.device}</td>
                  <td>
                    <span className={`status-pill status-pill--unlock-${item.status}`}>{statusLabels[item.status]}</span>
                  </td>
                  <td>{item.margin.toLocaleString('ru-RU')} ₽</td>
                  <td>{new Date(item.eta).toLocaleString('ru-RU')}</td>
                  <td>
                    <span className={riskClass(item.risk)}>{item.risk}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Регламент" description="Что делает CRM и команда на каждом этапе">
        <div className="playbook-grid">
          {unlockPlaybook.map((item) => (
            <article key={item.title} className="playbook-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>
                <li>Оповещения в Telegram и CRM</li>
                <li>Проверка Voice QA перед выдачей</li>
                <li>Автоматическая напоминалка для маркетинга</li>
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Закрытые кейсы"
        description="Смотрим маржинальность и то, где можно усилить cross-sell"
      >
        <div className="completed-grid">
          {completed.length === 0 ? (
            <p>Пока нет завершённых анлоков, только активные заявки.</p>
          ) : (
            completed.map((item) => {
              const intake = intakes.find((intakeItem) => intakeItem.id === item.intakeId);
              const client = clients.find((c) => c.id === item.clientId);
              return (
                <article key={item.id} className="completed-card">
                  <header>
                    <h3>{item.device}</h3>
                    <span>{item.margin.toLocaleString('ru-RU')} ₽</span>
                  </header>
                  <p>
                    {client?.name} • {statusLabels[item.status]}
                  </p>
                  <p className="completed-card__meta">
                    Голосовой протокол: {intake?.voiceTranscript ?? 'не прикреплён'}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default UnlockPage;
