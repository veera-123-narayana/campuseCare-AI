import React, { useState } from 'react';
import {
  X,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Send,
  Building2,
  Thermometer,
  Zap,
  Users,
  Check,
} from 'lucide-react';
import { Alert, PriorityLevel } from '../../types';
import { PriorityPill } from '../ui/PriorityPill';
import { SourceBadge } from '../ui/SourceBadge';
import { Button } from '../ui/Button';
import { formatTime } from '../../utils/formatTime';

interface AlertDetailSheetProps {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onAssign: (id: string, assignee: string) => void;
  onResolve: (id: string, note: string) => void;
}

const staffOptions = [
  'Facilities Desk',
  'Dr. Aris Vance (Admin)',
  'Security Patrol #04',
  'Prof. Ananya Sen',
  'Campus Safety Chief',
  'Automated Engine',
];

export const AlertDetailSheet: React.FC<AlertDetailSheetProps> = ({
  alert,
  onClose,
  onAcknowledge,
  onAssign,
  onResolve,
}) => {
  const [resolveNote, setResolveNote] = useState('');
  const [isResolvingOpen, setIsResolvingOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  if (!alert) return null;

  const isResolved = alert.triageStatus === 'Resolved' || alert.status === 'RESOLVED';
  const isAcknowledged =
    alert.triageStatus === 'Acknowledged' ||
    alert.status === 'ACKNOWLEDGED' ||
    !!alert.acknowledged;

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveNote.trim()) return;
    onResolve(alert.id, resolveNote.trim());
    setIsResolvingOpen(false);
    setResolveNote('');
  };

  const handleAssignSelect = (assignee: string) => {
    setSelectedAssignee(assignee);
    onAssign(alert.id, assignee);
  };

  const borderAccent =
    alert.priority === 'RED'
      ? 'border-status-red'
      : alert.priority === 'ORANGE'
      ? 'border-status-orange'
      : alert.priority === 'YELLOW'
      ? 'border-status-yellow'
      : 'border-status-green';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none"
      onClick={onClose}
    >
      {/* 420px Fixed Width Slide-Over Sheet */}
      <div
        className="w-full sm:w-[420px] bg-surface h-full border-l border-hairline [box-shadow:var(--shadow-popover)] flex flex-col justify-between text-ink select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-hairline bg-surface flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted uppercase font-semibold">
                ALERT ID: {alert.id}
              </span>
              {alert.repeatCount && alert.repeatCount > 1 && (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-status-orange-soft text-status-orange border border-status-orange/30 font-mono text-[10px] font-bold">
                  x{alert.repeatCount} {alert.repeatWindow}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[6px] hover:bg-surface-2 text-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <PriorityPill priority={alert.priority} size="sm" />
              <SourceBadge source={alert.source} size="sm" />
              <span className="text-[12px] font-mono text-muted">
                {alert.age || formatTime(alert.timestamp)}
              </span>
            </div>
            <h3 className="text-[18px] font-bold tracking-tight text-ink leading-snug">
              {alert.title}
            </h3>
            <span className="text-[12px] font-mono text-muted block mt-0.5">
              {alert.roomNumber || alert.roomName} · {alert.building || alert.block}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[13px]">
          {/* Section 1: Non-Accusatory Operational Explanation */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
              Operational Explanation
            </span>
            <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline space-y-2 leading-relaxed">
              <p className="text-muted leading-relaxed">{alert.description}</p>
              <div className="pt-2 border-t border-hairline grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Expected</span>
                  <span className="text-ink font-semibold">{alert.expectedState}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Observed</span>
                  <span className="text-ink font-semibold">{alert.observedState}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Context Snapshot */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
              Telemetry Context Snapshot
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Occupancy */}
              <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted" /> Headcount
                </span>
                <span className="font-mono text-[14px] font-bold text-ink">
                  {alert.contextSnapshot?.occupancyObserved ?? 0}
                  <span className="text-[11px] font-normal text-muted">
                    {' '}/ {alert.contextSnapshot?.occupancyExpected ?? 60} exp
                  </span>
                </span>
              </div>

              {/* Temperature */}
              <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-muted" /> Temperature
                </span>
                <span className="font-mono text-[14px] font-bold text-ink">
                  {alert.contextSnapshot?.temperature ?? 28.4} °C
                </span>
              </div>

              {/* Circuit Power */}
              <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                  <Zap className="w-3 h-3 text-muted" /> Power Draw
                </span>
                <span className="font-mono text-[14px] font-bold text-ink">
                  {(alert.contextSnapshot?.powerKw ?? alert.energyImpactKw).toFixed(2)} kW
                </span>
              </div>

              {/* Time Window */}
              <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted" /> Schedule
                </span>
                <span className="font-mono text-[12px] font-medium text-ink truncate block">
                  {alert.contextSnapshot?.timeSlot || alert.timeWindow || 'Active Slot'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Vertical History of Status Changes */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
              Audit & Transition History
            </span>
            <div className="relative pl-5 space-y-3 pt-1">
              {/* Continuous vertical track */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-hairline" />

              {(alert.history && alert.history.length > 0 ? alert.history : [
                {
                  id: 'h-1',
                  timestamp: alert.timestamp,
                  status: alert.triageStatus || 'New',
                  actor: 'Campus Telemetry Engine',
                  note: alert.description,
                },
              ]).map((entry, idx) => (
                <div key={entry.id || idx} className="relative group">
                  <div
                    className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ring-4 ${
                      entry.status === 'Resolved'
                        ? 'bg-status-green ring-status-green-soft'
                        : entry.status === 'Acknowledged'
                        ? 'bg-status-yellow ring-status-yellow-soft'
                        : entry.status === 'In progress'
                        ? 'bg-accent ring-accent-soft'
                        : 'bg-status-orange ring-status-orange-soft'
                    }`}
                  />
                  <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-semibold text-ink uppercase">
                        {entry.status}
                      </span>
                      <span className="text-muted tabular-nums">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-[12px] text-muted leading-tight">{entry.note}</p>
                    <span className="text-[10px] font-mono text-muted block pt-0.5">
                      Actor: {entry.actor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Assignee selector */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted">
              <span>Assigned Personnel</span>
              <span className="text-ink font-semibold">{alert.assignee || 'Unassigned'}</span>
            </div>
            <select
              value={alert.assignee || 'Unassigned'}
              onChange={(e) => handleAssignSelect(e.target.value)}
              className="w-full p-2 rounded-[6px] bg-surface-2 border border-hairline text-[12px] font-mono text-ink focus:outline-none cursor-pointer"
            >
              <option value="Unassigned">Unassigned (Queue)</option>
              {staffOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Resolve with Note Form */}
          {isResolvingOpen && (
            <form onSubmit={handleConfirmResolve} className="p-3.5 rounded-[8px] bg-surface-2 border border-accent space-y-2.5">
              <span className="text-[12px] font-mono uppercase font-semibold text-accent block">
                Resolve Alert (Mandatory Note)
              </span>
              <textarea
                required
                rows={2}
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="Explain resolution (e.g. Class verified underway, setback engaged, technician serviced latch)..."
                className="w-full p-2 rounded-[6px] bg-surface border border-hairline text-[12px] text-ink focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsResolvingOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!resolveNote.trim()}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Confirm Resolution
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Fixed Footer Action Buttons */}
        <div className="p-4 border-t border-hairline bg-surface flex items-center justify-between gap-3">
          <Button
            variant={isAcknowledged ? 'ghost' : 'secondary'}
            size="md"
            disabled={isAcknowledged || isResolved}
            onClick={() => onAcknowledge(alert.id)}
            leftIcon={<Check className="w-4 h-4" />}
            className="flex-1"
          >
            {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
          </Button>

          {!isResolvingOpen && (
            <Button
              variant={isResolved ? 'ghost' : 'primary'}
              size="md"
              disabled={isResolved}
              onClick={() => setIsResolvingOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="flex-1"
            >
              {isResolved ? 'Resolved' : 'Resolve'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
