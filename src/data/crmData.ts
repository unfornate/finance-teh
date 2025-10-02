export interface ClientProfile {
  id: string;
  name: string;
  owner: string;
  phone: string;
  city: string;
  channel: 'organic' | 'referral' | 'ads' | 'community';
  healthScore: number;
  lastContact: string;
  activeTickets: number;
  monthlyOrders: number;
  avgCheck: number;
  unlockShare: number;
  marketingOptIn: boolean;
  notes: string;
  tags: string[];
}

export interface DeviceBlueprint {
  id: string;
  clientId: string;
  deviceType: 'phone' | 'tablet' | 'laptop' | 'watch';
  brand: string;
  model: string;
  imei?: string;
  serial?: string;
  color: string;
  storage: string;
  condition: 'new' | 'refurbished' | 'needs-diagnostics' | 'after-market';
  batteryHealth: number;
  icloudStatus: 'clean' | 'lost' | 'pending-unlock';
  issues: string[];
  priority: 'low' | 'medium' | 'high';
  intakeChannel: 'in-store' | 'courier' | 'postal';
  voiceTranscript?: string;
  createdAt: string;
  status: 'diagnostics' | 'waiting-parts' | 'unlock' | 'ready' | 'handover';
  estimatedReadyAt: string;
  technician: string;
  attachments: number;
}

export interface AutomationTrack {
  id: string;
  title: string;
  description: string;
  owner: string;
  coverage: number;
  status: 'pilot' | 'active' | 'backlog';
  kpi: string;
  nextReview: string;
}

export interface TimelinePoint {
  date: string;
  intake: number;
  unlocks: number;
  avgCheck: number;
  marketingUpsells: number;
}

export interface VoiceProtocol {
  id: string;
  clientId: string;
  intakeId: string;
  startedAt: string;
  duration: number;
  transcript: string;
  keywords: string[];
  qaScore: number;
}

export interface UnlockPipelineItem {
  id: string;
  clientId: string;
  intakeId: string;
  device: string;
  countryLock: string;
  status: 'waiting-payment' | 'submitted' | 'apple-review' | 'completed';
  createdAt: string;
  eta: string;
  margin: number;
  risk: 'low' | 'medium' | 'high';
}

export const clients: ClientProfile[] = [
  {
    id: 'cl-apple-doctor',
    name: 'Apple Doctor',
    owner: 'Арсен Г.',
    phone: '+7 900 111-22-33',
    city: 'Москва',
    channel: 'community',
    healthScore: 88,
    lastContact: '2024-03-09',
    activeTickets: 28,
    monthlyOrders: 194,
    avgCheck: 11200,
    unlockShare: 0.42,
    marketingOptIn: true,
    notes: 'Ищут быстрый анлок, пробуют голосовые протоколы на фронте.',
    tags: ['флагман', 'премиум', 'ИИ-скрипты'],
  },
  {
    id: 'cl-hardrock',
    name: 'HardRock Service',
    owner: 'Илья Х.',
    phone: '+7 812 555-44-77',
    city: 'Санкт-Петербург',
    channel: 'referral',
    healthScore: 74,
    lastContact: '2024-03-11',
    activeTickets: 16,
    monthlyOrders: 132,
    avgCheck: 8600,
    unlockShare: 0.23,
    marketingOptIn: true,
    notes: 'Семь точек, ищут апгрейд самописной CRM.',
    tags: ['сеть', 'самописная-CRM'],
  },
  {
    id: 'cl-ish-service',
    name: 'ISH Lab',
    owner: 'Денис С.',
    phone: '+48 22 520-30-90',
    city: 'Варшава',
    channel: 'organic',
    healthScore: 69,
    lastContact: '2024-03-07',
    activeTickets: 9,
    monthlyOrders: 84,
    avgCheck: 14300,
    unlockShare: 0.31,
    marketingOptIn: false,
    notes: 'Тестируют QR-приемку и доставку по Европе.',
    tags: ['европа', 'qr-приемка'],
  },
  {
    id: 'cl-yk-tech',
    name: 'YK Tech',
    owner: 'Юсуф К.',
    phone: '+7 995 007-65-43',
    city: 'Казань',
    channel: 'ads',
    healthScore: 81,
    lastContact: '2024-03-10',
    activeTickets: 21,
    monthlyOrders: 156,
    avgCheck: 9100,
    unlockShare: 0.47,
    marketingOptIn: true,
    notes: 'Строят бесплатную CRM как точку входа, фокус на анлоках.',
    tags: ['анлок', 'бесплатная-CRM'],
  },
];

