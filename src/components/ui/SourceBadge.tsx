import React from 'react';
import { DataSourceType } from '../../types';

export interface SourceBadgeProps {
  source: DataSourceType;
  size?: 'sm' | 'md';
  className?: string;
  showTooltip?: boolean;
}

const sourceDescriptions: Record<DataSourceType, string> = {
  LIVE: 'Real-time telemetry stream from authenticated campus sub-meters and hardware gateways',
  PI: 'Edge computing cluster running on physical Raspberry Pi nodes and micro-controllers',
  SIMULATED: 'Predictive mathematical heuristic model. Not direct hardware telemetry.',
};

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  size = 'md',
  className = '',
}) => {
  const isSimulated = source === 'SIMULATED';

  const baseStyles =
    'inline-flex items-center font-mono font-semibold tracking-wider uppercase rounded-full select-none tabular-nums';

  const sizeStyles =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[9px] leading-tight'
      : 'px-2 py-0.5 text-[10px] leading-tight';

  // Distinct Control Room styling:
  // LIVE: solid pill, muted ink, accent micro-dot
  // PI: solid pill, surface-2, subtle border
  // SIMULATED: dashed-outline, clearly demarcated as non-real hardware telemetry
  let styleClasses = '';
  if (source === 'LIVE') {
    styleClasses = 'bg-accent-soft text-accent border border-accent/30';
  } else if (source === 'PI') {
    styleClasses = 'bg-surface-2 text-ink border border-hairline';
  } else {
    // SIMULATED: dashed outline
    styleClasses = 'bg-transparent text-muted border border-dashed border-muted/50';
  }

  return (
    <span
      title={sourceDescriptions[source]}
      className={`${baseStyles} ${sizeStyles} ${styleClasses} ${className}`}
      data-source={source}
    >
      {source === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1 shrink-0" />}
      {source === 'PI' && <span className="w-1.5 h-1.5 rounded-[1px] bg-muted mr-1 shrink-0" />}
      {isSimulated && <span className="w-1.5 h-1.5 rounded-full border border-dashed border-muted mr-1 shrink-0" />}
      {source}
    </span>
  );
};
