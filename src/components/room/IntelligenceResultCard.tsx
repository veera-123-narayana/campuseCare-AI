import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { PriorityLevel, DataSourceType } from '../../types';
import { PriorityPill } from '../ui/PriorityPill';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export interface DecisionState {
  stateKey: 'review' | 'started_late' | 'normal' | 'unexpected' | 'no_class' | 'offline';
  eventName: string;
  priority: PriorityLevel;
  ruleTag: string;
  confidence: number;
  explanation: string;
  recommendedAction: string;
  expectedSubject: string;
  expectedCount: number;
  expectedTime: string;
  observedCount: number;
  observedMotion: string;
  observedPower: number;
  observedTemp: number;
}

interface IntelligenceResultCardProps {
  decision: DecisionState;
  onVerifySchedule?: () => void;
  className?: string;
}

export const IntelligenceResultCard: React.FC<IntelligenceResultCardProps> = ({
  decision,
  onVerifySchedule,
  className = '',
}) => {
  const isReview = decision.priority === 'ORANGE';
  const isCritical = decision.priority === 'RED';
  const isNormal = decision.priority === 'GREEN';

  const borderAccent =
    decision.priority === 'RED'
      ? 'border-status-red'
      : decision.priority === 'ORANGE'
      ? 'border-status-orange'
      : decision.priority === 'YELLOW'
      ? 'border-status-yellow'
      : 'border-status-green';

  return (
    <Card className={`border-2 ${borderAccent} transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3 border-b border-hairline">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[12px] font-mono uppercase tracking-wider text-muted font-semibold">
              Campus Intelligence Decision
            </span>
            <span className="px-2 py-0.5 rounded-[4px] bg-surface-2 border border-hairline font-mono text-[11px] text-ink font-semibold">
              {decision.ruleTag}
            </span>
          </div>

          {/* Vision confidence shown strictly separately from the decision */}
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-[6px] bg-surface-2 border border-hairline flex items-center gap-1.5 text-[12px] font-mono">
              <span className="text-muted">Vision Confidence:</span>
              <span className="text-ink font-bold tabular-nums">
                {decision.confidence}%
              </span>
              <SourceBadge source="LIVE" size="sm" />
            </div>
            <PriorityPill priority={decision.priority} size="md" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* Event Title in Large Type */}
        <div className="space-y-1">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink flex items-center gap-2.5">
            {isCritical && <ShieldAlert className="w-6 h-6 text-status-red" />}
            {isReview && <AlertTriangle className="w-6 h-6 text-status-orange" />}
            {isNormal && <CheckCircle2 className="w-6 h-6 text-status-green" />}
            <span>{decision.eventName}</span>
          </h2>
          <p className="text-[15px] text-muted leading-relaxed max-w-3xl">
            {decision.explanation}
          </p>
        </div>

        {/* Recommended Action Box */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-muted block mb-0.5">
              Recommended Operator Action
            </span>
            <p className="text-ink font-medium">
              {decision.recommendedAction}
            </p>
          </div>

          {onVerifySchedule && (
            <button
              type="button"
              onClick={onVerifySchedule}
              className="px-3 py-1.5 rounded-[6px] bg-surface border border-hairline hover:border-muted/50 text-[12px] font-mono text-accent hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Audit Coordinator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expected vs Observed 2-Column Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-muted tracking-wider">
            <span>Discrepancy Synthesis Matrix</span>
            <span>Real-time Ingest</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Expected State */}
            <div className="p-4 rounded-[8px] bg-surface-2 border border-hairline space-y-2 text-[13px]">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                  Expected State (Timetable)
                </span>
                <SourceBadge source="SIMULATED" size="sm" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted">Subject:</span>
                  <span className="font-semibold text-ink">{decision.expectedSubject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Expected Count:</span>
                  <span className="font-mono text-ink font-semibold">
                    {decision.expectedCount} students
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Time Window:</span>
                  <span className="font-mono text-ink">{decision.expectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Grace Threshold:</span>
                  <span className="font-mono text-ink">10 minutes (Configured)</span>
                </div>
              </div>
            </div>

            {/* Column 2: Observed State */}
            <div className="p-4 rounded-[8px] bg-surface-2 border border-hairline space-y-2 text-[13px]">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                  Observed State (Hardware Sensors)
                </span>
                <SourceBadge source="PI" size="sm" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted">Vision Headcount:</span>
                  <span
                    className={`font-mono font-bold ${
                      decision.expectedCount > 0 && decision.observedCount === 0
                        ? 'text-status-orange'
                        : 'text-ink'
                    }`}
                  >
                    {decision.observedCount} people detected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Dual PIR Motion:</span>
                  <span className="font-mono text-ink">{decision.observedMotion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Active Circuit Load:</span>
                  <span className="font-mono text-ink font-semibold">
                    {decision.observedPower.toFixed(2)} kW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Ambient Temp:</span>
                  <span className="font-mono text-ink">{decision.observedTemp.toFixed(1)} °C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
