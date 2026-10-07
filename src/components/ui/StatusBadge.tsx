import React from 'react';
import { OperationalStatus } from '../../types';

export interface StatusBadgeProps {
  status: OperationalStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<
  OperationalStatus,
  { label: string; text: string; bg: string; dot: string; border: string }
> = {
  normal: {
    label: 'Normal Operation',
    text: 'text-status-green',
    bg: 'bg-status-green-soft',
    dot: 'bg-status-green',
    border: 'border-status-green/20',
  },
  attention: {
    label: 'Attention Needed',
    text: 'text-status-yellow',
    bg: 'bg-status-yellow-soft',
    dot: 'bg-status-yellow',
    border: 'border-status-yellow/20',
  },
  review: {
    label: 'Review Required',
    text: 'text-status-orange',
    bg: 'bg-status-orange-soft',
    dot: 'bg-status-orange',
    border: 'border-status-orange/20',
  },
  critical: {
    label: 'Critical Alert',
    text: 'text-status-red',
    bg: 'bg-status-red-soft',
    dot: 'bg-status-red',
    border: 'border-status-red/20',
  },
  inactive: {
    label: 'Idle / Standby',
    text: 'text-status-gray',
    bg: 'bg-status-gray-soft',
    dot: 'bg-status-gray',
    border: 'border-status-gray/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-[12px] gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border leading-none transition-colors select-none ${config.bg} ${config.text} ${config.border} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
