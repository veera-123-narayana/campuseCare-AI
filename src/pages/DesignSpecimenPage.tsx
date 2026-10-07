import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Compass,
  Download,
  Filter,
  Flame,
  HelpCircle,
  Info,
  Maximize2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, DesignSpecimenData } from '../services/api';
import { RoomRecord, PriorityLevel, OperationalStatus, Alert, MetricItem } from '../types';

import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SourceBadge } from '../components/ui/SourceBadge';
import { PriorityPill } from '../components/ui/PriorityPill';
import { MetricTile } from '../components/ui/MetricTile';
import { DataTable, Column } from '../components/ui/DataTable';
import { AlertCard } from '../components/ui/AlertCard';
import { Timeline } from '../components/ui/Timeline';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Toast } from '../components/ui/Toast';
import { Switch } from '../components/ui/Switch';
import { Tabs } from '../components/ui/Tabs';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Tooltip } from '../components/ui/Tooltip';
import { ThemeToggle } from '../components/ui/ThemeToggle';

import { TokenSwatches } from '../components/design-system/TokenSwatches';
import { TypographySpecimen } from '../components/design-system/TypographySpecimen';
import { DoDontPanel } from '../components/design-system/DoDontPanel';

export const DesignSpecimenPage: React.FC = () => {
  const [data, setData] = useState<DesignSpecimenData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('components');
  const [segmentedView, setSegmentedView] = useState<'standard' | 'dense' | 'expanded'>('standard');
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [demoSwitch, setDemoSwitch] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<boolean>(true);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.getSpecimenData().then((res) => {
      setData(res);
    });
  }, []);

  const handleAcknowledgeAlert = async (id: string) => {
    await api.acknowledgeAlert(id);
    setAlertFeedback(`Alert [${id}] status updated to acknowledged.`);
    if (data) {
      setData({
        ...data,
        alerts: data.alerts.map((a: Alert) => (a.id === id ? { ...a, acknowledged: true } : a)),
      });
    }
  };

  const roomColumns: Column<RoomRecord>[] = [
    {
      key: 'roomCode',
      header: 'Space Code',
      mono: true,
      render: (r) => (
        <span className="font-semibold text-ink flex items-center gap-2">
          {r.roomCode}
          <span className="text-[11px] font-normal text-muted">({r.floor})</span>
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
    },
    {
      key: 'expectedOccupancy',
      header: 'Timetable Expected',
      mono: true,
      align: 'center',
      render: (r) => (
        <span className="text-[13px] font-mono">
          {r.expectedOccupancy > 0 ? `${r.expectedOccupancy} seats` : 'Unscheduled'}
        </span>
      ),
    },
    {
      key: 'observedOccupancy',
      header: 'Observed Headcount',
      mono: true,
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`font-mono font-medium ${
              r.expectedOccupancy > 0 && r.observedOccupancy === 0
                ? 'text-status-orange'
                : 'text-ink'
            }`}
          >
            {r.observedOccupancy}
          </span>
          <span className="text-muted text-[11px]">/ {r.capacity}</span>
        </div>
      ),
    },
    {
      key: 'hvacPowerKw',
      header: 'Circuit Load',
      mono: true,
      align: 'right',
      render: (r) => (
        <span className="font-mono text-ink">
          {r.hvacPowerKw.toFixed(1)} kW
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Discrepancy State',
      align: 'center',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'source',
      header: 'Source',
      align: 'right',
      render: (r) => <SourceBadge source={r.source} size="sm" />,
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Specimen Header */}
      <section className="border-b border-hairline bg-surface px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-[6px] bg-accent-soft text-accent text-[11px] font-mono uppercase tracking-wider font-semibold border border-accent/20">
                Design System · Specimen Spec
              </span>
              <SourceBadge source="LIVE" size="sm" />
              <span className="text-muted text-[12px] font-mono">UN SDG 11</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-ink">
              CAMPUSCARE Component & Token Specimen
            </h1>
            <p className="text-[14px] text-muted max-w-2xl leading-relaxed">
              Direction: "Control Room Editorial". Calm, premium, precise, like Linear and Stripe Dashboard.
              Zero glassmorphism, zero neon glow, single accent color, 1px hairline boundaries, and explicit data provenance attribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => {
                setAlertFeedback('Design tokens: CSS variables exported at /src/index.css');
              }}
            >
              Export Tokens
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-hairline bg-surface sticky top-0 z-20 px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs
            items={[
              { id: 'components', label: 'Component Catalog', count: 18 },
              { id: 'tokens', label: 'Tokens & Palette', count: 13 },
              { id: 'typography', label: 'Typography Scale', count: 6 },
              { id: 'guidelines', label: 'Do & Don’t Rules', count: 6 },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
        {/* TAB 1: ALL COMPONENTS SPECIMEN */}
        {activeTab === 'components' && (
          <div className="space-y-12">
            {/* Section 1: Buttons with all 5 mandatory states */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div>
                  <h3 className="text-[20px] font-semibold text-ink">
                    1. Buttons & Action Controls
                  </h3>
                  <p className="text-[13px] text-muted">
                    Primary, Secondary, Ghost, Danger across default, hover, focus-visible, disabled, and loading states.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isDemoLoading ? 'animate-spin' : ''}`} />}
                  onClick={() => setIsDemoLoading(!isDemoLoading)}
                >
                  Toggle Loading State
                </Button>
              </div>

              <Card>
                <CardContent className="space-y-6">
                  {/* Variant Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-hairline text-[11px] font-mono text-muted uppercase tracking-wider">
                          <th className="py-2.5">Variant</th>
                          <th className="py-2.5">Default</th>
                          <th className="py-2.5">With Icon</th>
                          <th className="py-2.5">Disabled</th>
                          <th className="py-2.5">Loading State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        <tr>
                          <td className="py-3 font-mono font-medium text-ink">Primary</td>
                          <td className="py-3">
                            <Button variant="primary" size="md">Confirm Action</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="primary" size="md" leftIcon={<Zap className="w-3.5 h-3.5" />}>
                              Deploy Rule
                            </Button>
                          </td>
                          <td className="py-3">
                            <Button variant="primary" size="md" disabled>Disabled</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="primary" size="md" isLoading={true}>Processing</Button>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 font-mono font-medium text-ink">Secondary</td>
                          <td className="py-3">
                            <Button variant="secondary" size="md">Review Details</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="secondary" size="md" leftIcon={<Filter className="w-3.5 h-3.5" />}>
                              Filter Grid
                            </Button>
                          </td>
                          <td className="py-3">
                            <Button variant="secondary" size="md" disabled>Disabled</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="secondary" size="md" isLoading={true}>Inspecting</Button>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 font-mono font-medium text-ink">Ghost</td>
                          <td className="py-3">
                            <Button variant="ghost" size="md">Dismiss Event</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="md" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
                              Parameters
                            </Button>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="md" disabled>Disabled</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="md" isLoading={true}>Updating</Button>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 font-mono font-medium text-ink">Danger</td>
                          <td className="py-3">
                            <Button variant="danger" size="md">Lock Facility</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="danger" size="md" leftIcon={<AlertOctagon className="w-3.5 h-3.5" />}>
                              Dispatch Alert
                            </Button>
                          </td>
                          <td className="py-3">
                            <Button variant="danger" size="md" disabled>Disabled</Button>
                          </td>
                          <td className="py-3">
                            <Button variant="danger" size="md" isLoading={true}>Terminating</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sizes */}
                  <div className="pt-4 border-t border-hairline flex flex-wrap items-center gap-4">
                    <span className="text-[12px] font-mono text-muted uppercase tracking-wider">
                      Button Sizes:
                    </span>
                    <Button variant="secondary" size="sm">Small (h-8)</Button>
                    <Button variant="secondary" size="md">Medium (h-9)</Button>
                    <Button variant="secondary" size="lg">Large (h-10)</Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Data Source & Status Badges */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  2. Provenance & Semantic Status Badges
                </h3>
                <p className="text-[13px] text-muted">
                  Hard Rule 1: Every number on screen carries LIVE, PI, or SIMULATED. SIMULATED is dashed-outline.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Source Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Data Provenance Pills (Hard Rule 1)</CardTitle>
                    <CardDescription>
                      Mono pills communicating sensor origin. Dashed-outline ensures SIMULATED is never mistaken for direct telemetry.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-[8px] bg-surface-2 border border-hairline">
                      <div className="flex flex-col gap-1 items-start">
                        <SourceBadge source="LIVE" size="md" />
                        <span className="text-[11px] text-muted">Direct sub-meter stream</span>
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <SourceBadge source="PI" size="md" />
                        <span className="text-[11px] text-muted">Edge Pi cluster</span>
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <SourceBadge source="SIMULATED" size="md" />
                        <span className="text-[11px] text-muted">Dashed-outline heuristic</span>
                      </div>
                    </div>

                    <div className="text-[12px] font-mono text-muted">
                      Compact Size (size="sm"):
                      <div className="flex items-center gap-3 mt-2">
                        <SourceBadge source="LIVE" size="sm" />
                        <SourceBadge source="PI" size="sm" />
                        <SourceBadge source="SIMULATED" size="sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority & Status Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Priority & Operational Statuses</CardTitle>
                    <CardDescription>
                      Semantic colors with micro-dots. Soft background tints prevent visual fatigue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
                        Priority Tiers:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <PriorityPill priority="GREEN" />
                        <PriorityPill priority="YELLOW" />
                        <PriorityPill priority="ORANGE" />
                        <PriorityPill priority="RED" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-hairline">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
                        5 Operational State Badges:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status="normal" />
                        <StatusBadge status="attention" />
                        <StatusBadge status="review" />
                        <StatusBadge status="critical" />
                        <StatusBadge status="inactive" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 3: Metric Tiles */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  3. MetricTile (Hero Tabular Numerals)
                </h3>
                <p className="text-[13px] text-muted">
                  44px hero mono value, uppercase 12px label, delta trend indicator, and mandatory source provenance badge.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.metrics.map((m: MetricItem) => (
                  <MetricTile
                    key={m.id}
                    label={m.label}
                    value={m.value}
                    unit={m.unit}
                    delta={m.delta}
                    source={m.source}
                    subtext={m.subtext}
                  />
                ))}
              </div>
            </section>

            {/* Section 4: Operational Alert Cards */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div>
                  <h3 className="text-[20px] font-semibold text-ink">
                    4. AlertCard (Core Discrepancy Engine)
                  </h3>
                  <p className="text-[13px] text-muted">
                    Hard Rule 2: Neutral, non-accusatory operational copy. Compares expected timetable against observed sensors.
                  </p>
                </div>
                {alertFeedback && (
                  <span className="text-[12px] font-mono text-accent">
                    {alertFeedback}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data?.alerts.map((item: Alert) => (
                  <AlertCard
                    key={item.id}
                    alert={item}
                    onAcknowledge={handleAcknowledgeAlert}
                    onInspect={(id) => setAlertFeedback(`Inspecting telemetry packet for [${id}]`)}
                  />
                ))}
              </div>
            </section>

            {/* Section 5: DataTable with Density & Sticky Header */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  5. DataTable (Sticky Header, Row Hover, Density Toggle)
                </h3>
                <p className="text-[13px] text-muted">
                  Strict 1px hairline grid, monospace alignment for measurements, interactive density control.
                </p>
              </div>

              {data && (
                <DataTable
                  data={data.rooms}
                  columns={roomColumns}
                  keyExtractor={(r) => r.id}
                  defaultDensity="comfortable"
                  showDensityToggle={true}
                  onRowClick={(r) => {
                    setAlertFeedback(`Selected room record: ${r.roomCode} (${r.department})`);
                  }}
                />
              )}
            </section>

            {/* Section 6: Timeline & Empty State */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  6. Timeline & Empty State
                </h3>
                <p className="text-[13px] text-muted">
                  Vertical timeline with status-colored nodes and structured empty states.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[16px]">Telemetry Event Stream</CardTitle>
                      <SourceBadge source="LIVE" size="sm" />
                    </div>
                    <CardDescription>
                      Chronological log of grace window transitions and setback actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data && <Timeline events={data.timeline} />}
                  </CardContent>
                </Card>

                {/* Empty State */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Empty State Presentation</CardTitle>
                    <CardDescription>
                      Dashed perimeter container with icon, explanatory copy, and recovery CTA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-6">
                    <EmptyState
                      icon={<Compass className="w-6 h-6 text-accent" />}
                      title="No Safety Dispatch Incidents"
                      explanation="All campus perimeter sensors and egress doors report secured status. Real-time telemetry is operating normally."
                      actionText="Poll Edge Sensors"
                      onAction={() => setAlertFeedback('Polling 128 Raspberry Pi edge nodes... Status: All Healthy.')}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 7: Form & Navigation Controls (Switch, SegmentedControl, Skeleton, Toast, Tooltip) */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  7. Interactive Micro-Controls & Popovers
                </h3>
                <p className="text-[13px] text-muted">
                  Switch, SegmentedControl, Skeletons, Popover Tooltip, and Toast notification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Switch Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Toggle Switches</CardTitle>
                    <CardDescription>
                      8px radius thumb, accessible role="switch".
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Switch
                      checked={demoSwitch}
                      onChange={setDemoSwitch}
                      label="Automated HVAC Setback"
                      description="Apply temperature setback 10m post-vacancy."
                    />
                    <div className="pt-2 border-t border-hairline">
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled={true}
                        label="Night-Lock Override (Locked)"
                        description="Disabled by master facilities policy."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Segmented Control */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Segmented Control</CardTitle>
                    <CardDescription>
                      Calm surface pill switcher for density or filter states.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider block mb-2">
                        Display Mode:
                      </span>
                      <SegmentedControl
                        value={segmentedView}
                        onChange={(v) => setSegmentedView(v as any)}
                        options={[
                          { value: 'standard', label: 'Standard', badge: '18' },
                          { value: 'dense', label: 'Dense', badge: '4' },
                          { value: 'expanded', label: 'Expanded' },
                        ]}
                      />
                    </div>

                    <div className="pt-3 border-t border-hairline flex items-center justify-between">
                      <span className="text-[12px] text-muted">Current Value:</span>
                      <span className="font-mono text-[12px] font-semibold text-accent uppercase">
                        {segmentedView}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tooltip & Popovers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Tooltips & Popovers</CardTitle>
                    <CardDescription>
                      Subtle popover shadow, hairline boundary, zero neon.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <Tooltip content="Telemetry confidence: 99.4% (Pi Node Cluster)" position="top">
                        <Button variant="secondary" size="sm" leftIcon={<HelpCircle className="w-3.5 h-3.5" />}>
                          Hover for Top Tooltip
                        </Button>
                      </Tooltip>

                      <Tooltip content="Automated schedule ingested at 08:00" position="bottom">
                        <Button variant="ghost" size="sm">
                          Hover for Bottom
                        </Button>
                      </Tooltip>
                    </div>

                    {/* Toast sample */}
                    <div className="pt-3 border-t border-hairline">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider block mb-2">
                        Notification Toast:
                      </span>
                      {activeToast ? (
                        <Toast
                          type="success"
                          title="Setback Protocol Applied"
                          message="LH-302 lighting circuits disengaged after confirmed vacancy."
                          actionText="View Telemetry"
                          onAction={() => setAlertFeedback('Navigating to LH-302 telemetry sub-stream.')}
                          onDismiss={() => setActiveToast(false)}
                        />
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveToast(true)}
                        >
                          Trigger Toast Again
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 8: Skeletons */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-hairline">
                <h3 className="text-[20px] font-semibold text-ink">
                  8. Skeletons (Calm Bone Pulse)
                </h3>
                <p className="text-[13px] text-muted">
                  Loading skeletons matching the exact card and table geometries.
                </p>
              </div>

              <Card>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 p-4 rounded-[8px] bg-surface-2 border border-hairline">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="rect" height={36} />
                      <Skeleton variant="text" width="70%" />
                    </div>
                    <div className="space-y-2 p-4 rounded-[8px] bg-surface-2 border border-hairline">
                      <Skeleton variant="text" width="55%" />
                      <Skeleton variant="rect" height={36} />
                      <Skeleton variant="text" width="60%" />
                    </div>
                    <div className="space-y-2 p-4 rounded-[8px] bg-surface-2 border border-hairline">
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="rect" height={36} />
                      <Skeleton variant="text" width="80%" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}

        {/* TAB 2: TOKENS & PALETTE */}
        {activeTab === 'tokens' && <TokenSwatches />}

        {/* TAB 3: TYPOGRAPHY SCALE */}
        {activeTab === 'typography' && <TypographySpecimen />}

        {/* TAB 4: GUIDELINES (DO & DON'T) */}
        {activeTab === 'guidelines' && <DoDontPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface py-6 px-6 mt-12 text-center text-[12px] font-mono text-muted">
        CAMPUSCARE · Control Room Editorial Design System · UN SDG 11 Sustainable Cities & Communities
      </footer>
    </div>
  );
};
