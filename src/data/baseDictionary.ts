import { BaseDictionaryRule } from '../lib/types';
import { ensureSubcategory } from './categories';

export const BASE_DICTIONARY: BaseDictionaryRule[] = [
  {
    patterns: ['яндекс еда', 'yandexeda', 'delivery club', 'samokat food'],
    ...ensureSubcategory('Еда', 'Еда: вне дома'),
  },
  {
    patterns: ['pyaterochka', 'perekrestok', 'magnit', 'лента', 'дикси', 'ашан'],
    ...ensureSubcategory('Еда', 'Еда: супермаркеты'),
  },
  {
    patterns: ['taxi', 'яндекс такси', 'uber', 'citymobil', 'bolt'],
    ...ensureSubcategory('Транспорт', 'Транспорт: такси'),
  },
  {
    patterns: ['whoosh', 'samokat', 'ura ride', 'citydrive'],
    ...ensureSubcategory('Транспорт', 'Транспорт: самокаты'),
  },
  {
    patterns: ['metro', 'mts', 'tele2', 'beeline', 'megafon', 'yota'],
    ...ensureSubcategory('Связь', 'Связь: мобильная'),
  },
  {
    patterns: ['ozon', 'wb', 'wildberries', 'marketplace', 'market'],
    ...ensureSubcategory('Шопинг', 'Шопинг: маркетплейсы'),
  },
  {
    patterns: ['spotify', 'netflix', 'ivi', 'okko', 'kinopoisk', 'youtube'],
    ...ensureSubcategory('Подписки', 'Подписки: телеграм'),
  },
  {
    patterns: ['nalog', 'налог', 'fts', 'налоговая'],
    ...ensureSubcategory('Налоги и сборы', '—'),
  },
  {
    patterns: ['apteka', 'аптека', 'samson-pharma'],
    ...ensureSubcategory('Здоровье', 'Здоровье: услуги'),
  },
  {
    patterns: ['жкх', 'квартплата', 'жилищ'],
    ...ensureSubcategory('Жилье', '—'),
  },
  {
    patterns: ['school', 'курсы', 'skillbox', 'geekbrains'],
    ...ensureSubcategory('Образование', '—'),
  },
];
