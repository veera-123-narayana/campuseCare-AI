import React from 'react';
import { X, Play, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';
import { DecisionState } from './IntelligenceResultCard';
import { PriorityPill } from '../ui/PriorityPill';
import { Button } from '../ui/Button';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectState: (state: DecisionState['stateKey']) => void;
  currentState: DecisionState['stateKey'];
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSelectState,
  currentState,
}) => {
  if (!isOpen) return null;

  const scenarios: {
    key: DecisionState['stateKey'];
    title: string;
    priority: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    desc: string;
  }[] = [
    {
      key: 'review',
      title: 'Class Commencement Review (Default Hero State)',
      priority: 'ORANGE',
      desc: 'Scheduled lecture (60 students). 10-minute grace window expired with 0 observed headcount and idle IR / motion sensor.',
    },
    {
      key: 'started_late',
      title: 'Class Started Late (Early Ingress)',
      priority: 'YELLOW',
      desc: 'Headcount 8 students entering at T+5m within grace period. Commencement pending threshold confirmation.',
    },
    {
      key: 'normal',
      title: 'Classroom Activity Confirmed (Nominal Attendance)',
      priority: 'GREEN',
      desc: 'Observed headcount 48 students. Motion active, nominal airflow envelope maintained.',
    },
    {
      key: 'unexpected',
      title: 'Unexpected Occupancy (Unscheduled Activity)',
      priority: 'YELLOW',
      desc: '12 students occupying space outside timetable allocation. Relays energized.',
    },
    {
      key: 'no_class',
      title: 'Scheduled Vacancy (Standby Setback)',
      priority: 'GREEN',
      desc: 'No timetable allocation. Headcount 0, automated setback engaged at 0.1 kW.',
    },
    {
      key: 'offline',
      title: 'Camera Device Offline (Heartbeat Timeout)',
      priority: 'RED',
      desc: 'Camera node heartbeat timed out past 30 seconds. Stream interrupted.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-hairline rounded-[12px] [box-shadow:var(--shadow-popover)] p-6 space-y-4 text-ink select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h3 className="text-[18px] font-semibold text-ink">
              Simulate Operational States
            </h3>
            <p className="text-[13px] text-muted">
              Select any state to preview real-time cross-fade in the decision engine.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink p-1 rounded-[6px] hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {scenarios.map((s) => {
            const isSelected = currentState === s.key;

            return (
              <div
                key={s.key}
                onClick={() => {
                  onSelectState(s.key);
                  onClose();
                }}
                className={`p-3.5 rounded-[8px] border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-soft/40 border-accent ring-1 ring-accent/30'
                    : 'bg-surface-2 border-hairline hover:bg-surface hover:border-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-ink text-[14px]">
                    {s.title}
                  </span>
                  <PriorityPill priority={s.priority} size="sm" />
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px] font-mono">
          <span className="text-muted">Expo Judge Demonstration Tool</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
