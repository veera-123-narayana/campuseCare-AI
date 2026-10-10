import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export const TypographySpecimen: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography System</CardTitle>
        <CardDescription>
          Inter Tight for UI text, JetBrains Mono with tabular numerals for IDs, telemetry readings, and metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 44 Hero Metric */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                44 Hero Metric · JetBrains Mono (tnum, zero)
              </span>
              <div className="text-[44px] font-mono font-medium tracking-tight text-ink tabular-nums leading-none">
                128.45 <span className="text-[18px] text-muted">kWh</span>
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Used for high-priority executive metrics and telemetry gauges.
            </span>
          </div>

          {/* 28 Page Title */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                28 Page Title · Inter Tight SemiBold
              </span>
              <div className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
                Campus Energy & Occupancy Operations
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Primary screen headers and section anchors.
            </span>
          </div>

          {/* 20 Title */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                20 Title · Inter Tight SemiBold
              </span>
              <div className="text-[20px] font-semibold tracking-tight text-ink">
                Engineering Block B · Floor Level 3 Grid
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Card titles and modal headers.
            </span>
          </div>

          {/* 16 Lead */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                16 Lead · Inter Tight Medium
              </span>
              <div className="text-[16px] text-ink leading-relaxed">
                Automated setback protocols verified across 42 lecture halls following timetable reconciliation.
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Introductory text and alert lead-ins.
            </span>
          </div>

          {/* 14 Body */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                14 Body · Inter Tight Regular
              </span>
              <div className="text-[14px] text-ink leading-normal max-w-2xl">
                Classroom activity not confirmed for LH-302. Camera node registers headcount 0 while lighting circuits remain energized at 2.4 kW.
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Default interface text, table cells, and narrative body.
            </span>
          </div>

          {/* 12 Label */}
          <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">
                12 Label · Inter Tight (Uppercase, 0.06em tracking, muted)
              </span>
              <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Observed Sensor Headcount · Grace Threshold Elapsed
              </div>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Field labels, table headers, and metric metadata.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
