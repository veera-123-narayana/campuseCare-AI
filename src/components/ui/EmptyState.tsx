import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  explanation?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  explanation,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[12px] border border-hairline border-dashed bg-surface-2/60 p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-[10px] bg-surface border border-hairline flex items-center justify-center text-muted mb-4 shadow-none">
          {icon}
        </div>
      )}

      <h4 className="text-[18px] font-semibold text-ink tracking-tight mb-2">
        {title}
      </h4>

      {explanation && (
        <p className="text-[14px] text-muted leading-relaxed max-w-sm mb-6">
          {explanation}
        </p>
      )}

      {actionText && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
