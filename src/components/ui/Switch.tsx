import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const switchId = id || (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative inline-flex items-center">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-10 h-5 rounded-full border transition-colors ${
            checked
              ? 'bg-accent border-accent'
              : 'bg-surface-2 border-hairline peer-hover:border-muted/50'
          } peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-1`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            } mt-[2px] shadow-none`}
          />
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-[14px] font-medium text-ink leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[12px] text-muted leading-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
