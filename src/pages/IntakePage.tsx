import React from 'react';
import { useCRM } from '../context/CRMContext';
import { SectionCard } from '../components/SectionCard';

const priorityOptions = [
  { value: 'high', label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low', label: 'Низкий' },
];

const channelOptions = [
  { value: 'in-store', label: 'В салоне' },
  { value: 'courier', label: 'Курьер' },
  { value: 'postal', label: 'Почта' },
];

const IntakePage: React.FC = () => {
  const { clients, intakes, createIntake, lookupDeviceByIdentifier } = useCRM();
  const [identifier, setIdentifier] = React.useState('');
  const [clientId, setClientId] = React.useState(clients[0]?.id ?? '');
  const [issues, setIssues] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [channel, setChannel] = React.useState<'in-store' | 'courier' | 'postal'>('in-store');
  const [technician, setTechnician] = React.useState('');
  const [preview, setPreview] = React.useState<ReturnType<typeof lookupDeviceByIdentifier>>();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!identifier) {
      setPreview(undefined);
      return;
    }
    setPreview(lookupDeviceByIdentifier(identifier));
  }, [identifier, lookupDeviceByIdentifier]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId || !identifier) return;
    const parsedIssues = issues
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const newIntake = createIntake({
      clientId,
      identifier,
      issues: parsedIssues,
      notes: notes.trim() ? notes.trim() : undefined,
      intakeChannel: channel,
      priority,
      technician: technician.trim() ? technician.trim() : undefined,
    });

    setSuccessMessage(`Приёмка ${newIntake.id} создана, добавили в очередь`);
    setIdentifier('');
    setIssues('');
    setNotes('');
    setTechnician('');
  };

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">Приёмка • быстрый старт</p>
          <h1>Принимаем устройства без ручной рутины</h1>
          <p className="page-lead">
            Вводите IMEI или серийник — CRM подтянет модель, цвет, историю. Голосовой протокол фиксирует договорённости,
            а чек печатается в один клик.
          </p>
        </div>
      </header>

      <SectionCard
        title="Новая приёмка"
        description="Автозаполнение по базе устройств, протокол и постановка в анлок при необходимости"
        action={successMessage ? <span className="badge badge--success">{successMessage}</span> : null}
      >
        <form className="intake-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Клиент</span>
              <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} — {client.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>IMEI / Серийный номер</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Например, 353915101010101"
                required
              />
            </label>

            <label className="form-field">
              <span>Приоритет</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Канал приёмки</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}>
                {channelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Назначенный техник</span>
              <input value={technician} onChange={(event) => setTechnician(event.target.value)} placeholder="Например, Артём" />
            </label>

            <label className="form-field form-field--textarea">
              <span>Неисправности / комментарии клиента</span>
              <textarea
                value={issues}
                onChange={(event) => setIssues(event.target.value)}
                placeholder="Перечислите через запятую или перенос строки"
                rows={3}
              />
            </label>

            <label className="form-field form-field--textarea">
              <span>Голосовой протокол / заметка</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Нажмите запись → скажите договорённости → CRM зафиксирует и расшифрует"
                rows={3}
              />
            </label>
          </div>

          <div className="form-footer">
            <div>
              <button type="submit" className="primary-button">
                Создать приёмку
              </button>
              <p className="form-hint">После создания сформируется акт приёма и черновик чека</p>
            </div>
            {preview ? (
              <div className="device-preview">
                <h3>Автозаполнение</h3>
                <ul>
                  <li>
                    <span>Устройство:</span> {preview.brand} {preview.model}
                  </li>
                  {preview.color ? (
                    <li>
                      <span>Цвет:</span> {preview.color}
                    </li>
                  ) : null}
                  {preview.storage ? (
                    <li>
                      <span>Память:</span> {preview.storage}
                    </li>
                  ) : null}
                  {typeof preview.batteryHealth === 'number' ? (
                    <li>
                      <span>Аккумулятор:</span> {preview.batteryHealth}%
                    </li>
                  ) : null}
                  {preview.icloudStatus ? (
                    <li>
                      <span>Статус iCloud:</span> {preview.icloudStatus === 'clean' ? 'Чистый' : 'Нужен анлок'}
                    </li>
                  ) : null}
                  {preview.issues ? (
                    <li>
                      <span>Из базы:</span> {preview.issues.join(', ')}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <div className="device-preview device-preview--empty">
                <h3>Нет данных</h3>
                <p>Введите IMEI или серийник, чтобы подтянуть историю</p>
              </div>
            )}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Последние приёмки" description="Выгружаем в кассу, CRM и анлок в один клик">
        <table className="data-table">
          <thead>
            <tr>
              <th>Приёмка</th>
              <th>Клиент</th>
              <th>Устройство</th>
              <th>Статус</th>
              <th>Приоритет</th>
              <th>Техник</th>
              <th>Создано</th>
            </tr>
          </thead>
          <tbody>
            {intakes.slice(0, 6).map((item) => {
              const client = clients.find((c) => c.id === item.clientId);
              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <strong>{client?.name}</strong>
                    <span className="table-sub">{client?.city}</span>
                  </td>
                  <td>
                    {item.brand} {item.model}
                    <span className="table-sub">{item.issues.slice(0, 2).join(', ')}</span>
                  </td>
                  <td>
                    <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
                  </td>
                  <td>{item.priority}</td>
                  <td>{item.technician}</td>
                  <td>{new Date(item.createdAt).toLocaleString('ru-RU')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
};

export default IntakePage;
