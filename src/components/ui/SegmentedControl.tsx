import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const containerPadding = size === 'sm' ? 'p-0.5' : 'p-1';
  const itemPadding = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]';

  return (
    <div
      role="radiogroup"
      className={`inline-flex rounded-[8px] bg-surface-2 border border-hairline ${containerPadding} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center gap-1.5 font-medium rounded-[6px] transition-colors cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none ${itemPadding} ${
              isSelected
                ? 'bg-surface text-ink font-semibold border border-hairline/60 shadow-none'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="font-mono text-[10px] px-1 py-0.2 rounded-full bg-hairline text-ink">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