export const deviceRegistry: Record<string, Partial<DeviceBlueprint>> = {
  '353915101010101': {
    deviceType: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    color: 'Deep Purple',
    storage: '256GB',
    batteryHealth: 86,
    icloudStatus: 'pending-unlock',
    issues: ['Face ID не работает', 'Следы вскрытия'],
  },
  '352992002222222': {
    deviceType: 'phone',
    brand: 'Apple',
    model: 'iPhone 13 mini',
    color: 'Blue',
    storage: '128GB',
    batteryHealth: 93,
    icloudStatus: 'clean',
    issues: ['Разбитое стекло'],
  },
  'C02Z50A8MD6N': {
    deviceType: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14" 2023',
    color: 'Space Gray',
    storage: '512GB',
    batteryHealth: 97,
    icloudStatus: 'clean',
    issues: ['Не включается после обновления'],
  },
};

export const deviceBlueprints: DeviceBlueprint[] = [
  {
    id: 'in-001',
    clientId: 'cl-apple-doctor',
    deviceType: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    imei: '353915101010101',
    color: 'Deep Purple',
    storage: '256GB',
    condition: 'needs-diagnostics',
    batteryHealth: 86,
    icloudStatus: 'pending-unlock',
    issues: ['Face ID не работает', 'Следы вскрытия'],
    priority: 'high',
    intakeChannel: 'in-store',
    voiceTranscript: 'Клиент просит сохранить данные, Face ID перестал работать после падения.',
    createdAt: '2024-03-11T09:24:00+03:00',
    status: 'unlock',
    estimatedReadyAt: '2024-03-17T12:00:00+03:00',
    technician: 'Артём',
    attachments: 4,
  },
  {
    id: 'in-002',
    clientId: 'cl-hardrock',
    deviceType: 'phone',
    brand: 'Apple',
    model: 'iPhone 13 mini',
    imei: '352992002222222',
    color: 'Blue',
    storage: '128GB',
    condition: 'after-market',
    batteryHealth: 93,
    icloudStatus: 'clean',
    issues: ['Разбитое стекло'],
    priority: 'medium',
    intakeChannel: 'courier',
    voiceTranscript: 'Курьер привёз, клиент торопится, нужно в тот же день.',
    createdAt: '2024-03-10T17:10:00+03:00',
    status: 'diagnostics',
    estimatedReadyAt: '2024-03-12T15:00:00+03:00',
    technician: 'Светлана',
    attachments: 2,
  },
  {
    id: 'in-003',
    clientId: 'cl-ish-service',
    deviceType: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14" 2023',
    serial: 'C02Z50A8MD6N',
    color: 'Space Gray',
    storage: '512GB',
    condition: 'needs-diagnostics',
    batteryHealth: 97,
    icloudStatus: 'clean',
    issues: ['Не включается после обновления'],
    priority: 'high',
    intakeChannel: 'postal',
    voiceTranscript: 'После обновления macOS экран не загорается, клиент в Польше.',
    createdAt: '2024-03-09T13:40:00+01:00',
    status: 'waiting-parts',
    estimatedReadyAt: '2024-03-18T16:00:00+01:00',
    technician: 'Марек',
    attachments: 3,
  },
];

