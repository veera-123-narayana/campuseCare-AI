import React, { useState, useEffect } from 'react';
import { useCampus } from '../context/CampusContext';
import { api } from '../services/api';
import { EnergyHourlyPoint, FloorRoomNode } from '../types';

import { MetricTile } from '../components/ui/MetricTile';
import { SourceBadge } from '../components/ui/SourceBadge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumberCountUp } from '../components/ui/NumberCountUp';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

import { FloorPlanCard } from '../components/dashboard/FloorPlanCard';
import { NeedsAttentionCard } from '../components/dashboard/NeedsAttentionCard';
import { EnergyAreaChart } from '../components/dashboard/EnergyAreaChart';
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const {
    rooms,
    alerts,
    events,
    loading: contextLoading,
    dataMode,
    acknowledgeAlert,
  } = useCampus();

  const [timeframe, setTimeframe] = useState<'Today' | 'Week'>('Today');
  const [energyData, setEnergyData] = useState<EnergyHourlyPoint[]>([]);
  const [floorNodes, setFloorNodes] = useState<FloorRoomNode[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(true);

  // Live time ticker formatted in mono
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toTimeString().split(' ')[0];
      setCurrentTimeStr(`${dateStr} · ${timeStr} UTC-7`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch hourly energy and floor plan nodes
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLocalLoading(true);
        const [energyRes, nodesRes] = await Promise.all([
          api.getHourlyEnergy(timeframe),
          api.getFloorPlanNodes(),
        ]);
        setEnergyData(energyRes);
        setFloorNodes(nodesRes);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLocalLoading(false);
      }
    }
    loadDashboardData();
  }, [timeframe]);

  const isLoading = contextLoading || localLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <div className="space-y-2">
            <Skeleton variant="text" width={220} height={32} />
            <Skeleton variant="text" width={320} height={16} />
          </div>
          <Skeleton variant="rect" width={180} height={36} />
        </div>

        {/* 4 Metric Tiles Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="rect" height={136} />
          <Skeleton variant="rect" height={136} />
          <Skeleton variant="rect" height={136} />
          <Skeleton variant="rect" height={136} />
        </div>

        {/* Middle 12-col Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton variant="rect" height={420} className="lg:col-span-8" />
          <Skeleton variant="rect" height={420} className="lg:col-span-4" />
        </div>

        {/* Bottom Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton variant="rect" height={360} className="lg:col-span-7" />
          <Skeleton variant="rect" height={360} className="lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={<span className="font-mono text-xl">0</span>}
        title="No Telemetry Data Received"
        explanation="Campus sub-stations and edge Raspberry Pi nodes report no active telemetry."
        actionText="Refresh Connection"
        onAction={() => window.location.reload()}
      />
    );
  }

  // Calculate high-level summary metrics
  const roomsNeedingReviewCount = rooms.filter((r) => r.priority === 'ORANGE').length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const energyWasteFlagsCount = rooms.filter(
    (r) => r.expectedOccupancy === 0 && r.energyKw > 1.0
  ).length;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
            Campus overview
          </h1>
          <p className="font-mono text-[13px] text-muted tabular-nums">
            {currentTimeStr || 'Wednesday, 07 Oct 2026 · 10:18:22 UTC-7'}
          </p>
        </div>

        {/* Right side controls: SegmentedControl Today / Week and SourceBadge */}
        <div className="flex items-center gap-3">
          <SegmentedControl
            value={timeframe}
            onChange={(val) => setTimeframe(val as 'Today' | 'Week')}
            options={[
              { value: 'Today', label: 'Today' },
              { value: 'Week', label: 'Week' },
            ]}
            size="sm"
          />

          <SourceBadge
            source={dataMode === 'PI CONNECTED' ? 'PI' : 'SIMULATED'}
            size="md"
          />
        </div>
      </div>

      {/* 2. Row of 4 MetricTiles (Rooms needing review is visually dominant) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dominant Tile: Rooms needing review */}
        <div className="transition-all duration-150 delay-0">
          <MetricTile
            label="Rooms needing review"
            dominant={true}
            value={<NumberCountUp target={roomsNeedingReviewCount} durationMs={200} />}
            delta={{ value: '+1 vs yesterday', trend: 'up', isPositive: false }}
            source="LIVE"
            subtext="LH-204 grace window expired"
            onClick={() => onNavigate('/rooms/room-204')}
          />
        </div>

        {/* Active alerts */}
        <div className="transition-all duration-150 delay-75">
          <MetricTile
            label="Active alerts"
            value={<NumberCountUp target={activeAlertsCount} durationMs={220} />}
            delta={{ value: '-2 vs yesterday', trend: 'down', isPositive: true }}
            source="LIVE"
            subtext="1 critical · 1 review · 1 attention"
            onClick={() => onNavigate('/alerts')}
          />
        </div>

        {/* Energy-waste flags */}
        <div className="transition-all duration-150 delay-100">
          <MetricTile
            label="Energy-waste flags"
            value={<NumberCountUp target={energyWasteFlagsCount} durationMs={240} />}
            delta={{ value: '+1 vs yesterday', trend: 'up', isPositive: false }}
            source="PI"
            subtext="5.2 kW unconfirmed draw"
            onClick={() => onNavigate('/sustainability')}
          />
        </div>

        {/* Devices online */}
        <div className="transition-all duration-150 delay-150">
          <MetricTile
            label="Devices online"
            value={
              <span>
                <NumberCountUp target={128} durationMs={220} />
                <span className="text-[20px] text-muted font-normal"> of 132</span>
              </span>
            }
            delta={{ value: '97.0% connected', trend: 'neutral', isPositive: true }}
            source="PI"
            subtext="Edge Pi cameras & PIR nodes"
          />
        </div>
      </div>

      {/* 3 & 4. Middle Row: 12-col Grid (Left 8 cols Floor Status, Right 4 cols Needs Attention) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 8 cols Floor Status (Inline SVG Floor Plan) */}
        <div className="lg:col-span-8 transition-all duration-200 delay-150">
          <FloorPlanCard
            nodes={floorNodes}
            onSelectRoom={(roomId) => onNavigate(`/rooms/${roomId}`)}
          />
        </div>

        {/* Right: 4 cols Needs Attention (Compact Top 5 Alerts) */}
        <div className="lg:col-span-4 transition-all duration-200 delay-200">
          <NeedsAttentionCard
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onSelectAlert={(roomId) => onNavigate(`/rooms/${roomId}`)}
            onViewAll={() => onNavigate('/alerts')}
          />
        </div>
      </div>

      {/* 5. Bottom Row: Energy Today Chart (7 cols) + Live Activity Feed (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Energy Today Chart: 7 cols */}
        <div className="lg:col-span-7 transition-all duration-200 delay-200">
          <EnergyAreaChart
            data={energyData}
            timeframe={timeframe}
          />
        </div>

        {/* Live Activity Feed: 5 cols */}
        <div className="lg:col-span-5 transition-all duration-200 delay-200">
          <LiveActivityFeed
            events={events}
            onSelectEvent={(roomId) => onNavigate(`/rooms/${roomId}`)}
          />
        </div>
      </div>
    </div>
  );
};
