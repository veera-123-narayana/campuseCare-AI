import React from 'react';
import { Activity, Clock, ArrowRight } from 'lucide-react';
import { CampusEvent, PriorityLevel } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatTime } from '../../utils/formatTime';

interface LiveActivityFeedProps {
  events: CampusEvent[];
  onSelectEvent?: (roomId: string) => void;
  className?: string;
}

const statusDotColors: Record<PriorityLevel, string> = {
  GREEN: 'bg-status-green ring-status-green-soft',
  YELLOW: 'bg-status-yellow ring-status-yellow-soft',
  ORANGE: 'bg-status-orange ring-status-orange-soft',
  RED: 'bg-status-red ring-status-red-soft',
};

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  events,
  onSelectEvent,
  className = '',
}) => {
  const latest8 = events.slice(0, 8);

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <CardTitle className="text-[20px]">Live Activity</CardTitle>
            </div>
            <span className="font-mono text-[12px] text-muted">
              Last 8 hardware events
            </span>
          </div>
          <CardDescription>
            Chronological log of edge sensor heartbeats, setback actions, and grace transitions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="relative pl-4 space-y-4">
            {/* Vertical hairline track */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-hairline" />

            {latest8.map((evt) => {
              const dotClass = statusDotColors[evt.priority] || statusDotColors.GREEN;

              return (
                <div key={evt.id} className="relative group">
                  {/* Status dot */}
                  <div
                    className={`absolute -left-4 top-1.5 w-2 h-2 rounded-full ring-4 ${dotClass}`}
                  />

                  {/* Body */}
                  <div
                    onClick={() => onSelectEvent?.(evt.roomId)}
                    className="p-2.5 rounded-[6px] bg-surface-2 hover:bg-surface border border-hairline/80 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-semibold text-ink">
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SourceBadge
                          source={evt.source as any}
                          size="sm"
                        />
                        <span className="font-mono text-[11px] text-muted tabular-nums">
                          {formatTime(evt.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
                      {evt.explanation}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted">
                      <span>Target: {evt.roomId.replace('room-', '').toUpperCase()}</span>
                      <span className="text-accent group-hover:underline">View telemetry →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>

      <div className="pt-3 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-muted">
        <span>Hardware telemetry stream stable</span>
        <span>48 heartbeats/sec</span>
      </div>
    </Card>
  );
};
