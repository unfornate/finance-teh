import Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sha256 } from 'js-sha256';
import {
  LoadSummary,
  Operation,
} from './types';
import {
  cleanDescription,
  extractCounterpartyFromDescription,
  isInvestOperation,
  normalizeCounterparty,
  normalizeWhitespace,
} from './text';

dayjs.extend(customParseFormat);

const REQUIRED_FIELDS = {
  postedAt: ['дата операции', 'дата', 'дата проводки', 'posting date'],
  amount: ['сумма', 'amount'],
  description: ['описание', 'description'],
};

const OPTIONAL_FIELDS = {
  counterparty: ['контрагент', 'counterparty', 'получатель'],
  mcc: ['mcc'],
  currency: ['валюта', 'currency'],
  bank: ['банк', 'bank'],
  accountMask: ['номер карты', 'card', 'account'],
  externalId: ['id операции', 'внешнийid', 'external id', 'transaction id'],
  operationAt: ['дата совершения', 'операция'],
  sign: ['знак', 'sign', 'тип операции'],
};

const DATE_FORMATS = [
  'DD.MM.YYYY',
  'DD.MM.YYYY HH:mm:ss',
  'DD.MM.YYYY HH:mm',
  'YYYY-MM-DD',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD',
];

const CAN_USE_WORKER = typeof Worker !== 'undefined';

interface HeaderMap {
  [key: string]: string | undefined;
}

function detectDelimiter(content: string): Papa.ParseConfig['delimiter'] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return ';';
  }
  const firstLine = lines[0];
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ';' : ',';
}

function decodeContent(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!utf8.includes('\uFFFD')) {
    return utf8.replace(/^\uFEFF/, '');
  }
  const cp1251 = new TextDecoder('windows-1251', { fatal: false }).decode(buffer);
  if (!cp1251.includes('\uFFFD')) {
    return cp1251;
  }
  return utf8.replace(/^\uFEFF/, '');
}

function parseDateValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    for (const format of DATE_FORMATS) {
      const parsed = dayjs(trimmed, format, true);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }
    const fallback = dayjs(trimmed);
    if (fallback.isValid()) {
      return fallback.format('YYYY-MM-DD');
    }
  }
  return undefined;
}

function parseAmountValue(value: unknown, signValue?: unknown): number | undefined {
  const multiplier = normalizeSign(signValue);
  if (typeof value === 'number') {
    return value * multiplier;
  }
  if (typeof value === 'string') {
    const sanitized = value
      .replace(/\s+/g, '')
      .replace(/\u00A0/g, '')
      .replace(/р\.?/gi, '')
      .replace(/₽/g, '')
      .replace(/,/g, '.');
    const match = sanitized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return undefined;
    const numeric = parseFloat(match[0]);
    if (Number.isNaN(numeric)) return undefined;
    return numeric * multiplier;
  }
  return undefined;
}

function normalizeSign(signValue: unknown): number {
  if (!signValue) return 1;
  if (typeof signValue === 'number') {
    if (signValue < 0) return -1;
    if (signValue === 0) return 0;
    return 1;
  }
  if (typeof signValue === 'string') {
    const lowered = signValue.trim().toLowerCase();
    if (lowered.includes('-')) return -1;
    if (lowered.includes('+')) return 1;
    if (lowered.includes('расход') || lowered.includes('debit')) return -1;
    if (lowered.includes('доход') || lowered.includes('credit')) return 1;
  }
  return 1;
}

function findHeader(headers: string[], candidates: string[]): string | undefined {
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  for (const candidate of candidates) {
    const idx = lowerHeaders.findIndex((header) => header.includes(candidate.toLowerCase()));
    if (idx >= 0) {
      return headers[idx];
    }
  }
  return undefined;
}

function buildHeaderMap(headers: string[]): HeaderMap {
  return {
    postedAt: findHeader(headers, REQUIRED_FIELDS.postedAt),
    amount: findHeader(headers, REQUIRED_FIELDS.amount),
    description: findHeader(headers, REQUIRED_FIELDS.description),
    counterparty: findHeader(headers, OPTIONAL_FIELDS.counterparty),
    mcc: findHeader(headers, OPTIONAL_FIELDS.mcc),
    currency: findHeader(headers, OPTIONAL_FIELDS.currency),
    bank: findHeader(headers, OPTIONAL_FIELDS.bank),
    accountMask: findHeader(headers, OPTIONAL_FIELDS.accountMask),
    externalId: findHeader(headers, OPTIONAL_FIELDS.externalId),
    operationAt: findHeader(headers, OPTIONAL_FIELDS.operationAt),
    sign: findHeader(headers, OPTIONAL_FIELDS.sign),
  };
}

export interface ParseResult {
  operations: Operation[];
  summary: LoadSummary;
  warnings: string[];
}

export interface ParseOptions {
  existingExternalIds?: Set<string>;
  existingFingerprints?: Set<string>;
}

