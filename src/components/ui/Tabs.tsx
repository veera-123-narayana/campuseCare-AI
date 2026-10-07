import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-hairline flex items-center gap-6 ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`group relative pb-3 pt-1 text-[14px] font-medium transition-colors select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 ${
              isActive
                ? 'text-ink font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent border-accent/20'
                    : 'bg-surface-2 text-muted border-hairline group-hover:border-muted/30'
                }`}
              >
                {tab.count}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
};
