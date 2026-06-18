import React from 'react';
import { Check, Minus } from 'lucide-react';
import './TriStateCheckbox.css';

const TriStateCheckbox = ({ state, onChange, label, className = '' }) => {
  // state: 0 (vazio), 1 (certo), 2 (n/a)
  return (
    <label className={`tri-state-wrapper ${className}`} onClick={(e) => { e.preventDefault(); onChange(); }}>
      <div className={`tri-state-box state-${state}`}>
        {state === 1 && <Check size={14} strokeWidth={3} />}
        {state === 2 && <Minus size={14} strokeWidth={3} />}
      </div>
      {label && <span className="tri-state-label">{label}</span>}
    </label>
  );
};

export default TriStateCheckbox;