export async function parseFiles(
  files: File[],
  options: ParseOptions = {},
): Promise<ParseResult> {
  const operations: Operation[] = [];
  const warnings: string[] = [];
  let duplicates = 0;
  let skipped = 0;
  let invest = 0;

  const seenExternalIds = new Set(options.existingExternalIds ?? []);
  const seenFingerprints = new Set(options.existingFingerprints ?? []);

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const text = decodeContent(buffer);
    const delimiter = detectDelimiter(text);

    const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
      const commonConfig = {
        header: true,
        skipEmptyLines: 'greedy' as const,
        delimiter,
        error: (error: Error) => reject(error),
      };

      if (CAN_USE_WORKER) {
        Papa.parse<Record<string, unknown>>(text, {
          ...commonConfig,
          worker: true,
          complete: (results: Papa.ParseResult<Record<string, unknown>>) => resolve(results),
        });
      } else {
        Papa.parse<Record<string, unknown>>(text, {
          ...commonConfig,
          complete: (results: Papa.ParseResult<Record<string, unknown>>) => resolve(results),
        });
      }
    });

    if (parsed.errors.length > 0) {
      warnings.push(
        `${file.name}: ${parsed.errors.length} errors при чтении CSV (попробуйте проверить формат)`,
      );
    }

    const headers = parsed.meta.fields ?? Object.keys(parsed.data[0] ?? {});
    const headerMap = buildHeaderMap(headers);

    if (!headerMap.postedAt || !headerMap.amount || !headerMap.description) {
      warnings.push(`${file.name}: не удалось найти обязательные колонки`);
      continue;
    }

    const perFileExternalIds = new Set<string>();
    const perFileFingerprints = new Set<string>();

    for (const row of parsed.data) {
      const postedAtRaw = row[headerMap.postedAt];
      const amountRaw = row[headerMap.amount];
      const descriptionRaw = row[headerMap.description];
      const signRaw = headerMap.sign ? row[headerMap.sign] : undefined;

      const postedAt = parseDateValue(postedAtRaw);
      const amount = parseAmountValue(amountRaw, signRaw);
      const description = typeof descriptionRaw === 'string' ? descriptionRaw : String(descriptionRaw ?? '');

      if (!postedAt || amount === undefined || !description) {
        skipped += 1;
        continue;
      }

      const counterpartyRaw = headerMap.counterparty ? row[headerMap.counterparty] : undefined;
      const counterpartyStr = typeof counterpartyRaw === 'string' ? counterpartyRaw : undefined;

      const extractedCounterparty =
        counterpartyStr && counterpartyStr.trim().length > 0
          ? counterpartyStr
          : extractCounterpartyFromDescription(description) ?? undefined;

      const normalizedCounterparty = normalizeCounterparty(extractedCounterparty ?? counterpartyStr ?? description);
      const currencyRaw = headerMap.currency ? row[headerMap.currency] : undefined;
      const currency = typeof currencyRaw === 'string' && currencyRaw.trim().length > 0
        ? currencyRaw.trim().toUpperCase()
        : 'RUB';
      const bankRaw = headerMap.bank ? row[headerMap.bank] : undefined;
      const bank = typeof bankRaw === 'string' ? normalizeWhitespace(bankRaw) : undefined;
      const accountMaskRaw = headerMap.accountMask ? row[headerMap.accountMask] : undefined;
      const accountMask = typeof accountMaskRaw === 'string' ? normalizeWhitespace(accountMaskRaw) : undefined;
      const mccRaw = headerMap.mcc ? row[headerMap.mcc] : undefined;
      const mcc = typeof mccRaw === 'string' ? normalizeWhitespace(mccRaw) : undefined;
      const operationAtRaw = headerMap.operationAt ? row[headerMap.operationAt] : undefined;
      const operationAt = parseDateValue(operationAtRaw);
      const externalIdRaw = headerMap.externalId ? row[headerMap.externalId] : undefined;
      const externalId = typeof externalIdRaw === 'string' ? normalizeWhitespace(externalIdRaw) : undefined;

      const clean = cleanDescription(description);
      const fingerprintSource = `${(bank ?? '').toLowerCase()}|${postedAt}|${Math.abs(amount)}|${currency}|${clean.slice(0, 60)}`;
      const fingerprint = sha256(fingerprintSource);

      if (externalId) {
        if (perFileExternalIds.has(externalId) || seenExternalIds.has(externalId)) {
          duplicates += 1;
          continue;
        }
      } else if (perFileFingerprints.has(fingerprint) || seenFingerprints.has(fingerprint)) {
        duplicates += 1;
        continue;
      }

      const investFlag = isInvestOperation(description, amount);
      if (investFlag) {
        invest += 1;
      }

      const operation: Operation = {
        id: `op-${fingerprint.slice(0, 12)}`,
        externalId: externalId || undefined,
        bank,
        postedAt,
        operationAt,
        amount,
        descriptionRaw: description,
        counterparty: extractedCounterparty ?? counterpartyStr ?? undefined,
        counterpartyNormalized: normalizedCounterparty,
        mcc,
        currency,
        accountMask,
        fingerprint,
        isInvest: investFlag,
      };

      operations.push(operation);

      if (externalId) {
        perFileExternalIds.add(externalId);
        seenExternalIds.add(externalId);
      } else {
        perFileFingerprints.add(fingerprint);
        seenFingerprints.add(fingerprint);
      }
    }
  }

  const summary: LoadSummary = {
    total: operations.length + duplicates + skipped,
    invest,
    main: operations.length - invest,
    duplicates,
    skipped,
  };

  return { operations, summary, warnings };
}
