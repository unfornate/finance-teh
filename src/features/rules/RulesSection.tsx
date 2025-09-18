import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { CategorizationRule, RulePattern, CategorySelection } from '../../lib/types';
import CategorySelect from '../../components/CategorySelect';
import { ensureSubcategory } from '../../data/categories';

const defaultSelection = ensureSubcategory('Не уточнено', 'Не уточнено');

const RulesSection: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [newRulePatterns, setNewRulePatterns] = React.useState('');
  const [newRuleLabel, setNewRuleLabel] = React.useState('');
  const [newRuleCategory, setNewRuleCategory] = React.useState<CategorySelection>(defaultSelection);

  const rules = React.useMemo(
    () => [...state.rules].sort((a, b) => b.priority - a.priority),
    [state.rules],
  );

  const handleToggle = (rule: CategorizationRule) => {
    dispatch({ type: 'TOGGLE_RULE', payload: { id: rule.id, active: !rule.active } });
  };

  const handleDelete = (rule: CategorizationRule) => {
    if (window.confirm(`Удалить правило «${rule.label}»?`)) {
      dispatch({ type: 'DELETE_RULE', payload: { id: rule.id } });
    }
  };

  const handlePriorityChange = (rule: CategorizationRule, delta: number) => {
    const next = Math.max(0, rule.priority + delta);
    dispatch({ type: 'SET_RULE_PRIORITY', payload: { id: rule.id, priority: next } });
  };

  const handlePatternChange = (rule: CategorizationRule, value: string) => {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const patterns: RulePattern[] = lines.map((line) => {
      const [type, ...rest] = line.split(':');
      const valuePart = rest.join(':').trim();
      if (type && valuePart && (type === 'equals' || type === 'contains')) {
        return { type: type as 'equals' | 'contains', value: valuePart.toLowerCase() };
      }
      return { type: 'contains', value: line.toLowerCase() };
    });
    dispatch({ type: 'SET_RULE_PATTERNS', payload: { id: rule.id, patterns } });
  };

  const handleCreateRule = () => {
    if (!newRuleLabel.trim()) {
      return;
    }
    const patterns: RulePattern[] = newRulePatterns
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ type: 'contains', value: line.toLowerCase() }));
    if (patterns.length === 0) {
      patterns.push({ type: 'contains', value: newRuleLabel.trim().toLowerCase() });
    }
    const now = new Date().toISOString();
    const rule: CategorizationRule = {
      id: `rule-${now}`,
      label: newRuleLabel,
      patterns,
      category: newRuleCategory.category,
      subcategory: newRuleCategory.subcategory,
      active: true,
      priority: 100,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'UPSERT_RULE', payload: rule });
    setNewRuleLabel('');
    setNewRulePatterns('');
    setNewRuleCategory(defaultSelection);
  };

  return (
    <section className="column">
      <div className="card">
        <h2>Создать правило вручную</h2>
        <div className="form-grid">
          <label>
            <span>Название / подсказка</span>
            <input value={newRuleLabel} onChange={(event) => setNewRuleLabel(event.target.value)} placeholder="Например, OZON" />
          </label>
          <label>
            <span>Паттерны (по одному в строке)</span>
            <textarea
              rows={3}
              value={newRulePatterns}
              onChange={(event) => setNewRulePatterns(event.target.value)}
              placeholder="contains: ozon\n equals: ozon"
            />
          </label>
          <label>
            <span>Категория и подкатегория</span>
            <CategorySelect value={newRuleCategory} onChange={setNewRuleCategory} />
          </label>
        </div>
        <div className="actions">
          <button className="primary" onClick={handleCreateRule}>
            Сохранить правило
          </button>
        </div>
      </div>
      <div className="card">
        <h2>Активные правила</h2>
        {rules.length === 0 ? (
          <p className="placeholder">Правил пока нет. Создайте их из контрагентов или операций.</p>
        ) : (
          <div className="rules-list">
            {rules.map((rule) => (
              <div key={rule.id} className={`rule-item ${rule.active ? '' : 'inactive'}`}>
                <div className="rule-header">
                  <div>
                    <h3>{rule.label}</h3>
                    <p className="hint">
                      Приоритет: {rule.priority} · Категория: {rule.category} → {rule.subcategory}
                    </p>
                  </div>
                  <div className="inline">
                    <label className="switch small">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => handleToggle(rule)}
                      />
                      <span className="slider" />
                    </label>
                    <button className="secondary" onClick={() => handlePriorityChange(rule, 10)}>
                      +10
                    </button>
                    <button className="secondary" onClick={() => handlePriorityChange(rule, -10)}>
                      -10
                    </button>
                    <button className="danger" onClick={() => handleDelete(rule)}>
                      Удалить
                    </button>
                  </div>
                </div>
                <textarea
                  className="patterns"
                  value={rule.patterns.map((pattern) => `${pattern.type}: ${pattern.value}`).join('\n')}
                  onChange={(event) => handlePatternChange(rule, event.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RulesSection;
