import React from 'react';
import { Clock, ShieldAlert, Check } from 'lucide-react';
import { Alert } from '../../types';
import { PriorityPill } from './PriorityPill';
import { SourceBadge } from './SourceBadge';
import { Button } from './Button';
import { formatTime } from '../../utils/formatTime';

export interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  onInspect?: (id: string) => void;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onInspect,
  className = '',
}) => {
  const priorityBorderColors = {
    GREEN: 'border-l-status-green',
    YELLOW: 'border-l-status-yellow',
    ORANGE: 'border-l-status-orange',
    RED: 'border-l-status-red',
  };

  const isAcknowledged = alert.status === 'ACKNOWLEDGED' || !!alert.acknowledged;
  const roomLabel = alert.roomNumber || alert.roomName;
  const buildingLabel = alert.building || alert.block;
  const timeWindow = alert.timeWindow || alert.timestamp;

  return (
    <div
      className={`rounded-[12px] border border-hairline border-l-4 ${
        priorityBorderColors[alert.priority]
      } bg-surface p-6 flex flex-col gap-4 transition-colors ${
        isAcknowledged ? 'opacity-70' : ''
      } ${className}`}
    >
      {/* Top Header: Location, Priority, and Source */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[14px] font-semibold text-ink">
            {roomLabel}
          </span>
          <span className="text-[13px] text-muted">· {buildingLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <PriorityPill priority={alert.priority} size="sm" />
          <SourceBadge source={alert.source} size="sm" />
          <span className="font-mono text-[11px] text-muted tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted" />
            {formatTime(alert.timestamp)}
          </span>
        </div>
      </div>

      {/* Neutral, non-accusatory operational copy */}
      <div>
        <h4 className="text-[16px] font-semibold tracking-tight text-ink mb-1.5 flex items-center gap-2">
          {alert.priority === 'RED' && <ShieldAlert className="w-4 h-4 text-status-red" />}
          {alert.title}
        </h4>
        <p className="text-[14px] text-muted leading-relaxed">{alert.description}</p>
      </div>

      {/* Expected vs Observed Telemetry Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-[8px] bg-surface-2 border border-hairline text-[13px]">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted block mb-1">
            Expected State (Timetable)
          </span>
          <span className="font-mono text-[13px] text-ink font-medium">
            {alert.expectedState}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted block mb-1">
            Observed State (Hardware Sensors)
          </span>
          <span className="font-mono text-[13px] text-ink font-medium">
            {alert.observedState}
          </span>
        </div>
      </div>

      {/* Grace period & footer metrics */}
      <div className="flex flex-wrap items-center justify-between pt-1 gap-2 text-[12px] text-muted font-mono">
        <div className="flex items-center gap-4">
          <span>Window: {timeWindow}</span>
          <span>Grace: {alert.gracePeriodMinutes}m</span>
          {alert.energyImpactKw !== undefined && alert.energyImpactKw !== 0 && (
            <span
              className={
                alert.energyImpactKw > 0
                  ? 'text-status-orange font-semibold'
                  : 'text-status-green font-semibold'
              }
            >
              Impact: {alert.energyImpactKw > 0 ? `+${alert.energyImpactKw}` : alert.energyImpactKw} kW
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onInspect && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onInspect(alert.id)}
            >
              Telemetry Log
            </Button>
          )}
          {onAcknowledge && (
            <Button
              variant={isAcknowledged ? 'ghost' : 'secondary'}
              size="sm"
              disabled={isAcknowledged}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={() => onAcknowledge(alert.id)}
            >
              {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
