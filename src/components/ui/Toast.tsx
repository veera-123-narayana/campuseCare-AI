import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onDismiss,
  actionText,
  onAction,
  className = '',
}) => {
  const icons = {
    info: <Info className="w-4 h-4 text-accent shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-status-yellow shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-status-red shrink-0" />,
  };

  return (
    <div
      role="status"
      className={`rounded-[12px] border border-hairline bg-surface p-4 text-ink flex items-start gap-3 max-w-md [box-shadow:var(--shadow-popover)] transition-all ${className}`}
    >
      <div className="mt-0.5">{icons[type]}</div>

      <div className="flex-1 min-w-0">
        <h5 className="text-[14px] font-semibold text-ink leading-tight">
          {title}
        </h5>
        {message && (
          <p className="text-[13px] text-muted mt-1 leading-normal">
            {message}
          </p>
        )}
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 text-[12px] font-mono font-medium text-accent hover:underline cursor-pointer"
          >
            {actionText} →
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted hover:text-ink p-1 rounded-[6px] hover:bg-surface-2 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
