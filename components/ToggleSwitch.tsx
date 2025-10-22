import React from 'react';
import { CheckIcon } from './icons/CheckIcon';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange }) => {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!enabled)}>
      <label htmlFor="toggle-switch" className="text-sm text-slate-300 cursor-pointer">{label}</label>
      <button
        type="button"
        className={`${
          enabled ? 'bg-cyan-600' : 'bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
        role="switch"
        aria-checked={enabled}
        id="toggle-switch"
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        >
         <span
            className={`${
              enabled ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            aria-hidden="true"
          >
             <CheckIcon className="h-4 w-4 text-cyan-600" />
          </span>
           <span
            className={`${
              enabled ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            aria-hidden="true"
          >
          </span>
        </span>
      </button>
    </div>
  );
};

export default ToggleSwitch;
