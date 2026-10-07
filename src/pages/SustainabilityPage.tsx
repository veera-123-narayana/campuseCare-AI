import React from 'react';
import {
  Leaf,
  Zap,
  TrendingDown,
  Building,
  Clock,
  ShieldCheck,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { MetricTile } from '../components/ui/MetricTile';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface SustainabilityPageProps {
  onNavigate: (path: string) => void;
}

export const SustainabilityPage: React.FC<SustainabilityPageProps> = ({ onNavigate }) => {
  const { energySummary, rooms, loading } = useCampus();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={280} height={28} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="rect" height={130} />
          <Skeleton variant="rect" height={130} />
          <Skeleton variant="rect" height={130} />
          <Skeleton variant="rect" height={130} />
        </div>
      </div>
    );
  }

  if (!energySummary) {
    return (
      <EmptyState
        icon={<Leaf className="w-6 h-6 text-accent" />}
        title="No Sustainability Telemetry Loaded"
        explanation="Energy sub-station readings currently unavailable."
        actionText="Poll Sub-Meters"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              UN SDG 11: Sustainable Cities & Communities
            </span>
            <SourceBadge source={energySummary.source} size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Campus Energy Conservation Metrics
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Targeting Target 11.6: Substantial reduction in institutional energy waste through automated schedule reconciliation.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<Zap className="w-4 h-4 text-accent" />}
          onClick={() => onNavigate('/demo')}
        >
          Simulate Setback Routine
        </Button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Total Instant Load"
          value={energySummary.totalKw.toFixed(1)}
          unit="kW"
          delta={{ value: 'Baseline: 28.5 kW', trend: 'down', isPositive: true }}
          source="LIVE"
          subtext="Main substation bus"
        />
        <MetricTile
          label="Unoccupied Waste Draw"
          value={energySummary.unoccupiedWasteKw.toFixed(1)}
          unit="kW"
          delta={{ value: 'Room 204 & 102 idle', trend: 'up', isPositive: false }}
          source="PI"
          subtext="Vacant rooms with circuits on"
        />
        <MetricTile
          label="Estimated Daily Waste"
          value={energySummary.estimatedWasteKwh.toFixed(1)}
          unit="kWh"
          delta={{ value: 'Daily Goal: <40 kWh', trend: 'down', isPositive: true }}
          source="SIMULATED"
          subtext="Schedule delta heuristic"
        />
        <MetricTile
          label="Estimated Carbon Avoided"
          value={energySummary.co2KgSaved.toFixed(1)}
          unit="kg CO₂"
          delta={{ value: '+12.4 kg today', trend: 'up', isPositive: true }}
          source="SIMULATED"
          subtext="Grid emission factor: 0.82"
        />
      </div>

      {/* 2-Column: Facility Blocks Breakdown & Setback Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Block Comparison */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Block Consumption Breakdown</CardTitle>
              <SourceBadge source="LIVE" size="sm" />
            </div>
            <CardDescription>
              Comparing active power draw between academic wings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold text-ink">CSE Academic Block</span>
                  <span className="font-mono text-ink">13.5 kW (5 spaces)</span>
                </div>
                <div className="w-full bg-hairline h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full w-[65%]" />
                </div>
                <span className="text-[11px] font-mono text-muted block">
                  Includes Room 204 unconfirmed draw (3.4 kW)
                </span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold text-ink">Main Academic Block</span>
                  <span className="font-mono text-ink">4.3 kW (3 spaces)</span>
                </div>
                <div className="w-full bg-hairline h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full w-[35%]" />
                </div>
                <span className="text-[11px] font-mono text-muted block">
                  Room 101 in setback mode (0.1 kW)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setback Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>Automated Setback Policy Framework</CardTitle>
            <CardDescription>
              Algorithmic logic preventing institutional energy waste without disrupting lectures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted font-semibold">
                Phase 1: Scheduled Lecture Start (T + 0m)
              </span>
              <p className="text-muted leading-relaxed">
                Timetable activates baseline lighting & climate conditioning.
              </p>
            </div>

            <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[11px] font-mono uppercase text-status-yellow font-semibold">
                Phase 2: Grace Window Inactivity (T + 15m)
              </span>
              <p className="text-muted leading-relaxed">
                If headcount remains 0 and dual PIR sensors register no movement, priority escalates to ORANGE (Review Required).
              </p>
            </div>

            <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[11px] font-mono uppercase text-accent font-semibold">
                Phase 3: Setback Engagement (T + 25m)
              </span>
              <p className="text-muted leading-relaxed">
                HVAC temperature shifts 3°C to setback mode; auxiliary high-bay lighting drops, preserving 85% circuit load.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