export const automations: AutomationTrack[] = [
  {
    id: 'auto-voice-protocol',
    title: 'Голосовой протокол приёмки',
    description: 'Авторасшифровка с 11labs + GPT, выделяем риски и формируем протокол в карточке.',
    owner: 'Денис С.',
    coverage: 62,
    status: 'active',
    kpi: '+18% к доверию клиентов по NPS',
    nextReview: '2024-03-21',
  },
  {
    id: 'auto-unlock-routing',
    title: 'Маршрутизация анлоков',
    description: 'Автоотправка заявок в Apple + отслеживание статуса, пуш для техника.',
    owner: 'Юсуф К.',
    coverage: 48,
    status: 'pilot',
    kpi: '-36 часов к сроку разблокировки',
    nextReview: '2024-03-19',
  },
  {
    id: 'auto-marketing-alerts',
    title: 'Маркетинговый радар',
    description: 'Ищем просадки по заказам, запускаем доп. рекламу и прогреваем базу.',
    owner: 'Дмитрий С.',
    coverage: 73,
    status: 'active',
    kpi: '+14% к выручке по сети HardRock',
    nextReview: '2024-03-25',
  },
];

export const timeline: TimelinePoint[] = [
  { date: '2024-02-12', intake: 38, unlocks: 21, avgCheck: 9800, marketingUpsells: 7 },
  { date: '2024-02-19', intake: 41, unlocks: 26, avgCheck: 10200, marketingUpsells: 9 },
  { date: '2024-02-26', intake: 47, unlocks: 24, avgCheck: 10800, marketingUpsells: 11 },
  { date: '2024-03-04', intake: 52, unlocks: 31, avgCheck: 11150, marketingUpsells: 15 },
  { date: '2024-03-11', intake: 58, unlocks: 36, avgCheck: 11800, marketingUpsells: 19 },
];

export const voiceProtocols: VoiceProtocol[] = [
  {
    id: 'vp-001',
    clientId: 'cl-apple-doctor',
    intakeId: 'in-001',
    startedAt: '2024-03-11T09:24:30+03:00',
    duration: 184,
    transcript:
      'Администратор: уточняем Face ID. Клиент: не работает после падения, данные критичны. Администратор: фиксирую, гарантий нет, соглашаемся на диагностику.',
    keywords: ['Face ID', 'критичные данные', 'диагностика'],
    qaScore: 92,
  },
  {
    id: 'vp-002',
    clientId: 'cl-hardrock',
    intakeId: 'in-002',
    startedAt: '2024-03-10T17:11:10+03:00',
    duration: 126,
    transcript: 'Клиент просит ускорить замену стекла, курьер ждёт. Администратор подтверждает готовность к 15:00.',
    keywords: ['срочно', 'курьер', 'замена стекла'],
    qaScore: 87,
  },
];

export const unlockPipeline: UnlockPipelineItem[] = [
  {
    id: 'up-001',
    clientId: 'cl-apple-doctor',
    intakeId: 'in-001',
    device: 'iPhone 14 Pro Max',
    countryLock: 'США / AT&T',
    status: 'apple-review',
    createdAt: '2024-03-11T09:30:00+03:00',
    eta: '2024-03-16T18:00:00+03:00',
    margin: 14500,
    risk: 'medium',
  },
  {
    id: 'up-002',
    clientId: 'cl-yk-tech',
    intakeId: 'in-004',
    device: 'iPhone 12',
    countryLock: 'Япония / SoftBank',
    status: 'submitted',
    createdAt: '2024-03-10T15:20:00+03:00',
    eta: '2024-03-20T12:00:00+03:00',
    margin: 8200,
    risk: 'low',
  },
  {
    id: 'up-003',
    clientId: 'cl-ish-service',
    intakeId: 'in-003',
    device: 'MacBook Pro 14"',
    countryLock: 'iCloud FMI On',
    status: 'waiting-payment',
    createdAt: '2024-03-09T14:00:00+01:00',
    eta: '2024-03-19T10:00:00+01:00',
    margin: 11800,
    risk: 'high',
  },
];
