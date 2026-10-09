import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { DataSourceType } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface OccupancyPoint {
  hour: string;
  expected: number;
  observed: number;
  inClassWindow: boolean;
}

interface Occupancy24hChartProps {
  currentObserved: number;
  source?: DataSourceType;
  className?: string;
}

export const Occupancy24hChart: React.FC<Occupancy24hChartProps> = ({
  currentObserved = 0,
  source = 'SIMULATED',
  className = '',
}) => {
  // Generate 24 hours of telemetry curve
  const data: OccupancyPoint[] = [
    { hour: '00:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '02:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '04:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '06:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '07:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '08:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '08:30', expected: 52, observed: 49, inClassWindow: false },
    { hour: '09:00', expected: 52, observed: 50, inClassWindow: false },
    { hour: '09:30', expected: 0, observed: 3, inClassWindow: false },
    // 10:00 - 11:00 scheduled AI class (the shaded class window!)
    { hour: '10:00', expected: 60, observed: currentObserved, inClassWindow: true },
    { hour: '10:30', expected: 60, observed: currentObserved, inClassWindow: true },
    { hour: '11:00', expected: 60, observed: currentObserved, inClassWindow: true },
    { hour: '11:30', expected: 0, observed: 0, inClassWindow: false },
    { hour: '12:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '13:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '14:00', expected: 40, observed: 36, inClassWindow: false },
    { hour: '15:00', expected: 40, observed: 38, inClassWindow: false },
    { hour: '16:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '17:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '18:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '20:00', expected: 0, observed: 0, inClassWindow: false },
    { hour: '22:00', expected: 0, observed: 0, inClassWindow: false },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                Temporal Analysis
              </span>
              <SourceBadge source={source} size="sm" />
            </div>
            <CardTitle className="text-[18px]">
              24-Hour Room Occupancy Profile
            </CardTitle>
          </div>

          <div className="flex items-center gap-4 text-[12px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-ink font-semibold">Observed Vision Headcount</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 border-t-2 border-dashed border-muted" />
              <span className="text-muted">Expected Timetable Count</span>
            </div>
          </div>
        </div>
        <CardDescription>
          Shaded band indicates currently scheduled lecture block (10:00 - 11:00) with occupancy delta clearly visible at a glance.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full select-none pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                horizontal={true}
                stroke="var(--hairline)"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="hour"
                axisLine={{ stroke: 'var(--hairline)' }}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                unit=" seats"
                domain={[0, 70]}
              />

              {/* Shaded Band for the scheduled Artificial Intelligence class */}
              <ReferenceArea
                x1="10:00"
                x2="11:00"
                fill="var(--status-orange)"
                fillOpacity={0.12}
                stroke="var(--status-orange)"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: 'Scheduled Lecture (10:00 - 11:00)',
                  position: 'insideTop',
                  fill: 'var(--status-orange)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as OccupancyPoint;
                    return (
                      <div className="p-3 bg-surface border border-hairline rounded-[8px] [box-shadow:var(--shadow-popover)] text-ink text-[12px] font-mono space-y-1">
                        <div className="flex items-center justify-between gap-4 font-semibold text-[13px] border-b border-hairline pb-1">
                          <span>{pt.hour}</span>
                          {pt.inClassWindow ? (
                            <span className="text-[10px] text-status-orange bg-status-orange-soft px-1.5 py-0.5 rounded border border-status-orange/30">
                              ACTIVE SLOT
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted">Recess</span>
                          )}
                        </div>
                        <div className="flex justify-between text-accent pt-0.5">
                          <span>Observed Count:</span>
                          <span className="font-bold">{pt.observed} people</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Scheduled Count:</span>
                          <span>{pt.expected} seats</span>
                        </div>
                        {pt.inClassWindow && pt.expected > 0 && pt.observed === 0 && (
                          <div className="text-status-orange text-[11px] pt-1 border-t border-hairline font-semibold">
                            Δ 60 seats unconfirmed
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Expected baseline area */}
              <Area
                type="stepAfter"
                dataKey="expected"
                stroke="var(--muted)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />

              {/* Observed headcount area */}
              <Area
                type="monotone"
                dataKey="observed"
                stroke="var(--accent)"
                strokeWidth={2.2}
                fill="url(#observedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
