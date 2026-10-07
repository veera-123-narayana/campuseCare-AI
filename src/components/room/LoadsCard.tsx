import React from 'react';
import { Zap, Lightbulb, Fan, Info } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface LoadsCardProps {
  lightsOn: boolean;
  onLightsChange: (on: boolean) => void;
  fanOn: boolean;
  onFanChange: (on: boolean) => void;
  className?: string;
}

export const LoadsCard: React.FC<LoadsCardProps> = ({
  lightsOn,
  onLightsChange,
  fanOn,
  onFanChange,
  className = '',
}) => {
  const lightsKw = lightsOn ? 0.45 : 0.0;
  const fanKw = fanOn ? 0.37 : 0.0;
  const totalKw = lightsKw + fanKw;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted" />
            <CardTitle className="text-[18px]">Relay Load Controls</CardTitle>
          </div>
          <SourceBadge source="PI" size="sm" />
        </div>
        <CardDescription>
          Digital relay state indicators and simulated manual override switches.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lights Switch */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-[6px] border flex items-center justify-center ${
                lightsOn
                  ? 'bg-status-yellow-soft border-status-yellow/30 text-status-yellow'
                  : 'bg-surface border-hairline text-muted'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-ink text-[13px] block leading-tight">
                High-Bay Lighting Relays
              </span>
              <span className="font-mono text-[11px] text-muted block mt-0.5">
                Circuit A-2 · {lightsKw.toFixed(2)} kW active
              </span>
            </div>
          </div>

          <Switch checked={lightsOn} onChange={onLightsChange} />
        </div>

        {/* Fan / Ventilation Switch */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-[6px] border flex items-center justify-center ${
                fanOn
                  ? 'bg-accent-soft border-accent/30 text-accent'
                  : 'bg-surface border-hairline text-muted'
              }`}
            >
              <Fan className={`w-4 h-4 ${fanOn ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <span className="font-semibold text-ink text-[13px] block leading-tight">
                HVAC Fan Coil Ventilation
              </span>
              <span className="font-mono text-[11px] text-muted block mt-0.5">
                FCU Zone 4 · {fanKw.toFixed(2)} kW active
              </span>
            </div>
          </div>

          <Switch checked={fanOn} onChange={onFanChange} />
        </div>

        {/* Total Draw & Low-voltage Note */}
        <div className="pt-2 border-t border-hairline flex items-center justify-between text-[12px] font-mono">
          <span className="text-muted">Total Relay Load:</span>
          <span className="text-ink font-bold tabular-nums">
            {totalKw.toFixed(2)} kW
          </span>
        </div>

        <div className="p-2.5 rounded-[6px] bg-surface border border-hairline/80 flex items-start gap-2 text-[11px] text-muted leading-relaxed">
          <Info className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
          <span>
            Note: Prototype loads are low-voltage only. High-voltage sub-meter relays require physical contactor actuation.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
