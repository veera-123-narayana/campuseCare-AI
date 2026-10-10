import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  HelpCircle,
  HeartPulse,
  Clock,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Check,
  User,
  ArrowRight,
  Shield,
  Radio,
  RotateCcw,
  AlertOctagon,
  X,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { PriorityLevel } from '../types';
import { PriorityPill } from '../components/ui/PriorityPill';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { formatTime } from '../utils/formatTime';

interface EmergencyPageProps {
  onNavigate: (path: string) => void;
}

export type EmergencyType = 'Medical' | 'Security' | 'Fire' | 'Accident' | 'Other';

export type DispatchStage =
  | 'Requested'
  | 'Acknowledged'
  | 'Responder assigned'
  | 'In progress'
  | 'Resolved';

interface ActiveEmergencyTracker {
  id: string;
  type: EmergencyType;
  building: string;
  floor: string;
  room: string;
  description: string;
  requesterName: string;
  requesterRole: string;
  currentStage: DispatchStage;
  stageTimestamps: {
    Requested: string;
    Acknowledged?: string;
    'Responder assigned'?: string;
    'In progress'?: string;
    Resolved?: string;
  };
  responderName?: string;
  etaMinutes?: number;
  createdAt: number;
}

interface ResponderQueueItem {
  id: string;
  type: EmergencyType;
  location: string;
  requester: string;
  role: string;
  notes: string;
  priority: PriorityLevel;
  status: DispatchStage;
  createdAt: number;
  assignedResponder?: string;
}

const emergencyTypeConfig: Record<
  EmergencyType,
  {
    label: string;
    icon: React.ReactNode;
    description: string;
    priority: PriorityLevel;
    borderSelected: string;
    bgSelected: string;
  }
> = {
  Medical: {
    label: 'Medical',
    icon: <HeartPulse className="w-6 h-6 text-status-red" />,
    description: 'First aid, sudden illness, or urgent medical emergency',
    priority: 'RED',
    borderSelected: 'border-status-red',
    bgSelected: 'bg-status-red-soft/40',
  },
  Security: {
    label: 'Security',
    icon: <ShieldAlert className="w-6 h-6 text-status-red" />,
    description: 'Threat to personal safety, intruder, or perimeter breach',
    priority: 'RED',
    borderSelected: 'border-status-red',
    bgSelected: 'bg-status-red-soft/40',
  },
  Fire: {
    label: 'Fire / Smoke',
    icon: <Flame className="w-6 h-6 text-status-orange" />,
    description: 'Visible fire, smoke hazard, or hazardous gas alert',
    priority: 'RED',
    borderSelected: 'border-status-orange',
    bgSelected: 'bg-status-orange-soft/40',
  },
  Accident: {
    label: 'Accident',
    icon: <AlertTriangle className="w-6 h-6 text-status-yellow" />,
    description: 'Physical fall, chemical spill, or facility structural hazard',
    priority: 'ORANGE',
    borderSelected: 'border-status-yellow',
    bgSelected: 'bg-status-yellow-soft/40',
  },
  Other: {
    label: 'Other Assistance',
    icon: <HelpCircle className="w-6 h-6 text-accent" />,
    description: 'Urgent infrastructure breakdown or non-classified distress',
    priority: 'YELLOW',
    borderSelected: 'border-accent',
    bgSelected: 'bg-accent-soft/40',
  },
};

