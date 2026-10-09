import React from 'react';
import { BellRing, ArrowRight, Check, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Alert } from '../../types';
import { PriorityPill } from '../ui/PriorityPill';
import { SourceBadge } from '../ui/SourceBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatTime } from '../../utils/formatTime';

interface NeedsAttentionCardProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onSelectAlert: (roomId: string) => void;
  onViewAll: () => void;
  className?: string;
}

// Priority rank order: RED (1) -> ORANGE (2) -> YELLOW (3) -> GREEN (4)
const priorityRank: Record<string, number> = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
};

// Relative time formatting helper
const getRelativeTime = (timestamp: string, index: number) => {
  const minutes = [4, 14, 28, 42, 58][index] || 15;
  return `${minutes} min ago`;
};

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  alerts,
  onAcknowledge,
  onSelectAlert,
  onViewAll,
  className = '',
}) => {
  // Sort by priority and take top 5
  const sortedAlerts = [...alerts]
    .sort((a, b) => (priorityRank[a.priority] || 5) - (priorityRank[b.priority] || 5))
    .slice(0, 5);

  const priorityBorderColors: Record<string, string> = {
    GREEN: 'border-l-status-green',
    YELLOW: 'border-l-status-yellow',
    ORANGE: 'border-l-status-orange',
    RED: 'border-l-status-red',
  };

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-orange animate-pulse" />
              <CardTitle className="text-[20px]">Needs Attention</CardTitle>
            </div>
            <span className="font-mono text-[12px] text-muted">
              {sortedAlerts.length} high-priority
            </span>
          </div>
          <CardDescription>
            Active discrepancies ranked by operational priority tier.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {sortedAlerts.length === 0 ? (
            <div className="p-6 text-center text-muted italic text-[13px]">
              All campus rooms conforming to scheduled expectations.
            </div>
          ) : (
            sortedAlerts.map((alert, idx) => {
              const isAcknowledged = alert.status === 'ACKNOWLEDGED';
              const borderAccent = priorityBorderColors[alert.priority] || 'border-l-hairline';

              return (
                <div
                  key={alert.id}
                  className={`rounded-[8px] border border-hairline border-l-4 ${borderAccent} bg-surface-2 p-3.5 flex flex-col gap-2 transition-all hover:border-muted/50 ${
                    isAcknowledged ? 'opacity-65' : ''
                  }`}
                >
                  {/* Top Bar: Room, Priority, Relative time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectAlert(alert.roomId)}
                        className="font-mono text-[13px] font-bold text-ink hover:text-accent hover:underline cursor-pointer truncate"
                      >
                        {alert.roomName}
                      </button>
                      <SourceBadge source={alert.source} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriorityPill priority={alert.priority} size="sm" />
                      <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Non-accusatory title */}
                  <p className="text-[13px] font-medium text-ink leading-snug line-clamp-2">
                    {alert.title}
                  </p>

                  {/* Observed Delta */}
                  <div className="font-mono text-[11px] text-muted bg-surface/70 px-2 py-1 rounded border border-hairline flex items-center justify-between">
                    <span className="truncate max-w-[70%]">
                      {alert.observedState}
                    </span>
                    {alert.energyImpactKw > 0 && (
                      <span className="text-status-orange font-semibold shrink-0">
                        +{alert.energyImpactKw.toFixed(1)} kW
                      </span>
                    )}
                  </div>

                  {/* Action footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-hairline/60">
                    <button
                      type="button"
                      onClick={() => onSelectAlert(alert.roomId)}
                      className="text-[11px] font-mono text-accent hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Examine telemetry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <Button
                      variant={isAcknowledged ? 'ghost' : 'secondary'}
                      size="sm"
                      disabled={isAcknowledged}
                      onClick={() => onAcknowledge(alert.id)}
                      className="h-6 px-2 text-[11px]"
                      leftIcon={<Check className="w-3 h-3" />}
                    >
                      {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </div>

      {/* View All Footer */}
      <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px] font-mono">
        <span className="text-muted">Total queue: {alerts.length}</span>
        <button
          type="button"
          onClick={onViewAll}
          className="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>View all alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
