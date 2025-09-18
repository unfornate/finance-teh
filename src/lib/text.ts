const cityTokens = [
  'moscow',
  'moskva',
  'saint petersburg',
  'sankt',
  'russia',
  'rus',
  'rf',
  'ru',
  'россия',
  'москва',
];

const investKeywords = [
  'инвесткопил',
  'копилк',
  'перевод для пополнения счета инвесткопилка',
  'внутренний перевод на договор',
  'внутрибанковский перевод с договора',
];

const investRoundingValues = new Set([9, 10, 30, 50, 70, 90, 100, 150]);

export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/[\u00A0\t]+/g, ' ')
    .trim();
}

export function cleanDescription(input: string): string {
  return normalizeWhitespace(input)
    .toLowerCase()
    .replace(/[^a-zа-я0-9*\s@#:+]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripCitySuffix(value: string): string {
  let result = value;
  for (const token of cityTokens) {
    const regex = new RegExp(`\\s+${token}$`, 'i');
    result = result.replace(regex, '');
  }
  return normalizeWhitespace(result.replace(/\bRUS\b/gi, ''));
}

export function extractCounterpartyFromDescription(description: string): string | undefined {
  const normalized = normalizeWhitespace(description);

  const internalAccount = normalized.match(/перевод[^\d]*(\d{6,})/i);
  if (internalAccount) {
    return internalAccount[1];
  }

  const cardTransfer = normalized.match(/(?:на|с)\s+карт[ыу]\s+([\d*\s]{6,})/i);
  if (cardTransfer) {
    return normalizeWhitespace(cardTransfer[1]);
  }

  const phoneTransfer = normalized.match(/(\+7[\d\s\-()]{9,})/i);
  if (phoneTransfer) {
    return phoneTransfer[1].replace(/\s+/g, '');
  }

  const starName = normalized.match(/^([-A-Z0-9*]+(?:\*[-A-Z0-9*]+)*)/i);
  if (starName && starName[1].length > 3) {
    return stripCitySuffix(starName[1]);
  }

  const latinMatch = normalized.match(/^([A-Z0-9 .,'*#-]{3,})/);
  if (latinMatch) {
    return stripCitySuffix(latinMatch[1]);
  }

  const words = normalized.split(' ');
  if (words.length > 0) {
    return stripCitySuffix(words.slice(0, 4).join(' '));
  }
  return undefined;
}

export function normalizeCounterparty(value?: string): string {
  if (!value) return '';
  const raw = normalizeWhitespace(value)
    .replace(/\bг\.?\s+/gi, '')
    .replace(/\b(город|russia|rus|ru)\b/gi, '')
    .replace(/[.,]+$/g, '');
  return stripCitySuffix(raw).toUpperCase();
}

export function isInvestOperation(description: string, amount: number): boolean {
  const lowered = description.toLowerCase();
  const hasKeyword = investKeywords.some((keyword) => lowered.includes(keyword));
  if (!hasKeyword) {
    return false;
  }
  const rounded = Math.abs(Math.round(amount));
  if (investRoundingValues.has(rounded)) {
    return true;
  }
  return true;
}
