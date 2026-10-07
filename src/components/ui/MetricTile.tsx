import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { DataSourceType } from '../../types';
import { SourceBadge } from './SourceBadge';

export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  source: DataSourceType;
  subtext?: string;
  dominant?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  delta,
  source,
  subtext,
  dominant = false,
  className = '',
  onClick,
}) => {
  const dominantStyles = dominant
    ? 'border-accent/50 bg-accent-soft/30 dark:bg-accent-soft/10 ring-1 ring-accent/20'
    : 'border-hairline bg-surface';

  return (
    <div
      onClick={onClick}
      className={`rounded-[12px] border ${dominantStyles} p-6 flex flex-col justify-between transition-colors ${
        onClick ? 'cursor-pointer hover:border-muted/50' : ''
      } ${className}`}
    >
      {/* Header: Label & Data Provenance Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted line-clamp-1">
          {label}
        </span>
        <SourceBadge source={source} size="sm" />
      </div>

      {/* Main Metric: 44px Hero Mono Value + Unit */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[44px] font-mono font-medium tracking-tight text-ink tabular-nums leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-[14px] font-mono text-muted tracking-normal">
            {unit}
          </span>
        )}
      </div>

      {/* Footer: Delta and operational subtext */}
      <div className="flex items-center justify-between text-[13px] pt-3 border-t border-hairline/60 mt-1">
        {delta ? (
          <div className="flex items-center gap-1 font-mono text-[12px]">
            {delta.trend === 'up' && (
              <ArrowUpRight
                className={`w-3.5 h-3.5 ${
                  delta.isPositive ? 'text-status-green' : 'text-status-orange'
                }`}
              />
            )}
            {delta.trend === 'down' && (
              <ArrowDownRight
                className={`w-3.5 h-3.5 ${
                  delta.isPositive ? 'text-status-green' : 'text-status-orange'
                }`}
              />
            )}
            {delta.trend === 'neutral' && (
              <Minus className="w-3.5 h-3.5 text-muted" />
            )}
            <span
              className={
                delta.isPositive === undefined
                  ? 'text-muted'
                  : delta.isPositive
                  ? 'text-status-green'
                  : 'text-status-orange'
              }
            >
              {delta.value}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-muted">—</span>
        )}

        {subtext && (
          <span className="text-[12px] text-muted truncate max-w-[55%] text-right" title={subtext}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
