import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useCRM } from '../context/CRMContext';
import { SectionCard } from '../components/SectionCard';

const GrowthPage: React.FC = () => {
  const { timeline, clients, automations } = useCRM();

  const marketingAutomation = automations.find((item) => item.id === 'auto-marketing-alerts');

  const topCities = clients.map((client) => ({ city: client.city, orders: client.monthlyOrders })).slice(0, 4);

  const experiments = [
    {
      title: 'AI-скрипты для холодного трафика',
      hypothesis: 'Робот продаёт диагностику, если видим просадку по заказам',
      metric: '+22 лидов за неделю',
      owner: 'Юсуф К.',
    },
    {
      title: 'Клуб клиентов в Telegram',
      hypothesis: 'Объединяем клиентов в закрытый канал, продаём апдейты и услуги по рекламе',
      metric: 'Retention 64% после 30 дней',
      owner: 'Дмитрий С.',
    },
    {
      title: 'QR-приёмка для Европы',
      hypothesis: 'Клиент сам заполняет чек-лист, сокращаем ошибки и ускоряем выдачу',
      metric: '-18 минут на обработку заказа',
      owner: 'Денис С.',
    },
  ];

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">Рост и маркетинг</p>
          <h1>Запускаем кампании, когда цифры падают</h1>
          <p className="page-lead">
            CRM видит, что точке нужна помощь: подскажет, что сделать — запустить рекламу, позвонить клиентам или включить
            акцию.
          </p>
        </div>
        {marketingAutomation ? (
          <div className="page-highlight">
            <span className="page-highlight__value">{marketingAutomation.coverage}%</span>
            <span className="page-highlight__label">точек на маркетинговом радаре</span>
          </div>
        ) : null}
      </header>

      <SectionCard title="Метрики роста" description="Смотрим маркетинговые апсейлы и средний чек">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={50} />
            <Tooltip formatter={(value: number) => value.toLocaleString('ru-RU')} />
            <Line type="monotone" dataKey="avgCheck" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="marketingUpsells" stroke="#0ea5e9" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Точки роста" description="Смотрим кто готов к масштабированию">
        <div className="growth-grid">
          {topCities.map((city) => (
            <article key={city.city} className="growth-card">
              <h3>{city.city}</h3>
              <p>Среднемесячный поток: {city.orders} заказов</p>
              <ul>
                <li>Пакет «Анлок + продвижение»</li>
                <li>Голосовой контроль качества</li>
                <li>Интеграция с кассой и доставкой</li>
              </ul>
              <button type="button" className="secondary-button">
                Запланировать запуск
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Эксперименты" description="Тестируем гипотезы и фиксируем результат">
        <div className="experiment-grid">
          {experiments.map((experiment) => (
            <article key={experiment.title} className="experiment-card">
              <header>
                <h3>{experiment.title}</h3>
                <span>{experiment.owner}</span>
              </header>
              <p className="experiment-card__hypothesis">{experiment.hypothesis}</p>
              <p className="experiment-card__metric">{experiment.metric}</p>
              <button type="button" className="ghost-button">
                Посмотреть сценарий
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Главный вопрос"
        description="Проверяем, что CRM действительно помогает расти, а не превращается в очередную табличку"
      >
        <div className="question-card">
          <p>
            Что должно произойти в первые 14 дней, чтобы сервисный центр сказал: «Эта CRM привела мне новых клиентов и
            избавила от хаоса», — и продолжил пользоваться ею, даже если бесплатный период закончится?
          </p>
          <ul>
            <li>Как быстро мы покажем деньги или экономию?</li>
            <li>Кто отвечает за внедрение на стороне сервиса?</li>
            <li>Какие фичи можно отключить, чтобы не перегрузить команду?</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
};

export default GrowthPage;
