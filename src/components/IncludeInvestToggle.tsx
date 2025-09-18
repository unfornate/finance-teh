import React from 'react';
import { useAppState } from '../context/AppStateContext';

const IncludeInvestToggle: React.FC = () => {
  const { state, dispatch, investOperations } = useAppState();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_INCLUDE_INVEST', payload: event.target.checked });
  };

  return (
    <div className="invest-toggle">
      <label className="switch">
        <input type="checkbox" checked={state.includeInvest} onChange={handleChange} />
        <span className="slider" />
      </label>
      <div className="toggle-info">
        <span>Включать копилку</span>
        <span className="hint">{investOperations.length} операций в копилке</span>
      </div>
    </div>
  );
};

export default IncludeInvestToggle;
