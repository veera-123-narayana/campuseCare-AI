import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DataSourceType } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatTime } from '../../utils/formatTime';

export interface TimelineStep {
  time: string;
  title: string;
  detail: string;
  status: 'normal' | 'attention' | 'review' | 'critical';
  source: DataSourceType;
  active?: boolean;
}

export interface RoomTimelineCardProps {
  steps?: TimelineStep[];
  className?: string;
}

export const defaultSteps: TimelineStep[] = [
  {
    time: '10:00:00',
    title: 'Class Expected (Timetable Window Start)',
    detail: 'Artificial Intelligence (AI-401, 60 expected) scheduled. Baseline ventilation & lighting circuits energized.',
    status: 'normal',
    source: 'SIMULATED',
  },
  {
    time: '10:05:00',
    title: 'Commencement Delay Flagged',
    detail: 'T + 5m threshold reached with 0 vision headcount. Operational status set to attention.',
    status: 'attention',
    source: 'SIMULATED',
  },
  {
    time: '10:10:00',
    title: 'Configured Grace Period Exceeded',
    detail: 'Configured 10-minute grace window expired without IR / motion sensor confirmation.',
    status: 'review',
    source: 'SIMULATED',
  },
  {
    time: '10:10:02',
    title: 'Review Raised (Awaiting Operator Action)',
    detail: 'Rule COMMENCEMENT_GRACE_EXCEEDED activated. Operational review ticket generated for Department Coordinator.',
    status: 'review',
    source: 'SIMULATED',
    active: true,
  },
];

const dotColors = {
  normal: 'bg-status-green ring-status-green-soft',
  attention: 'bg-status-yellow ring-status-yellow-soft',
  review: 'bg-status-orange ring-status-orange-soft',
  critical: 'bg-status-red ring-status-red-soft',
};

export const RoomTimelineCard: React.FC<RoomTimelineCardProps> = ({
  steps = defaultSteps,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <CardTitle className="text-[18px]">How We Got Here</CardTitle>
          </div>
          <span className="font-mono text-[12px] text-muted">Audit Trace</span>
        </div>
        <CardDescription>
          Chronological grace period progression and automated rule evaluation.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative pl-5 space-y-4 pt-1">
          {/* Vertical hairline track */}
          <div className="absolute left-[9px] top-2.5 bottom-2 w-px bg-hairline" />

          {steps.map((step, idx) => {
            const dot = dotColors[step.status] || dotColors.normal;

            return (
              <div key={idx} className="relative group">
                {/* Node dot */}
                <div
                  className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${dot} ${
                    step.active ? 'scale-125' : ''
                  }`}
                />

                <div
                  className={`p-3 rounded-[8px] border transition-colors ${
                    step.active
                      ? 'bg-surface-2 border-status-orange/40 ring-1 ring-status-orange/20'
                      : 'bg-surface border-hairline hover:bg-surface-2'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[12px] font-bold text-ink">
                      {step.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <SourceBadge source={step.source} size="sm" />
                      <span className="font-mono text-[11px] text-muted tabular-nums">
                        {formatTime(step.time)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[13px] text-muted leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
