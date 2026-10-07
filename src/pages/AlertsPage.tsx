import React, { useState } from 'react';
import {
  BellRing,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { PriorityLevel } from '../types';
import { AlertCard } from '../components/ui/AlertCard';
import { PriorityPill } from '../components/ui/PriorityPill';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface AlertsPageProps {
  onNavigate: (path: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const { alerts, loading, acknowledgeAlert, resolveAlert } = useCampus();
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={240} height={28} />
        <div className="space-y-4">
          <Skeleton variant="rect" height={160} />
          <Skeleton variant="rect" height={160} />
          <Skeleton variant="rect" height={160} />
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter((a) => {
    if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Operational Priority Dispatch
            </span>
            <SourceBadge source="LIVE" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Campus Discrepancy & Alert Queue
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Neutral, non-accusatory operational discrepancies triggered when observed occupancy departs from timetable allocations past grace thresholds.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[8px] border border-hairline">
            {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-surface text-ink font-semibold border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[8px] border border-hairline">
            {(['ALL', 'GREEN', 'YELLOW', 'ORANGE', 'RED'] as const).map((pri) => (
              <button
                key={pri}
                type="button"
                onClick={() => setPriorityFilter(pri)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  priorityFilter === pri
                    ? 'bg-surface text-ink font-semibold border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {pri}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts list */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6 text-status-green" />}
          title="No Matching Operational Alerts"
          explanation="All campus spaces conform to expected timetable boundaries."
          actionText="Clear Filters"
          onAction={() => {
            setPriorityFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
              onInspect={(id) => onNavigate(`/rooms/${alert.roomId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
