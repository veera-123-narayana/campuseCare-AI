import React from 'react';
import { Activity, Sun, Thermometer, Droplets, Zap, DoorClosed, Wind } from 'lucide-react';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface SensorsCardProps {
  motionActive: boolean;
  temperature: number;
  lightLux: number;
  humidity: number;
  className?: string;
}

// Sparkline SVG renderer
const Sparkline: React.FC<{ points: number[]; color?: string }> = ({
  points,
  color = 'var(--accent)',
}) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const height = 18;
  const width = 48;

  const pathD = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SensorsCard: React.FC<SensorsCardProps> = ({
  motionActive = false,
  temperature = 28.4,
  lightLux = 540,
  humidity = 48.2,
  className = '',
}) => {
  const sensorList = [
    {
      id: 'pir',
      name: 'IR / motion sensor',
      icon: <Activity className="w-4 h-4 text-muted" />,
      value: motionActive ? 'Active (4 trg/m)' : 'Idle (0 triggers)',
      valueColor: motionActive ? 'text-status-green' : 'text-muted',
      sparkPoints: motionActive ? [0, 2, 4, 3, 5, 4] : [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: true,
    },
    {
      id: 'arduino',
      name: 'Arduino Uno',
      icon: <Zap className="w-4 h-4 text-muted" />,
      value: '--',
      valueColor: 'text-muted font-mono',
      sparkPoints: [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: true,
      statusLabel: 'Not connected',
    },
    {
      id: 'esp8266',
      name: 'ESP8266',
      icon: <Activity className="w-4 h-4 text-muted" />,
      value: '--',
      valueColor: 'text-muted font-mono',
      sparkPoints: [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: true,
      statusLabel: 'Not connected',
    },
    {
      id: 'lux',
      name: 'Ambient Light Level',
      icon: <Sun className="w-4 h-4 text-muted" />,
      value: lightLux != null ? `${lightLux} Lux` : '--',
      valueColor: lightLux != null && lightLux > 300 ? 'text-ink' : 'text-muted',
      sparkPoints: [480, 510, 530, 540, 540, lightLux ?? 0],
      source: 'SIMULATED' as const,
      installed: true,
    },
    {
      id: 'temp',
      name: 'Temperature',
      icon: <Thermometer className="w-4 h-4 text-muted" />,
      value: temperature != null ? `${temperature.toFixed(1)} °C` : '--',
      valueColor: 'text-ink',
      sparkPoints: [27.8, 28.0, 28.2, 28.3, 28.4, temperature ?? 0],
      source: 'SIMULATED' as const,
      installed: true,
    },
    {
      id: 'hum',
      name: 'Relative Humidity',
      icon: <Droplets className="w-4 h-4 text-muted" />,
      value: humidity != null ? `${humidity.toFixed(1)} %RH` : '--',
      valueColor: 'text-ink',
      sparkPoints: [49.0, 48.8, 48.5, 48.4, 48.2, humidity ?? 0],
      source: 'SIMULATED' as const,
      installed: true,
    },
    {
      id: 'ct-clamp',
      name: 'CT power clamp',
      icon: <Zap className="w-4 h-4 text-muted" />,
      value: '--',
      valueColor: 'text-muted font-mono',
      sparkPoints: [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: false,
    },
    {
      id: 'door',
      name: 'Door contact',
      icon: <DoorClosed className="w-4 h-4 text-muted" />,
      value: '--',
      valueColor: 'text-muted font-mono',
      sparkPoints: [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: false,
    },
    {
      id: 'iaq',
      name: 'Air quality',
      icon: <Wind className="w-4 h-4 text-muted" />,
      value: '--',
      valueColor: 'text-muted font-mono',
      sparkPoints: [0, 0, 0, 0, 0, 0],
      source: 'SIMULATED' as const,
      installed: false,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[18px]">Environmental Sensors</CardTitle>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted">Telemetry bus</span>
            <SourceBadge source="SIMULATED" size="sm" />
          </div>
        </div>
        <CardDescription>
          Hardware bus telemetry and uninstalled hardware simulated indicators.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {sensorList.map((s) => (
          <div
            key={s.id}
            className={`p-3 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3 text-[13px] ${
              !s.installed ? 'border-dashed opacity-85' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {s.icon}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink block leading-none truncate">
                    {s.name}
                  </span>
                  {(s as any).statusLabel ? (
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-muted shrink-0">
                      {(s as any).statusLabel}
                    </span>
                  ) : !s.installed ? (
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold uppercase bg-surface border border-hairline text-muted shrink-0">
                      Not installed
                    </span>
                  ) : null}
                </div>
                <span className={`font-mono text-[12px] font-semibold mt-1 block ${s.valueColor}`}>
                  {s.value}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {s.installed ? (
                <Sparkline points={s.sparkPoints} color="var(--accent)" />
              ) : (
                <span className="text-[11px] font-mono text-muted w-12 text-center">--</span>
              )}
              <SourceBadge source={s.source} size="sm" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
