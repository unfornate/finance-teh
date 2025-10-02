import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AutomationTrack,
  ClientProfile,
  DeviceBlueprint,
  TimelinePoint,
  VoiceProtocol,
  UnlockPipelineItem,
  clients as initialClients,
  deviceBlueprints as initialIntakes,
  automations as initialAutomations,
  timeline as timelineData,
  voiceProtocols as initialVoiceProtocols,
  unlockPipeline as initialUnlockPipeline,
  deviceRegistry,
} from '../data/crmData';

type DeviceIdentifier = string;

export interface NewIntakePayload {
  clientId: string;
  identifier: DeviceIdentifier;
  issues: string[];
  intakeChannel: DeviceBlueprint['intakeChannel'];
  notes?: string;
  priority?: DeviceBlueprint['priority'];
  technician?: string;
}

export interface KPICard {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  hint?: string;
}

export interface CRMContextValue {
  clients: ClientProfile[];
  intakes: DeviceBlueprint[];
  automations: AutomationTrack[];
  timeline: TimelinePoint[];
  voiceProtocols: VoiceProtocol[];
  unlockPipeline: UnlockPipelineItem[];
  kpiCards: KPICard[];
  intakeStatusBreakdown: Array<{ status: DeviceBlueprint['status']; count: number; }>;
  unlockStatusBreakdown: Array<{ status: UnlockPipelineItem['status']; count: number; }>;
  voiceCoverage: number;
  lookupDeviceByIdentifier: (identifier: DeviceIdentifier) => Partial<DeviceBlueprint> | undefined;
  createIntake: (payload: NewIntakePayload) => DeviceBlueprint;
}

