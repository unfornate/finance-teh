import React from 'react';
import { useCRM } from '../context/CRMContext';
import { SectionCard } from '../components/SectionCard';

const VoicePage: React.FC = () => {
  const { voiceProtocols, clients, intakes } = useCRM();

  const guidelines = [
    'Включаем запись до приветствия, клиент соглашается на протокол.',
    'CRM сама делает расшифровку, выделяет красные флаги и подшивает в карточку.',
    'Если QA ниже 80, система просит руководителя послушать и дать обратную связь.',
  ];

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <p className="page-tag">Голос и протоколы</p>
          <h1>Каждый диалог с клиентом превращаем в доказательство</h1>
          <p className="page-lead">
            Микрофон 24/7 на приёмке, запись → текст → чеклист. Клиент подписывает акт, а команда видит, где сбоит скрипт.
          </p>
        </div>
      </header>

      <SectionCard title="Живые протоколы" description="Последние расшифровки, ключевые слова и оценка качества">
        <div className="voice-grid">
          {voiceProtocols.map((protocol) => {
            const client = clients.find((c) => c.id === protocol.clientId);
            const intake = intakes.find((item) => item.id === protocol.intakeId);
            return (
              <article key={protocol.id} className="voice-card">
                <header>
                  <h3>{client?.name}</h3>
                  <span>{new Date(protocol.startedAt).toLocaleString('ru-RU')}</span>
                </header>
                <p className="voice-card__transcript">{protocol.transcript}</p>
                <div className="voice-card__footer">
                  <div>
                    <span className="voice-card__badge">{intake?.model}</span>
                    <span className="voice-card__badge">QA {protocol.qaScore}%</span>
                  </div>
                  <div className="voice-card__keywords">
                    {protocol.keywords.map((keyword) => (
                      <span key={keyword}>#{keyword}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Регламент и инфраструктура" description="Что нужно, чтобы голос работал без боли">
        <ul className="voice-guidelines">
          {guidelines.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="voice-stack">
          <div>
            <h3>Стек</h3>
            <p>Микрофон USB + Mac mini • 11labs • Whisper / GPT • облако для хранения аудио</p>
          </div>
          <div>
            <h3>Доступы</h3>
            <p>Каждая запись хранится в защищённом контуре, расшаривается только по ролям</p>
          </div>
          <div>
            <h3>Монетизация</h3>
            <p>Голосовые ошибки → обучение администраторов → апсейлы на гарантию и аксессуары</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default VoicePage;
