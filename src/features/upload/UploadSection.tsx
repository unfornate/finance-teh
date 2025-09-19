import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { parseFiles } from '../../lib/parser';

const UploadSection: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    setIsLoading(true);
    try {
      const existingExternalIds = new Set(
        state.operations.map((operation) => operation.externalId).filter(Boolean) as string[],
      );
      const existingFingerprints = new Set(state.operations.map((operation) => operation.fingerprint));

      const result = await parseFiles(Array.from(files), {
        existingExternalIds,
        existingFingerprints,
      });

      dispatch({ type: 'LOAD_OPERATIONS', payload: { operations: result.operations, summary: result.summary } });
      setMessages(result.warnings);
    } catch (error) {
      console.error(error);
      setMessages(['Ошибка при чтении файлов. Проверьте формат CSV.']);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Стереть все загруженные данные и словари?')) {
      dispatch({ type: 'RESET_STATE' });
      setMessages([]);
    }
  };

  const summary = state.summary;

  return (
    <section className="card">
      <h2>Загрузка выписок</h2>
      <p>Выберите один или несколько CSV-файлов от банков. Все вычисления остаются в браузере.</p>
      <label className="file-input">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={handleFiles}
          disabled={isLoading}
        />
        <span>{isLoading ? 'Чтение...' : 'Выбрать файлы CSV'}</span>
      </label>
      <div className="info-grid">
        <div className="info-card">
          <h3>Что произойдёт при импорте</h3>
          <ul>
            <li>Файлы читаются в web worker — интерфейс не зависает даже на 5–10 тыс. строк.</li>
            <li>Автоматически подбираются кодировка (UTF-8/Windows-1251) и разделитель.</li>
            <li>Дубликаты отфильтровываются по `external_id` или хэш-фингерпринту, а «Инвесткопилка» отмечается отдельно.</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>Что вы увидите после загрузки</h3>
          <ul>
            <li>Дашборд с P&amp;L, структурой расходов, динамикой категорий и активностью по дням недели.</li>
            <li>Список операций с фильтрами, быстрым поиском и ручной категоризацией.</li>
            <li>Топ контрагентов и конструктор правил для автоматизации будущих операций.</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>Советы по большим CSV</h3>
          <ul>
            <li>Файлы в 500 строк загружаются мгновенно, а крупные выгрузки лучше делить по месяцам для удобства анализа.</li>
            <li>Виртуализованный список позволяет прокручивать десятки тысяч строк без потери производительности.</li>
            <li>Данные сохраняются в браузере — вернуться к ним можно в любой момент.</li>
          </ul>
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={handleReset} className="secondary">
          Очистить все данные
        </button>
      </div>
      {messages.length > 0 && (
        <div className="warning">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
      {summary ? (
        <div className="summary-grid">
          <div>
            <span className="label">Всего строк</span>
            <span className="value">{summary.total}</span>
          </div>
          <div>
            <span className="label">Основные</span>
            <span className="value">{summary.main}</span>
          </div>
          <div>
            <span className="label">Инвесткопилка</span>
            <span className="value">{summary.invest}</span>
          </div>
          <div>
            <span className="label">Дубликаты</span>
            <span className="value">{summary.duplicates}</span>
          </div>
          <div>
            <span className="label">Пропуски</span>
            <span className="value">{summary.skipped}</span>
          </div>
        </div>
      ) : (
        <p className="placeholder">Нет данных — загрузите CSV</p>
      )}
    </section>
  );
};

export default UploadSection;
