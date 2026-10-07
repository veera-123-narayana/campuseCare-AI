import React from 'react';
import { PriorityLevel } from '../../types';

export interface PriorityPillProps {
  priority: PriorityLevel;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const priorityConfig: Record<
  PriorityLevel,
  { label: string; text: string; bg: string; border: string; bar: string }
> = {
  GREEN: {
    label: 'INFO',
    text: 'text-status-green',
    bg: 'bg-status-green-soft',
    border: 'border-status-green/25',
    bar: 'bg-status-green',
  },
  YELLOW: {
    label: 'ATTENTION',
    text: 'text-status-yellow',
    bg: 'bg-status-yellow-soft',
    border: 'border-status-yellow/25',
    bar: 'bg-status-yellow',
  },
  ORANGE: {
    label: 'REVIEW REQUIRED',
    text: 'text-status-orange',
    bg: 'bg-status-orange-soft',
    border: 'border-status-orange/25',
    bar: 'bg-status-orange',
  },
  RED: {
    label: 'CRITICAL',
    text: 'text-status-red',
    bg: 'bg-status-red-soft',
    border: 'border-status-red/25',
    bar: 'bg-status-red',
  },
};

export const PriorityPill: React.FC<PriorityPillProps> = ({
  priority,
  label,
  size = 'md',
  className = '',
}) => {
  const config = priorityConfig[priority];
  const displayLabel = label || `${priority} · ${config.label}`;

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] tracking-wide'
      : 'px-2.5 py-1 text-[11px] tracking-wider';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium uppercase rounded-full border leading-none transition-colors select-none ${config.bg} ${config.text} ${config.border} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.bar}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
