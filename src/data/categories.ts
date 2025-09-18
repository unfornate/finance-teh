import { CategoryDictionaryItem } from '../lib/types';

export const CATEGORY_DICTIONARY: CategoryDictionaryItem[] = [
  { category: 'Еда', subcategory: 'Еда: вне дома' },
  { category: 'Еда', subcategory: 'Еда: супермаркеты' },
  { category: 'Жилье', subcategory: '—' },
  { category: 'Здоровье', subcategory: 'Массаж' },
  { category: 'Здоровье', subcategory: 'Не уточнено' },
  { category: 'Личностный рост', subcategory: 'Психолог' },
  { category: 'Отношения', subcategory: 'Отношения: еда и напитки' },
  { category: 'Отношения', subcategory: 'Отношения: свидания' },
  { category: 'Покупки', subcategory: '—' },
  { category: 'Подписки', subcategory: 'Подписки: телеграм' },
  { category: 'Прочее', subcategory: 'Прочее: дал в долг' },
  { category: 'Прочее', subcategory: 'Прочее: отдал в долг' },
  { category: 'Прочее', subcategory: 'Прочее: —' },
  { category: 'Прочее', subcategory: 'Ремонт телефона' },
  { category: 'Сбережения/Инвестиции', subcategory: '—' },
  { category: 'Транспорт', subcategory: 'Транспорт: общественный' },
  { category: 'Транспорт', subcategory: 'Транспорт: самокаты' },
  { category: 'Транспорт', subcategory: 'Транспорт: такси' },
  { category: 'Телеграм бот', subcategory: '—' },
  { category: 'Связь', subcategory: 'Связь: мобильная' },
  { category: 'Связь', subcategory: 'Связь: интернет' },
  { category: 'Шопинг', subcategory: 'Шопинг: маркетплейсы' },
  { category: 'Образование', subcategory: '—' },
  { category: 'Бизнес', subcategory: '—' },
  { category: 'Налоги и сборы', subcategory: '—' },
  { category: 'Здоровье', subcategory: 'Здоровье: услуги' },
  { category: 'Не уточнено', subcategory: 'Не уточнено' },
];

export function ensureSubcategory(
  category: string,
  subcategory?: string,
): { category: string; subcategory: string } {
  if (!subcategory || subcategory.trim().length === 0) {
    return { category, subcategory: 'Не уточнено' };
  }
  return { category, subcategory };
}

export function listCategories(): string[] {
  return Array.from(new Set(CATEGORY_DICTIONARY.map((item) => item.category)));
}

export function listSubcategories(category?: string): string[] {
  return CATEGORY_DICTIONARY.filter((item) =>
    category ? item.category === category : true,
  ).map((item) => item.subcategory);
}
