import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { buildRegulars } from '../regulars/RegularsSection';
import { CategorizedOperation } from '../../lib/types';

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = typeof value === 'number' ? value.toString() : value;
          if (text.includes(';') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(';'),
    )
    .join('\n');
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCounterpartyTop(operations: CategorizedOperation[]) {
  const map = new Map<string, { amount: number; count: number }>();
  for (const op of operations) {
    const key = op.counterpartyNormalized || '—';
    const entry = map.get(key) ?? { amount: 0, count: 0 };
    entry.amount += Math.abs(op.amount);
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 20)
    .map(([name, info]) => ({ name, amount: info.amount, count: info.count }));
}

const ExportSection: React.FC = () => {
  const { filteredActive, filteredInvest } = useAppState();

  const handleExportOperations = () => {
    const header = [
      'Дата',
      'Сумма',
      'Банк',
      'Контрагент',
      'Категория',
      'Подкатегория',
      'Описание',
      'Источник категории',
    ];
    const rows = filteredActive.map((op) => [
      op.postedAt,
      op.amount,
      op.bank ?? '',
      op.counterparty ?? op.counterpartyNormalized,
      op.category,
      op.subcategory,
      op.descriptionRaw,
      op.categorySource,
    ]);
    downloadCsv('operations.csv', [header, ...rows]);
  };

  const handleExportInvest = () => {
    const header = ['Дата', 'Сумма', 'Описание'];
    const rows = filteredInvest.map((op) => [op.postedAt, op.amount, op.descriptionRaw]);
    downloadCsv('invest.csv', [header, ...rows]);
  };

  const handleExportRegulars = () => {
    const groups = buildRegulars(filteredActive);
    const header = ['Контрагент', 'Сумма', 'Повторы', 'Начало', 'Конец'];
    const rows = groups.map((group) => [
      group.counterparty,
      group.roundedAmount,
      group.count,
      group.firstDate,
      group.lastDate,
    ]);
    downloadCsv('regulars.csv', [header, ...rows]);
  };

  const handleExportCounterparties = () => {
    const top = buildCounterpartyTop(filteredActive);
    const header = ['Контрагент', 'Сумма', 'Количество'];
    const rows = top.map((item) => [item.name, item.amount, item.count]);
    downloadCsv('counterparties.csv', [header, ...rows]);
  };

  return (
    <section className="card">
      <h2>Экспорт текущего среза</h2>
      <p className="hint">Выгрузки учитывают активные фильтры и состояние тумблера копилки.</p>
      <div className="actions stack">
        <button className="primary" onClick={handleExportOperations}>
          Экспортировать операции
        </button>
        <button className="secondary" onClick={handleExportInvest}>
          Экспортировать инвесткопилку
        </button>
        <button className="secondary" onClick={handleExportRegulars}>
          Экспортировать регулярные платежи
        </button>
        <button className="secondary" onClick={handleExportCounterparties}>
          Экспортировать топ контрагентов
        </button>
      </div>
    </section>
  );
};

export default ExportSection;