const CRMContext = createContext<CRMContextValue | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients] = useState<ClientProfile[]>(initialClients);
  const [intakes, setIntakes] = useState<DeviceBlueprint[]>(initialIntakes);
  const [voiceProtocols, setVoiceProtocols] = useState<VoiceProtocol[]>(initialVoiceProtocols);
  const [unlockPipeline, setUnlockPipeline] = useState<UnlockPipelineItem[]>(initialUnlockPipeline);
  const [automations] = useState<AutomationTrack[]>(initialAutomations);

  const lookupDeviceByIdentifier = useCallback((identifier: DeviceIdentifier) => {
    if (!identifier) return undefined;
    return deviceRegistry[identifier.trim()];
  }, []);

  const createIntake = useCallback(
    (payload: NewIntakePayload) => {
      const base = lookupDeviceByIdentifier(payload.identifier) ?? {};

      const now = new Date().toISOString();
      const newIntake: DeviceBlueprint = {
        id: `in-${String(intakes.length + 1).padStart(3, '0')}`,
        clientId: payload.clientId,
        deviceType: base.deviceType ?? 'phone',
        brand: base.brand ?? 'Apple',
        model: base.model ?? 'Device',
        imei: payload.identifier.length > 12 ? payload.identifier : undefined,
        serial: payload.identifier.length <= 12 ? payload.identifier : undefined,
        color: base.color ?? 'Не указано',
        storage: base.storage ?? '—',
        condition: base.condition ?? 'needs-diagnostics',
        batteryHealth: base.batteryHealth ?? 0,
        icloudStatus: base.icloudStatus ?? 'clean',
        issues: payload.issues.length ? payload.issues : base.issues ?? ['Требуется диагностика'],
        priority: payload.priority ?? 'medium',
        intakeChannel: payload.intakeChannel,
        voiceTranscript: payload.notes,
        createdAt: now,
        status: 'diagnostics',
        estimatedReadyAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        technician: payload.technician ?? 'Не назначен',
        attachments: 0,
      };

      setIntakes((prev) => [newIntake, ...prev]);

      if (payload.notes) {
        const voiceProtocol: VoiceProtocol = {
          id: `vp-${String(voiceProtocols.length + 1).padStart(3, '0')}`,
          clientId: payload.clientId,
          intakeId: newIntake.id,
          startedAt: now,
          duration: 95,
          transcript: payload.notes,
          keywords: payload.issues.slice(0, 3),
          qaScore: 80,
        };
        setVoiceProtocols((prev) => [voiceProtocol, ...prev]);
      }

      if (newIntake.icloudStatus === 'pending-unlock') {
        const unlock: UnlockPipelineItem = {
          id: `up-${String(unlockPipeline.length + 1).padStart(3, '0')}`,
          clientId: payload.clientId,
          intakeId: newIntake.id,
          device: `${newIntake.brand} ${newIntake.model}`,
          countryLock: 'Уточняется',
          status: 'submitted',
          createdAt: now,
          eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          margin: 9500,
          risk: 'medium',
        };
        setUnlockPipeline((prev) => [unlock, ...prev]);
      }

      return newIntake;
    },
    [intakes.length, lookupDeviceByIdentifier, unlockPipeline.length, voiceProtocols.length],
  );

  const intakeStatusBreakdown = useMemo(() => {
    const map = new Map<DeviceBlueprint['status'], number>();
    intakes.forEach((intake) => {
      map.set(intake.status, (map.get(intake.status) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [intakes]);

  const unlockStatusBreakdown = useMemo(() => {
    const map = new Map<UnlockPipelineItem['status'], number>();
    unlockPipeline.forEach((item) => {
      map.set(item.status, (map.get(item.status) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [unlockPipeline]);

  const voiceCoverage = useMemo(() => {
    if (!intakes.length) return 0;
    const covered = voiceProtocols.length;
    return Math.round((covered / intakes.length) * 100);
  }, [intakes.length, voiceProtocols.length]);

  const kpiCards = useMemo<KPICard[]>(() => {
    const lastWeek = timelineData[timelineData.length - 1];
    const prevWeek = timelineData[timelineData.length - 2];

    const intakeDiff = lastWeek && prevWeek ? lastWeek.intake - prevWeek.intake : 0;
    const unlockDiff = lastWeek && prevWeek ? lastWeek.unlocks - prevWeek.unlocks : 0;

    const totalUnlockMargin = unlockPipeline.reduce((acc, item) => acc + item.margin, 0);
    const completedUnlocks = unlockPipeline.filter((item) => item.status === 'completed').length || 1;

    const avgUnlockMargin = Math.round(totalUnlockMargin / completedUnlocks);

    const avgQa = voiceProtocols.length
      ? Math.round(voiceProtocols.reduce((acc, item) => acc + item.qaScore, 0) / voiceProtocols.length)
      : 0;

    const marketingLift = automations.find((item) => item.id === 'auto-marketing-alerts');

    return [
      {
        id: 'weekly-intake',
        label: 'Приёмок за неделю',
        value: lastWeek ? String(lastWeek.intake) : '—',
        trendLabel: `${intakeDiff >= 0 ? '+' : ''}${intakeDiff} за неделю`,
        trendDirection: intakeDiff === 0 ? 'flat' : intakeDiff > 0 ? 'up' : 'down',
        hint: 'Считаем все точки сети',
      },
      {
        id: 'unlock-velocity',
        label: 'Активных анлоков',
        value: String(unlockPipeline.filter((item) => item.status !== 'completed').length),
        trendLabel: `${unlockDiff >= 0 ? '+' : ''}${unlockDiff} к прошлой неделе`,
        trendDirection: unlockDiff === 0 ? 'flat' : unlockDiff > 0 ? 'up' : 'down',
        hint: 'Мониторим этапы в Apple',
      },
      {
        id: 'voice-qa',
        label: 'QA голосовых протоколов',
        value: `${avgQa}%`,
        trendLabel: `${voiceCoverage}% покрытие приёмок`,
        trendDirection: avgQa >= 85 ? 'up' : 'flat',
        hint: 'Минимум 80% для сети',
      },
      {
        id: 'upsell',
        label: 'Средний маржинальный анлок',
        value: `${avgUnlockMargin.toLocaleString('ru-RU')} ₽`,
        trendLabel: marketingLift?.kpi ?? '—',
        trendDirection: 'up',
        hint: 'С учётом доп. продаж',
      },
    ];
  }, [automations, unlockPipeline, voiceCoverage, voiceProtocols, timelineData]);

  const value: CRMContextValue = useMemo(
    () => ({
      clients,
      intakes,
      automations,
      timeline: timelineData,
      voiceProtocols,
      unlockPipeline,
      kpiCards,
      intakeStatusBreakdown,
      unlockStatusBreakdown,
      voiceCoverage,
      lookupDeviceByIdentifier,
      createIntake,
    }),
    [
      automations,
      clients,
      createIntake,
      intakeStatusBreakdown,
      intakes,
      kpiCards,
      lookupDeviceByIdentifier,
      timelineData,
      unlockPipeline,
      unlockStatusBreakdown,
      voiceCoverage,
      voiceProtocols,
    ],
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const ctx = useContext(CRMContext);
  if (!ctx) {
    throw new Error('useCRM must be used inside CRMProvider');
  }
  return ctx;
};