const CAMPUS_LOCATIONS = {
  'CSE Block': {
    floors: {
      'Ground Floor': ['LAB-AI-01 (AI & Robotics Hub 01)', 'LAB-AI-02 (Computer Vision Testbed 02)', 'East Hallway Egress'],
      '2nd Floor': ['Room 201 (Smart Classroom 201)', 'Room 202 (Interactive Studio 202)', 'Room 204 (Lecture Hall 204)'],
    },
  },
  'Main Block': {
    floors: {
      'Level 1': ['Room 101 (Seminar Room 101)', 'Room 102 (Seminar Room 102)', 'Central Quadrangle'],
      'Level 3': ['Room 301 (Research Seminar 301)', 'Dean Office Foyer'],
    },
  },
};

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ onNavigate }) => {
  const { currentUser, loading } = useCampus();

  // Mode: Requester View vs Responder Dispatch Desk
  const [activeTab, setActiveTab] = useState<'requester' | 'responder'>('requester');

  // Form State
  const [selectedType, setSelectedType] = useState<EmergencyType>('Medical');
  const [building, setBuilding] = useState<string>('CSE Block');
  const [floor, setFloor] = useState<string>('2nd Floor');
  const [room, setRoom] = useState<string>('Room 204 (Lecture Hall 204)');
  const [description, setDescription] = useState<string>('');
  const [lastKnownBadge, setLastKnownBadge] = useState<boolean>(false);

  // Confirmation step state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active User Emergency Tracker (after submit)
  const [activeTracker, setActiveTracker] = useState<ActiveEmergencyTracker | null>(null);

  // Responder Queue with live ticking timers
  const [responderQueue, setResponderQueue] = useState<ResponderQueueItem[]>([
    {
      id: 'DISP-8921',
      type: 'Security',
      location: 'LAB-AI-01 · CSE Block Ground',
      requester: 'Prof. Ananya Sen',
      role: 'Faculty',
      notes: 'Secondary perimeter egress latch opened without authorization badge scan.',
      priority: 'RED',
      status: 'In progress',
      createdAt: Date.now() - 4 * 60 * 1000 - 32 * 1000, // 4m 32s ago
      assignedResponder: 'Patrol Officer Ramesh #04',
    },
    {
      id: 'DISP-8919',
      type: 'Accident',
      location: 'Room 102 · Main Block Level 1',
      requester: 'Kavya Raman',
      role: 'Student',
      notes: 'Water leak from overhead FCU near podium electrical distribution box.',
      priority: 'YELLOW',
      status: 'Acknowledged',
      createdAt: Date.now() - 11 * 60 * 1000 - 15 * 1000, // 11m 15s ago
      assignedResponder: 'Facilities Desk',
    },
  ]);

  // Live ticking timer for elapsed times
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format ticking elapsed seconds into "MM:SS elapsed"
  const formatElapsed = (createdAt: number) => {
    const elapsedSec = Math.max(0, Math.floor((currentTimeMs - createdAt) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} elapsed`;
  };

  // Handle building change to reset floor/room
  const handleBuildingChange = (newBuilding: string) => {
    setBuilding(newBuilding);
    const floors = Object.keys(CAMPUS_LOCATIONS[newBuilding as keyof typeof CAMPUS_LOCATIONS].floors);
    const firstFloor = floors[0];
    setFloor(firstFloor);
    const firstRoom = (CAMPUS_LOCATIONS[newBuilding as keyof typeof CAMPUS_LOCATIONS].floors as any)[firstFloor][0];
    setRoom(firstRoom);
    setLastKnownBadge(false);
  };

  const handleFloorChange = (newFloor: string) => {
    setFloor(newFloor);
    const rooms = (CAMPUS_LOCATIONS[building as keyof typeof CAMPUS_LOCATIONS].floors as any)[newFloor] || [];
    setRoom(rooms[0] || '');
    setLastKnownBadge(false);
  };

  // "Use my last known room" button
  const handleUseLastKnownRoom = () => {
    setBuilding('CSE Block');
    setFloor('2nd Floor');
    setRoom('Room 204 (Lecture Hall 204)');
    setLastKnownBadge(true);
  };

  // Submit emergency request
  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newId = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTracker: ActiveEmergencyTracker = {
        id: newId,
        type: selectedType,
        building,
        floor,
        room,
        description: description.trim() || 'Assistance requested via mobile terminal.',
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        currentStage: 'Requested',
        stageTimestamps: {
          Requested: timeStr,
        },
        createdAt: Date.now(),
      };

      setActiveTracker(newTracker);

      // Add to responder queue as well
      const newQueueItem: ResponderQueueItem = {
        id: newId,
        type: selectedType,
        location: `${room} · ${building}`,
        requester: currentUser.name,
        role: currentUser.role,
        notes: description.trim() || 'Assistance requested via console.',
        priority: emergencyTypeConfig[selectedType].priority,
        status: 'Requested',
        createdAt: Date.now(),
      };

      setResponderQueue((prev) => [newQueueItem, ...prev]);
      setIsSubmitting(false);
      setDescription('');
    }, 400);
  };

  // Advance tracker stage (simulation)
  const advanceTrackerStage = (nextStage: DispatchStage) => {
    if (!activeTracker) return;
    const nowTime = new Date().toTimeString().split(' ')[0];
    setActiveTracker((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentStage: nextStage,
        stageTimestamps: {
          ...prev.stageTimestamps,
          [nextStage]: nowTime,
        },
        responderName:
          nextStage === 'Responder assigned' || nextStage === 'In progress'
            ? 'Campus Response Team (Officer A. Kumar)'
            : prev.responderName,
        etaMinutes: nextStage === 'Responder assigned' ? 3 : nextStage === 'In progress' ? 1 : 0,
      };
    });

    // Sync with responder queue
    setResponderQueue((prev) =>
      prev.map((item) =>
        item.id === activeTracker.id
          ? {
              ...item,
              status: nextStage,
              assignedResponder:
                nextStage === 'Responder assigned' || nextStage === 'In progress'
                  ? 'Campus Response Team (Officer A. Kumar)'
                  : item.assignedResponder,
            }
          : item
      )
    );
  };

  // Responder actions in queue
  const updateQueueItemStatus = (id: string, nextStatus: DispatchStage) => {
    setResponderQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: nextStatus,
              assignedResponder:
                q.assignedResponder || 'Duty Security Desk (Officer On-Shift)',
            }
          : q
      )
    );

    if (activeTracker && activeTracker.id === id) {
      advanceTrackerStage(nextStatus);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton variant="text" width={280} height={32} />
        <Skeleton variant="rect" height={380} />
      </div>
    );
  }

  const STAGES: DispatchStage[] = [
    'Requested',
    'Acknowledged',
    'Responder assigned',
    'In progress',
    'Resolved',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header with Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-status-red font-semibold">
              Emergency & Life-Safety Network
            </span>
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">24/7 Monitored</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
            Safety & Emergency Assistance
          </h1>
          <p className="text-[14px] text-muted leading-relaxed max-w-2xl">
            Direct priority dispatch for students, faculty, and campus staff. All calls and dispatches route instantly to security desk and local wardens.
          </p>
        </div>

        {/* View Toggle & Direct Hotline */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[8px] border border-hairline text-[12px] font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('requester')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                activeTab === 'requester'
                  ? 'bg-surface text-ink font-semibold border border-hairline shadow-none'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Request Assistance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('responder')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'responder'
                  ? 'bg-surface text-ink font-semibold border border-hairline shadow-none'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Responder Desk</span>
              <span className="w-2 h-2 rounded-full bg-status-red" />
            </button>
          </div>

          <div className="p-2.5 rounded-[8px] bg-status-red-soft border border-status-red/30 flex items-center gap-2 text-status-red font-mono text-[12px] font-bold">
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Ext. 4444 (Campus Police)</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content based on active tab */}
      {activeTab === 'responder' ? (
        /* Responder Desk Queue (Admin View) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[18px] font-bold text-ink">
                Live Incident Queue ({responderQueue.filter((q) => q.status !== 'Resolved').length} active)
              </h2>
              <p className="text-[13px] text-muted">
                Sorted by priority tier with real-time ticking elapsed response timers.
              </p>
            </div>
            <span className="font-mono text-[12px] text-muted">
              Auto-sync: every 1s
            </span>
          </div>

          <div className="space-y-3">
            {responderQueue.map((item) => {
              const isResolved = item.status === 'Resolved';
              const priorityBorder =
                item.priority === 'RED'
                  ? 'border-l-status-red'
                  : item.priority === 'ORANGE'
                  ? 'border-l-status-orange'
                  : 'border-l-status-yellow';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-[12px] bg-surface border border-hairline border-l-4 ${priorityBorder} transition-all space-y-3 ${
                    isResolved ? 'opacity-60 bg-surface-2/40' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[13px] font-bold text-ink">
                        {item.id}
                      </span>
                      <PriorityPill priority={item.priority} size="sm" />
                      <span className="px-2 py-0.5 rounded-[4px] bg-surface-2 border border-hairline font-mono text-[11px] text-ink font-semibold">
                        {item.type}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        by {item.requester} ({item.role})
                      </span>
                    </div>

                    {/* Live Ticking Elapsed Timer */}
                    <div className="flex items-center gap-2 font-mono text-[12px]">
                      <Clock className="w-3.5 h-3.5 text-status-red" />
                      <span className="font-bold text-status-red tabular-nums">
                        {formatElapsed(item.createdAt)}
                      </span>
                      <span className="text-muted">· Status: {item.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[13px]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">Location</span>
                      <span className="font-mono font-medium text-ink">{item.location}</span>
                    </div>
                    <div className="space-y-0.5 md:col-span-2">
                      <span className="text-[10px] font-mono uppercase text-muted block">Dispatch Notes</span>
                      <p className="text-ink">{item.notes}</p>
                    </div>
                  </div>

                  {item.assignedResponder && (
                    <div className="pt-2 border-t border-hairline text-[11px] font-mono text-muted flex items-center justify-between">
                      <span>Assigned Unit: <strong className="text-ink">{item.assignedResponder}</strong></span>
                    </div>
                  )}

                  {/* Actions for Responder */}
                  {!isResolved && (
                    <div className="pt-2 border-t border-hairline flex flex-wrap items-center justify-end gap-2">
                      {item.status === 'Requested' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQueueItemStatus(item.id, 'Acknowledged')}
                        >
                          Acknowledge Call
                        </Button>
                      )}
                      {(item.status === 'Requested' || item.status === 'Acknowledged') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQueueItemStatus(item.id, 'Responder assigned')}
                        >
                          Assign Unit
                        </Button>
                      )}
                      {item.status === 'Responder assigned' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQueueItemStatus(item.id, 'In progress')}
                        >
                          Mark En Route / On Scene
                        </Button>
                      )}
                      {item.status !== 'Resolved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateQueueItemStatus(item.id, 'Resolved')}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Resolve Incident
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTracker ? (
        /* Status Tracker View (After Submit) */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-[16px] bg-surface border border-hairline space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-red animate-pulse" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-status-red">
                    Active Emergency Dispatch · ID: {activeTracker.id}
                  </span>
                </div>
                <h2 className="text-[22px] font-bold text-ink">
                  {activeTracker.type} Assistance Request
                </h2>
                <p className="font-mono text-[13px] text-muted">
                  Location: {activeTracker.room} · {activeTracker.building} ({activeTracker.floor})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono uppercase text-muted block">Ticking Response Time</span>
                <span className="font-mono text-[16px] font-bold text-status-red tabular-nums">
                  {formatElapsed(activeTracker.createdAt)}
                </span>
              </div>
            </div>

            {/* 5-Stage Visual Progress Tracker */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
                Dispatch Status Lifecycle
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                {STAGES.map((stage, idx) => {
                  const stageIndex = STAGES.indexOf(activeTracker.currentStage);
                  const isCurrent = activeTracker.currentStage === stage;
                  const isPast = stageIndex >= idx;
                  const timestamp = activeTracker.stageTimestamps[stage];

                  return (
                    <div
                      key={stage}
                      className={`p-3 rounded-[8px] border text-left space-y-1.5 transition-all ${
                        isCurrent
                          ? 'border-status-red bg-status-red-soft/40 shadow-none'
                          : isPast
                          ? 'border-hairline bg-surface-2'
                          : 'border-hairline/60 bg-surface-2/30 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted">
                          0{idx + 1}
                        </span>
                        {isPast && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              isCurrent ? 'text-status-red' : 'text-status-green'
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-ink block leading-snug">
                        {stage}
                      </span>
                      <span className="font-mono text-[10px] text-muted block tabular-nums">
                        {timestamp ? formatTime(timestamp) : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Responder Information Card */}
            <div className="p-4 rounded-[10px] bg-surface-2 border border-hairline space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                  Assigned Response Unit
                </span>
                {activeTracker.etaMinutes !== undefined && activeTracker.etaMinutes > 0 && (
                  <span className="font-mono text-[12px] font-bold text-accent">
                    Estimated Arrival: ~{activeTracker.etaMinutes} min
                  </span>
                )}
              </div>
              <p className="text-ink font-medium">
                {activeTracker.responderName || 'Central Campus Security Desk dispatching closest roving unit.'}
              </p>
              {activeTracker.description && (
                <div className="pt-2 border-t border-hairline/60 text-muted">
                  <span className="font-mono text-[11px] uppercase text-muted block">Requester Note:</span>
                  <p className="text-ink italic text-[12.5px]">"{activeTracker.description}"</p>
                </div>
              )}
            </div>

            {/* Simulation Controls for advancing status */}
            <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted uppercase">
                  Simulate response:
                </span>
                {activeTracker.currentStage === 'Requested' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => advanceTrackerStage('Acknowledged')}
                  >
                    Acknowledge Call
                  </Button>
                )}
                {activeTracker.currentStage === 'Acknowledged' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => advanceTrackerStage('Responder assigned')}
                  >
                    Assign Patrol #04
                  </Button>
                )}
                {activeTracker.currentStage === 'Responder assigned' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => advanceTrackerStage('In progress')}
                  >
                    Mark On-Scene
                  </Button>
                )}
                {activeTracker.currentStage === 'In progress' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => advanceTrackerStage('Resolved')}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => setActiveTracker(null)}
              >
                File New Request
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* High-Clarity Calm Request Form */
        <div className="space-y-8">
          {/* Section 1: Type Selection (Large Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-mono uppercase tracking-wider text-muted font-semibold block">
                1. Select Emergency Type
              </label>
              <span className="text-[11px] font-mono text-muted">
                Priority will be allocated automatically
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(emergencyTypeConfig) as EmergencyType[]).map((typeKey) => {
                const config = emergencyTypeConfig[typeKey];
                const isSelected = selectedType === typeKey;

                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setSelectedType(typeKey)}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                      isSelected
                        ? `${config.borderSelected} ${config.bgSelected} ring-1 ${config.borderSelected}`
                        : 'border-hairline bg-surface hover:border-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-[8px] bg-surface border border-hairline/60">
                        {config.icon}
                      </div>
                      <PriorityPill priority={config.priority} size="sm" />
                    </div>

                    <div className="mt-3">
                      <h3 className="text-[15px] font-bold text-ink leading-tight">
                        {config.label}
                      </h3>
                      <p className="text-[12px] text-muted mt-1 leading-snug">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cascading Location Picker */}
          <div className="space-y-3 bg-surface p-5 rounded-[16px] border border-hairline">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-hairline">
              <label className="text-[12px] font-mono uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>2. Specify Location</span>
              </label>

              {/* "Use my last known room" button */}
              <button
                type="button"
                onClick={handleUseLastKnownRoom}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-accent-soft text-accent border border-accent/20 text-[12px] font-mono font-medium hover:bg-accent-soft/80 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Use my last known room (Room 204)</span>
              </button>
            </div>

            {lastKnownBadge && (
              <div className="p-2 rounded-[6px] bg-accent-soft/60 border border-accent/30 font-mono text-[11px] text-accent flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                <span>Location synchronized to your schedule: CSE Block · 2nd Floor · Room 204</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Building */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-muted block">Building</span>
                <select
                  value={building}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full p-2.5 rounded-[8px] bg-surface-2 border border-hairline text-[13px] font-mono text-ink focus:outline-none cursor-pointer"
                >
                  {Object.keys(CAMPUS_LOCATIONS).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-muted block">Floor / Level</span>
                <select
                  value={floor}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  className="w-full p-2.5 rounded-[8px] bg-surface-2 border border-hairline text-[13px] font-mono text-ink focus:outline-none cursor-pointer"
                >
                  {Object.keys(CAMPUS_LOCATIONS[building as keyof typeof CAMPUS_LOCATIONS].floors).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-muted block">Specific Space</span>
                <select
                  value={room}
                  onChange={(e) => {
                    setRoom(e.target.value);
                    setLastKnownBadge(false);
                  }}
                  className="w-full p-2.5 rounded-[8px] bg-surface-2 border border-hairline text-[13px] font-mono text-ink focus:outline-none cursor-pointer"
                >
                  {((CAMPUS_LOCATIONS[building as keyof typeof CAMPUS_LOCATIONS].floors as any)[floor] || []).map(
                    (r: string) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Description */}
          <div className="space-y-2 bg-surface p-5 rounded-[16px] border border-hairline">
            <label className="text-[12px] font-mono uppercase tracking-wider text-muted font-semibold block">
              3. Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, injuries, smoke color, specific entrance, or person needing assistance..."
              className="w-full p-3 rounded-[8px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Section 4: Prominent Red Button with Confirm Step & Disclaimer */}
          <div className="space-y-4 pt-2">
            {!showConfirmModal ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-4 rounded-[12px] bg-status-red text-white font-bold text-[16px] tracking-wide hover:bg-status-red/90 transition-all cursor-pointer flex items-center justify-center gap-2 [box-shadow:var(--shadow-popover)]"
              >
                <AlertOctagon className="w-5 h-5" />
                <span>Request Immediate Assistance</span>
              </button>
            ) : (
              /* Inline Confirmation Step */
              <div className="p-5 rounded-[12px] bg-status-red-soft border-2 border-status-red space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-status-red font-bold text-[15px]">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>Confirm Dispatch Request for {selectedType.toUpperCase()} Assistance?</span>
                </div>
                <p className="text-[13px] text-ink leading-relaxed">
                  This will immediately sound priority alerts at campus security command and dispatch nearest roving officers to{' '}
                  <strong>{room} ({building})</strong>.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleConfirmSubmit}
                    isLoading={isSubmitting}
                    leftIcon={<ShieldAlert className="w-4 h-4" />}
                  >
                    Yes, Request Assistance Now
                  </Button>
                </div>
              </div>
            )}

            {/* Required Disclaimer */}
            <p className="text-center text-[12px] text-muted italic">
              CAMPUSCARE routes requests to responders. It does not give medical advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
