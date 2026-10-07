import React from 'react';
import { Activity, Sun, Thermometer, Droplets } from 'lucide-react';
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
      name: 'Dual PIR Motion',
      icon: <Activity className="w-4 h-4 text-muted" />,
      value: motionActive ? 'Active (4 trg/m)' : 'Idle (0 triggers)',
      valueColor: motionActive ? 'text-status-green' : 'text-muted',
      sparkPoints: motionActive ? [0, 2, 4, 3, 5, 4] : [0, 0, 0, 0, 0, 0],
      source: 'ESP32' as const,
    },
    {
      id: 'lux',
      name: 'Ambient Light Level',
      icon: <Sun className="w-4 h-4 text-muted" />,
      value: `${lightLux} Lux`,
      valueColor: lightLux > 300 ? 'text-ink' : 'text-muted',
      sparkPoints: [480, 510, 530, 540, 540, lightLux],
      source: 'PI' as const,
    },
    {
      id: 'temp',
      name: 'Temperature',
      icon: <Thermometer className="w-4 h-4 text-muted" />,
      value: `${temperature.toFixed(1)} °C`,
      valueColor: 'text-ink',
      sparkPoints: [27.8, 28.0, 28.2, 28.3, 28.4, temperature],
      source: 'ESP32' as const,
    },
    {
      id: 'hum',
      name: 'Relative Humidity',
      icon: <Droplets className="w-4 h-4 text-muted" />,
      value: `${humidity.toFixed(1)} %RH`,
      valueColor: 'text-ink',
      sparkPoints: [49.0, 48.8, 48.5, 48.4, 48.2, humidity],
      source: 'ESP32' as const,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[18px]">Environmental Sensors</CardTitle>
          <span className="font-mono text-[11px] text-muted">ESP32 + Pi I2C</span>
        </div>
        <CardDescription>
          Hardware bus telemetry streaming at 1Hz from Room 204 perimeter nodes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {sensorList.map((s) => (
          <div
            key={s.id}
            className="p-3 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3 text-[13px]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {s.icon}
              <div className="min-w-0">
                <span className="font-medium text-ink block leading-none truncate">
                  {s.name}
                </span>
                <span className={`font-mono text-[12px] font-semibold mt-1 block ${s.valueColor}`}>
                  {s.value}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Sparkline points={s.sparkPoints} />
              <SourceBadge source={s.source === 'ESP32' ? 'PI' : s.source} size="sm" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
