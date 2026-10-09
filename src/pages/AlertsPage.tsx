import React, { useState, useMemo, useEffect } from 'react';
import {
  BellRing,
  Search,
  X,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  UserCheck,
  Check,
  Building2,
  Eye,
  Radio,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { Alert, PriorityLevel, AlertStatus, AlertSourceCategory, DataSourceType } from '../types';
import { PriorityPill } from '../components/ui/PriorityPill';
import { SourceBadge } from '../components/ui/SourceBadge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Tabs, TabItem } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, ToastType } from '../components/ui/Toast';
import { AlertDetailSheet } from '../components/alerts/AlertDetailSheet';
import { TableDensity } from '../components/ui/DataTable';
import { formatTime } from '../utils/formatTime';

interface AlertsPageProps {
  onNavigate: (path: string) => void;
}

type PriorityFilter = 'ALL' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
type StatusTabId = 'ALL' | 'New' | 'Acknowledged' | 'In progress' | 'Resolved';
type SourceCategoryFilter = 'ALL' | 'Vision' | 'IoT' | 'Timetable' | 'User';

interface ToastState {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  onUndo?: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const {
    alerts,
    loading,
    acknowledgeAlert,
    resolveAlert,
    assignAlert,
    bulkUpdateAlerts,
    restoreAlertsSnapshot,
  } = useCampus();

  // Filters state
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [statusTab, setStatusTab] = useState<StatusTabId>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<SourceCategoryFilter>('ALL');
  const [deduplicate, setDeduplicate] = useState<boolean>(true);

  // Table & Sheet state
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSheetAlert, setActiveSheetAlert] = useState<Alert | null>(null);

  // Optimistic Toast with Undo state
  const [toast, setToast] = useState<ToastState | null>(null);

  // Bulk assign menu open state
  const [bulkAssignMenuOpen, setBulkAssignMenuOpen] = useState(false);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Keep sheet alert updated when alerts change in context
  useEffect(() => {
    if (activeSheetAlert) {
      const updated = alerts.find((a) => a.id === activeSheetAlert.id);
      if (updated) {
        setActiveSheetAlert(updated);
      }
    }
  }, [alerts, activeSheetAlert]);

  // Priority options for SegmentedControl
  const priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'RED', label: 'Red (Life/Critical)' },
    { value: 'ORANGE', label: 'Orange (Review)' },
    { value: 'YELLOW', label: 'Yellow (Advisory)' },
    { value: 'GREEN', label: 'Green (Normal)' },
  ];

  // Status Tab counts calculation
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: alerts.length,
      New: 0,
      Acknowledged: 0,
      'In progress': 0,
      Resolved: 0,
    };
    alerts.forEach((a) => {
      const st = a.triageStatus || (a.status === 'RESOLVED' ? 'Resolved' : a.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'New');
      if (st in counts) {
        counts[st as keyof typeof counts]++;
      }
    });
    return counts;
  }, [alerts]);

  const statusTabItems: TabItem[] = [
    { id: 'ALL', label: 'All Statuses', count: statusCounts.ALL },
    { id: 'New', label: 'New', count: statusCounts.New },
    { id: 'Acknowledged', label: 'Acknowledged', count: statusCounts.Acknowledged },
    { id: 'In progress', label: 'In Progress', count: statusCounts['In progress'] },
    { id: 'Resolved', label: 'Resolved', count: statusCounts.Resolved },
  ];

  // Source options
  const sourceOptions: { id: SourceCategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All Sources', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'Vision', label: 'Vision', icon: <Eye className="w-3.5 h-3.5 text-accent" /> },
    { id: 'IoT', label: 'IoT Sensors', icon: <Radio className="w-3.5 h-3.5 text-status-yellow" /> },
    { id: 'Timetable', label: 'Timetable', icon: <Calendar className="w-3.5 h-3.5 text-muted" /> },
    { id: 'User', label: 'User Report', icon: <User className="w-3.5 h-3.5 text-status-orange" /> },
  ];

  // Filtered and Deduplicated alerts
  const processedAlerts = useMemo(() => {
    let list = [...alerts];

    // Priority filter
    if (priorityFilter !== 'ALL') {
      list = list.filter((a) => a.priority === priorityFilter);
    }

    // Status filter
    if (statusTab !== 'ALL') {
      list = list.filter((a) => {
        const triage = a.triageStatus || (a.status === 'RESOLVED' ? 'Resolved' : a.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'New');
        return triage === statusTab;
      });
    }

    // Source Category filter
    if (sourceFilter !== 'ALL') {
      list = list.filter((a) => a.sourceCategory === sourceFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q) ||
        (a.roomNumber && a.roomNumber.toLowerCase().includes(q)) ||
        a.block.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.assignee && a.assignee.toLowerCase().includes(q))
      );
    }

    // Deduplication by roomId
    if (deduplicate) {
      const roomMap = new Map<string, Alert>();
      list.forEach((item) => {
        const existing = roomMap.get(item.roomId);
        if (!existing) {
          roomMap.set(item.roomId, { ...item });
        } else {
          // Merge repeated count
          const currentCount = existing.repeatCount || 1;
          const incomingCount = item.repeatCount || 1;
          existing.repeatCount = currentCount + incomingCount;
          if (!existing.repeatWindow) {
            existing.repeatWindow = 'in 20 min';
          }
        }
      });
      list = Array.from(roomMap.values());
    }

    // Sort by priority importance: RED -> ORANGE -> YELLOW -> GREEN
    const priorityWeight: Record<PriorityLevel, number> = {
      RED: 4,
      ORANGE: 3,
      YELLOW: 2,
      GREEN: 1,
    };
    list.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    return list;
  }, [alerts, priorityFilter, statusTab, sourceFilter, searchQuery, deduplicate]);

  // Bulk selection handlers
  const allDisplayedIds = useMemo(() => processedAlerts.map((a) => a.id), [processedAlerts]);
  const isAllSelected = allDisplayedIds.length > 0 && allDisplayedIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allDisplayedIds);
    }
  };

  const handleToggleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper for optimistic update with Undo
  const triggerOptimisticAction = (
    description: string,
    actionFn: () => Promise<void>
  ) => {
    const previousSnapshot = alerts.map((a) => ({ ...a, history: a.history ? [...a.history] : [] }));

    // Execute action
    actionFn();

    // Show toast with Undo
    setToast({
      id: `toast-${Date.now()}`,
      type: 'success',
      title: description,
      message: 'Queue state updated immediately.',
      onUndo: () => {
        restoreAlertsSnapshot(previousSnapshot);
        setToast({
          id: `toast-undo-${Date.now()}`,
          type: 'info',
          title: 'Action Reverted',
          message: 'Previous alert status restored successfully.',
        });
      },
    });
  };

  // Handlers for single alert actions
  const handleAcknowledgeSingle = (id: string) => {
    const target = alerts.find((a) => a.id === id);
    const label = target ? `Alert [${target.roomNumber || target.roomName}]` : 'Alert';
    triggerOptimisticAction(`${label} marked as Acknowledged`, () => acknowledgeAlert(id));
  };

  const handleResolveSingle = (id: string, note: string) => {
    const target = alerts.find((a) => a.id === id);
    const label = target ? `Alert [${target.roomNumber || target.roomName}]` : 'Alert';
    triggerOptimisticAction(`${label} marked as Resolved`, () => resolveAlert(id, note));
  };

  const handleAssignSingle = (id: string, assignee: string) => {
    const target = alerts.find((a) => a.id === id);
    const label = target ? `Alert [${target.roomNumber || target.roomName}]` : 'Alert';
    triggerOptimisticAction(`${label} assigned to ${assignee}`, () => assignAlert(id, assignee));
  };

  // Bulk actions
  const handleBulkAcknowledge = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const ids = [...selectedIds];
    setSelectedIds([]);
    triggerOptimisticAction(`${count} alert${count > 1 ? 's' : ''} acknowledged`, () =>
      bulkUpdateAlerts(ids, 'Acknowledge')
    );
  };

  const handleBulkResolve = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const ids = [...selectedIds];
    setSelectedIds([]);
    triggerOptimisticAction(`${count} alert${count > 1 ? 's' : ''} resolved`, () =>
      bulkUpdateAlerts(ids, 'Resolve', undefined, 'Batch resolved via Triage Workspace.')
    );
  };

  const handleBulkAssign = (assignee: string) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const ids = [...selectedIds];
    setSelectedIds([]);
    setBulkAssignMenuOpen(false);
    triggerOptimisticAction(`${count} alert${count > 1 ? 's' : ''} assigned to ${assignee}`, () =>
      bulkUpdateAlerts(ids, 'Assign', assignee)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <div className="space-y-2">
            <Skeleton variant="text" width={260} height={32} />
            <Skeleton variant="text" width={420} height={16} />
          </div>
          <Skeleton variant="rect" width={200} height={36} />
        </div>
        <div className="flex gap-4">
          <Skeleton variant="rect" width={320} height={36} />
          <Skeleton variant="rect" width={240} height={36} />
        </div>
        <Skeleton variant="rect" height={480} />
      </div>
    );
  }

  const paddingY = density === 'compact' ? 'py-2.5' : 'py-3.5';

  return (
    <div className="space-y-6 relative pb-20">
      {/* 1. Header with Breadcrumb & Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Operational Intelligence / Triage Queue
            </span>
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
            Alerts & Discrepancies Triage
          </h1>
          <p className="text-[14px] text-muted leading-relaxed max-w-3xl">
            Neutral, operationally-focused discrepancy log identifying divergence between academic timetables and physical telemetry.
          </p>
        </div>

        {/* Action / Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-mono text-muted uppercase block">Active Queue</span>
            <span className="font-mono text-[16px] font-bold text-ink">
              {alerts.filter((a) => a.status === 'ACTIVE').length} pending
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className="space-y-4 bg-surface p-4 rounded-[12px] border border-hairline">
        {/* Row 1: Priority SegmentedControl & Density Toggle & Deduplicate */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Priority SegmentedControl */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold mr-1">
              Priority:
            </span>
            <SegmentedControl
              options={priorityOptions}
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val as PriorityFilter)}
              size="sm"
            />
          </div>

          {/* Density Toggle & Deduplication Switch */}
          <div className="flex items-center gap-3">
            {/* Deduplication Toggle */}
            <button
              type="button"
              onClick={() => setDeduplicate((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-[12px] font-mono transition-colors cursor-pointer ${
                deduplicate
                  ? 'bg-accent-soft text-accent border-accent/30 font-semibold'
                  : 'bg-surface-2 text-muted border-hairline hover:text-ink'
              }`}
              title="Group repeated alerts on same room into a single row"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deduplication: {deduplicate ? 'Active' : 'Off'}</span>
            </button>

            {/* Density Toggle */}
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[6px] border border-hairline">
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                  density === 'compact'
                    ? 'bg-surface text-ink font-semibold border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                  density === 'comfortable'
                    ? 'bg-surface text-ink font-semibold border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Comfortable
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Tabs */}
        <div>
          <Tabs
            items={statusTabItems}
            activeId={statusTab}
            onChange={(id) => setStatusTab(id as StatusTabId)}
          />
        </div>

        {/* Row 3: Search Field & Source Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room, discrepancy title, ID, or assignee..."
              className="w-full pl-9 pr-8 py-2 rounded-[6px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold mr-1 shrink-0">
              Source:
            </span>
            {sourceOptions.map((src) => {
              const isSelected = sourceFilter === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSourceFilter(src.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-ink text-surface font-semibold shadow-none'
                      : 'bg-surface-2 text-muted border border-hairline hover:text-ink'
                  }`}
                >
                  {src.icon}
                  <span>{src.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main DataTable Workspace */}
      {processedAlerts.length === 0 ? (
        <div className="p-12 rounded-[16px] border border-hairline bg-surface flex flex-col items-center justify-center text-center">
          {/* Calm SVG Illustration constructed from clean geometric shapes */}
          <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
            <svg
              className="w-24 h-24 text-muted/30"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer calm concentric circles */}
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" />
              {/* Central peaceful building & balance geometry */}
              <rect x="36" y="38" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M42 46H58M42 54H58" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <circle cx="50" cy="24" r="3" fill="var(--color-accent, #0F766E)" />
            </svg>
            <ShieldCheck className="w-7 h-7 text-accent absolute inset-auto" />
          </div>

          <h3 className="text-[20px] font-semibold text-ink tracking-tight mb-2">
            All quiet. No rooms need review.
          </h3>
          <p className="text-[14px] text-muted max-w-md mb-6 leading-relaxed">
            All campus learning spaces currently conform to expected timetable boundaries and automated safety baselines.
          </p>

          {(priorityFilter !== 'ALL' || statusTab !== 'ALL' || sourceFilter !== 'ALL' || searchQuery) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                setPriorityFilter('ALL');
                setStatusTab('ALL');
                setSourceFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filter Parameters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-hairline bg-surface overflow-hidden shadow-none">
          {/* Desktop & Tablet Table (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              {/* Sticky Header */}
              <thead className="sticky top-0 bg-surface-2 border-b border-hairline z-10 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="rounded border-hairline accent-accent cursor-pointer"
                      title="Select all displayed alerts"
                    />
                  </th>
                  <th className="w-12 px-2 py-3 text-center">Pri</th>
                  <th className="px-4 py-3">Discrepancy Event</th>
                  <th className="w-36 px-4 py-3">Location</th>
                  <th className="w-32 px-4 py-3">Source</th>
                  <th className="w-24 px-4 py-3">Age</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-40 px-4 py-3">Assignee</th>
                  <th className="w-16 px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-hairline">
                {processedAlerts.map((alert) => {
                  const isSelected = selectedIds.includes(alert.id);
                  const isAck = alert.triageStatus === 'Acknowledged' || alert.status === 'ACKNOWLEDGED';
                  const isRes = alert.triageStatus === 'Resolved' || alert.status === 'RESOLVED';
                  const isInProg = alert.triageStatus === 'In progress';

                  const priorityDotBg =
                    alert.priority === 'RED'
                      ? 'bg-status-red'
                      : alert.priority === 'ORANGE'
                      ? 'bg-status-orange'
                      : alert.priority === 'YELLOW'
                      ? 'bg-status-yellow'
                      : 'bg-status-green';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setActiveSheetAlert(alert)}
                      className={`transition-colors cursor-pointer hover:bg-surface-2/60 ${
                        isSelected ? 'bg-accent-soft/40 hover:bg-accent-soft/60' : 'bg-surface'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center" onClick={(e) => handleToggleRowSelect(alert.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-hairline accent-accent cursor-pointer"
                        />
                      </td>

                      {/* Priority Dot */}
                      <td className="px-2 py-3 text-center">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${priorityDotBg} ${
                            alert.priority === 'RED' ? 'ring-4 ring-status-red/20' : ''
                          }`}
                          title={`Priority: ${alert.priority}`}
                        />
                      </td>

                      {/* Title & Deduplication badge */}
                      <td className={`px-4 ${paddingY}`}>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13.5px] text-ink leading-snug">
                              {alert.title}
                            </span>

                            {/* Deduplication Pill: x3 in 20 min */}
                            {alert.repeatCount && alert.repeatCount > 1 && (
                              <span
                                className="px-1.5 py-0.2 rounded-[4px] bg-status-orange-soft text-status-orange border border-status-orange/30 font-mono text-[10.5px] font-bold shrink-0"
                                title={`Deduplicated ${alert.repeatCount} recurring telemetry triggers within 20 minutes`}
                              >
                                x{alert.repeatCount} {alert.repeatWindow || 'in 20 min'}
                              </span>
                            )}
                          </div>

                          <p className="text-[12px] text-muted line-clamp-1">
                            {alert.description}
                          </p>
                        </div>
                      </td>

                      {/* Location (mono) */}
                      <td className={`px-4 ${paddingY} font-mono text-[12.5px] text-ink tabular-nums`}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{alert.roomNumber || alert.roomName}</span>
                          <span className="text-[11px] text-muted">{alert.block}</span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className={`px-4 ${paddingY}`}>
                        <div className="flex items-center gap-1.5">
                          <SourceBadge source={alert.source} size="sm" />
                          {alert.sourceCategory && (
                            <span className="text-[10px] font-mono text-muted uppercase">
                              {alert.sourceCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Age */}
                      <td className={`px-4 ${paddingY} font-mono text-[12px] text-muted tabular-nums`}>
                        {alert.age || formatTime(alert.timestamp)}
                      </td>

                      {/* Status */}
                      <td className={`px-4 ${paddingY}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-mono text-[11px] font-medium border ${
                            isRes
                              ? 'bg-status-green-soft text-status-green border-status-green/30'
                              : isAck
                              ? 'bg-status-yellow-soft text-status-yellow border-status-yellow/30'
                              : isInProg
                              ? 'bg-accent-soft text-accent border-accent/30'
                              : 'bg-status-orange-soft text-status-orange border-status-orange/30'
                          }`}
                        >
                          {alert.triageStatus || (isRes ? 'Resolved' : isAck ? 'Acknowledged' : 'New')}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className={`px-4 ${paddingY} font-mono text-[12px] text-muted truncate`}>
                        {alert.assignee || 'Unassigned'}
                      </td>

                      {/* Inspect Arrow */}
                      <td className={`px-4 ${paddingY} text-right text-muted`}>
                        <ArrowRight className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (< md) */}
          <div className="block md:hidden divide-y divide-hairline">
            {processedAlerts.map((alert) => {
              const isSelected = selectedIds.includes(alert.id);
              const isAck = alert.triageStatus === 'Acknowledged' || alert.status === 'ACKNOWLEDGED';
              const isRes = alert.triageStatus === 'Resolved' || alert.status === 'RESOLVED';
              const isInProg = alert.triageStatus === 'In progress';

              const priorityDotBg =
                alert.priority === 'RED'
                  ? 'bg-status-red'
                  : alert.priority === 'ORANGE'
                  ? 'bg-status-orange'
                  : alert.priority === 'YELLOW'
                  ? 'bg-status-yellow'
                  : 'bg-status-green';

              return (
                <div
                  key={alert.id}
                  onClick={() => setActiveSheetAlert(alert)}
                  className={`p-4 space-y-2.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent-soft/40' : 'bg-surface hover:bg-surface-2/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => handleToggleRowSelect(alert.id, e)} className="p-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-hairline accent-accent cursor-pointer"
                        />
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${priorityDotBg} shrink-0`} />
                      <span className="font-semibold text-[14px] text-ink line-clamp-1">
                        {alert.title}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] font-medium border shrink-0 ${
                        isRes
                          ? 'bg-status-green-soft text-status-green border-status-green/30'
                          : isAck
                          ? 'bg-status-yellow-soft text-status-yellow border-status-yellow/30'
                          : isInProg
                          ? 'bg-accent-soft text-accent border-accent/30'
                          : 'bg-status-orange-soft text-status-orange border-status-orange/30'
                      }`}
                    >
                      {alert.triageStatus || (isRes ? 'Resolved' : isAck ? 'Acknowledged' : 'New')}
                    </span>
                  </div>

                  <p className="text-[12px] text-muted line-clamp-2">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-1 border-t border-hairline/60">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{alert.roomNumber || alert.roomName}</span>
                      <span>·</span>
                      <SourceBadge source={alert.source} size="sm" />
                    </div>
                    <span>{alert.age || formatTime(alert.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Sticky Action Bar for Bulk Selection */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-surface border border-hairline rounded-[14px] p-3 px-5 [box-shadow:var(--shadow-popover)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-bold text-ink">
                {selectedIds.length} {selectedIds.length === 1 ? 'alert' : 'alerts'} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[12px] text-muted hover:text-ink underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk Acknowledge */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkAcknowledge}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Acknowledge All
              </Button>

              {/* Bulk Resolve */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkResolve}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Resolve All
              </Button>

              {/* Bulk Assign Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkAssignMenuOpen((prev) => !prev)}
                  rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
                >
                  Assign
                </Button>

                {bulkAssignMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 rounded-[8px] bg-surface border border-hairline [box-shadow:var(--shadow-popover)] p-1 z-50 text-[12px] font-mono">
                    <span className="px-2 py-1 text-[10px] text-muted uppercase block">
                      Assign selected to:
                    </span>
                    {['Facilities Desk', 'Security Patrol #04', 'Dr. Aris Vance (Admin)', 'Campus Safety Chief'].map((user) => (
                      <button
                        key={user}
                        type="button"
                        onClick={() => handleBulkAssign(user)}
                        className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-surface-2 text-ink transition-colors cursor-pointer truncate"
                      >
                        {user}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Right-side Sheet (420px fixed) for Selected Alert Detail */}
      <AlertDetailSheet
        alert={activeSheetAlert}
        onClose={() => setActiveSheetAlert(null)}
        onAcknowledge={handleAcknowledgeSingle}
        onAssign={handleAssignSingle}
        onResolve={handleResolveSingle}
      />

      {/* 6. Optimistic Updates Floating Toast with Undo Action */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            actionText={toast.onUndo ? 'Undo Action' : undefined}
            onAction={toast.onUndo}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};
