import React from 'react';
import { TimelineEvent } from '../../types';
import { SourceBadge } from './SourceBadge';

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusDotColors = {
  normal: 'bg-status-green ring-status-green-soft',
  attention: 'bg-status-yellow ring-status-yellow-soft',
  review: 'bg-status-orange ring-status-orange-soft',
  critical: 'bg-status-red ring-status-red-soft',
  inactive: 'bg-status-gray ring-status-gray-soft',
};

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Continuous vertical hairline track */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-hairline" />

      {events.map((event) => {
        const dotClass = statusDotColors[event.status] || statusDotColors.normal;

        return (
          <div key={event.id} className="relative group">
            {/* Timeline node dot */}
            <div
              className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${dotClass} transition-transform group-hover:scale-110`}
            />

            {/* Event body */}
            <div className="flex flex-col gap-1 bg-surface rounded-[8px] p-3.5 border border-hairline/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-ink">
                  {event.title}
                </span>
                <div className="flex items-center gap-2">
                  <SourceBadge source={event.source} size="sm" />
                  <span className="font-mono text-[11px] text-muted tabular-nums">
                    {event.timestamp}
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-muted leading-relaxed">
                {event.detail}
              </p>

              {event.actor && (
                <div className="pt-1.5 mt-1 border-t border-hairline/50 text-[11px] font-mono text-muted flex items-center justify-between">
                  <span>Source Agent: {event.actor}</span>
                  <span className="uppercase text-[10px] text-muted tracking-wider">
                    {event.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
