import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { EnergyHourlyPoint } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface EnergyAreaChartProps {
  data: EnergyHourlyPoint[];
  timeframe: 'Today' | 'Week';
  className?: string;
}

export const EnergyAreaChart: React.FC<EnergyAreaChartProps> = ({
  data,
  timeframe,
  className = '',
}) => {
  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                  Facility Power Profile
                </span>
                <SourceBadge source="LIVE" size="sm" />
              </div>
              <CardTitle className="text-[20px]">
                {timeframe === 'Today' ? 'Energy Today' : 'Energy This Week'}
              </CardTitle>
            </div>

            <div className="flex items-center gap-4 text-[12px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-ink font-semibold">Actual Draw (kW)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 border-t-2 border-dashed border-muted" />
                <span className="text-muted">Expected Baseline</span>
              </div>
            </div>
          </div>
          <CardDescription>
            Substation sub-meter power curve vs timetable scheduled expectation. Faint horizontal grids only.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-64 w-full select-none pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Only faint horizontal gridlines, zero vertical gridlines */}
                <CartesianGrid
                  vertical={false}
                  horizontal={true}
                  stroke="var(--hairline)"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="time"
                  axisLine={{ stroke: 'var(--hairline)' }}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  unit=" kW"
                  domain={[0, 32]}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload as EnergyHourlyPoint;
                      return (
                        <div className="p-3 bg-surface border border-hairline rounded-[8px] [box-shadow:var(--shadow-popover)] text-ink text-[12px] font-mono space-y-1">
                          <div className="flex items-center justify-between gap-4 font-semibold text-[13px] border-b border-hairline pb-1">
                            <span>{point.time}</span>
                            <SourceBadge source={point.source} size="sm" />
                          </div>
                          <div className="flex justify-between text-accent pt-0.5">
                            <span>Actual Load:</span>
                            <span className="font-bold">{point.actualKw.toFixed(1)} kW</span>
                          </div>
                          <div className="flex justify-between text-muted">
                            <span>Scheduled Baseline:</span>
                            <span>{point.baselineKw.toFixed(1)} kW</span>
                          </div>
                          {point.unoccupiedWasteKw > 0 && (
                            <div className="flex justify-between text-status-orange pt-1 border-t border-hairline">
                              <span>Unoccupied Load:</span>
                              <span className="font-semibold">+{point.unoccupiedWasteKw.toFixed(1)} kW</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Baseline reference line */}
                <Area
                  type="monotone"
                  dataKey="baselineKw"
                  stroke="var(--muted)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                />

                {/* Single accent line area curve */}
                <Area
                  type="monotone"
                  dataKey="actualKw"
                  stroke="var(--accent)"
                  strokeWidth={2.2}
                  fill="url(#accentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>

      <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between text-[11px] font-mono text-muted">
        <span>Current instantaneous sub-station load: 17.8 kW</span>
        <span className="text-status-green font-semibold">
          Avoided carbon today: 48.7 kg CO₂
        </span>
      </div>
    </Card>
  );
};
