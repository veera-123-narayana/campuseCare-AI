import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { PriorityLevel, OperationalStatus } from '../types';

import { MetricTile } from '../components/ui/MetricTile';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Toast } from '../components/ui/Toast';

import { IntelligenceResultCard, DecisionState } from '../components/room/IntelligenceResultCard';
import { RoomTimelineCard, defaultSteps, TimelineStep } from '../components/room/RoomTimelineCard';
import { Occupancy24hChart } from '../components/room/Occupancy24hChart';
import { CameraFeedCard } from '../components/room/CameraFeedCard';
import { SensorsCard } from '../components/room/SensorsCard';
import { LoadsCard } from '../components/room/LoadsCard';
import { RoomTimetableCard } from '../components/room/RoomTimetableCard';
import { SimulationModal } from '../components/room/SimulationModal';
import { ClassroomCameraDemoCard } from '../components/room/ClassroomCameraDemoCard';
import { getEventStatus } from '../types/noticeboard';

interface RoomDetailPageProps {
  roomId: string;
  onNavigate: (path: string) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({ roomId, onNavigate }) => {
  const {
    rooms,
    acknowledgeAlert,
    loading: contextLoading,
    dataMode,
    updateRoomLive,
    noticeboardEvents,
    isDeviceOfflineSimulated,
  } = useCampus();
  const currentRoom = rooms.find((r) => r.id === roomId || r.number === roomId || `room-${r.number}` === roomId);

  // Interactive Live States
  const [headcount, setHeadcount] = useState<number>(() => currentRoom?.observedHeadcount ?? 0);
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [fanOn, setFanOn] = useState<boolean>(true);
  const [activeSimulationState, setActiveSimulationState] = useState<DecisionState['stateKey']>('review');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if an approved noticeboard event is In progress for this room
  const approvedEventInProgress = noticeboardEvents.find((evt) => {
    if (!evt.approved) return false;
    const isTarget =
      evt.affectedRooms.includes(roomId) ||
      evt.affectedRooms.includes('room-204') ||
      (currentRoom?.number && evt.affectedRooms.includes(`room-${currentRoom.number}`));
    if (!isTarget) return false;
    return getEventStatus(evt.date, evt.startTime, evt.endTime) === 'In progress';
  });

  // Timeline events state tracking both audit trace and autonomous setback events
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>(defaultSteps);

  const handleActionLogged = (entry: {
    title: string;
    detail: string;
    status: 'normal' | 'attention' | 'review' | 'critical';
  }) => {
    const now = new Date().toTimeString().split(' ')[0];
    const newStep: TimelineStep = {
      time: now,
      title: entry.title,
      detail: entry.detail,
      status: entry.status,
      source: 'SIMULATED',
      active: true,
    };
    setTimelineSteps((prev) => [
      newStep,
      ...prev.map((s) => ({ ...s, active: false })),
    ]);
  };

  // Toast state for automatic actions and alerts
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
  } | null>(null);

  const handleToast = (
    message: string,
    title?: string,
    type?: 'info' | 'success' | 'warning' | 'danger'
  ) => {
    setActiveToast({
      title: title || 'Setback Action',
      message,
      type: type || 'info',
    });
  };

  useEffect(() => {
    if (activeToast) {
      const t = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [activeToast]);

  // Synchronize with currentRoom when loaded
  useEffect(() => {
    if (currentRoom) {
      setHeadcount(currentRoom.observedHeadcount ?? 0);
    }
  }, [currentRoom]);

  // Synchronize headcount with manual simulation state if triggered
  const handleSelectScenarioState = (stateKey: DecisionState['stateKey']) => {
    setActiveSimulationState(stateKey);
    setAcknowledged(false);

    if (stateKey === 'review') {
      setHeadcount(0);
      setLightsOn(true);
      setFanOn(true);
    } else if (stateKey === 'started_late') {
      setHeadcount(8);
      setLightsOn(true);
      setFanOn(true);
    } else if (stateKey === 'normal') {
      setHeadcount(48);
      setLightsOn(true);
      setFanOn(true);
    } else if (stateKey === 'unexpected') {
      setHeadcount(15);
      setLightsOn(true);
      setFanOn(false);
    } else if (stateKey === 'no_class') {
      setHeadcount(0);
      setLightsOn(false);
      setFanOn(false);
    } else if (stateKey === 'offline') {
      setHeadcount(0);
    }
  };

  // Re-compute decision when headcount slider moves
  const handleHeadcountChange = (newCount: number) => {
    setHeadcount(newCount);
    setAcknowledged(false);

    if (activeSimulationState === 'offline') {
      return; // remain offline until changed via modal
    }

    if (newCount === 0) {
      setActiveSimulationState('review');
    } else if (newCount > 0 && newCount <= 12) {
      setActiveSimulationState('started_late');
    } else {
      setActiveSimulationState('normal');
    }
  };

  // Calculate live current electrical load
  const currentPowerKw = (lightsOn ? 0.45 : 0.0) + (fanOn ? 0.37 : 0.0);

  // Compute Decision State dynamically based on interactive variables
  const getComputedDecision = (): DecisionState => {
    const defaultSubject = currentRoom?.currentClass || (currentRoom ? 'Unscheduled' : 'Artificial Intelligence (AI-401)');
    const defaultCount = currentRoom?.expectedOccupancy ?? 60;
    const defaultTime = currentRoom?.classTime || (currentRoom ? '--' : '10:00 - 11:00');

    if (activeSimulationState === 'offline') {
      return {
        stateKey: 'offline',
        eventName: 'Camera telemetry stream interrupted',
        priority: 'RED',
        ruleTag: 'RULE: DEVICE_HEARTBEAT_TIMEOUT',
        confidence: 0,
        explanation:
          'Camera node (laptop/phone) heartbeat timed out for 45 seconds. Physical link down.',
        recommendedAction: 'Inspect edge Raspberry Pi connection or verify subnet routing.',
        expectedSubject: defaultSubject,
        expectedCount: defaultCount,
        expectedTime: defaultTime,
        observedCount: 0,
        observedMotion: 'Telemetry Unavailable',
        observedPower: currentPowerKw,
        observedTemp: 28.4,
      };
    }

    if (activeSimulationState === 'no_class') {
      return {
        stateKey: 'no_class',
        eventName: 'Scheduled room standby',
        priority: 'GREEN',
        ruleTag: 'RULE: SCHEDULED_STANDBY_VERIFIED',
        confidence: 99,
        explanation:
          'No academic bookings registered in timetable. Room maintained in energy setback mode with nominal circuit draw.',
        recommendedAction: 'Standby monitoring active. No operator intervention required.',
        expectedSubject: 'Unscheduled Recess',
        expectedCount: 0,
        expectedTime: '11:00 - 11:30',
        observedCount: headcount,
        observedMotion: 'Idle (0 triggers)',
        observedPower: currentPowerKw,
        observedTemp: 26.2,
      };
    }

    if (activeSimulationState === 'unexpected') {
      return {
        stateKey: 'unexpected',
        eventName: 'Unscheduled space occupancy detected',
        priority: 'YELLOW',
        ruleTag: 'RULE: UNSCHEDULED_OCCUPANCY',
        confidence: 94,
        explanation:
          'Vision sensors detect active student study group outside scheduled lecture window. Circuits drawing active load.',
        recommendedAction: 'Confirm ad-hoc booking in Registrar system or review access control permit.',
        expectedSubject: 'Unscheduled / Recess',
        expectedCount: 0,
        expectedTime: 'Open Window',
        observedCount: headcount,
        observedMotion: 'Active (4 triggers/min)',
        observedPower: currentPowerKw,
        observedTemp: 27.6,
      };
    }

    if (activeSimulationState === 'normal' || headcount >= 20) {
      return {
        stateKey: 'normal',
        eventName: 'Classroom activity confirmed',
        priority: 'GREEN',
        ruleTag: 'RULE: TIMETABLE_ALIGNMENT_NOMINAL',
        confidence: 96,
        explanation:
          'Observed headcount matches timetable booking within nominal bounds. Climate conditioning and high-bay lighting fully verified.',
        recommendedAction: 'Standard comfort envelope maintained. No operational intervention required.',
        expectedSubject: defaultSubject,
        expectedCount: defaultCount,
        expectedTime: defaultTime,
        observedCount: headcount,
        observedMotion: 'Active (6 triggers/min)',
        observedPower: currentPowerKw,
        observedTemp: 25.8,
      };
    }

    if (activeSimulationState === 'started_late' || (headcount > 0 && headcount < 20)) {
      return {
        stateKey: 'started_late',
        eventName: 'Classroom activity commencement pending',
        priority: 'YELLOW',
        ruleTag: 'RULE: COMMENCEMENT_DELAY_FLAGGED',
        confidence: 89,
        explanation:
          'Early student ingress detected (headcount below 30% capacity). Class commencement in progress within grace monitoring period.',
        recommendedAction: 'Monitor through remaining grace window before initiating setback.',
        expectedSubject: defaultSubject,
        expectedCount: defaultCount,
        expectedTime: defaultTime,
        observedCount: headcount,
        observedMotion: 'Intermittent ingress',
        observedPower: currentPowerKw,
        observedTemp: 27.9,
      };
    }

    // Event aware: if approved event is in progress and room is empty, review notice is suppressed
    if (approvedEventInProgress && headcount === 0) {
      return {
        stateKey: 'normal',
        eventName: 'Event in progress - empty as expected',
        priority: 'GREEN',
        ruleTag: 'RULE: APPROVED_NOTICEBOARD_EVENT',
        confidence: 99,
        explanation: `Approved noticeboard event '${approvedEventInProgress.title}' in progress explaining vacant state. Class commencement review notice suppressed for this window.`,
        recommendedAction: 'Autonomous energy setback engaged. High-bay lights and fans set back.',
        expectedSubject: approvedEventInProgress.title,
        expectedCount: 0,
        expectedTime: `${approvedEventInProgress.startTime} - ${approvedEventInProgress.endTime}`,
        observedCount: 0,
        observedMotion: 'Idle (0 triggers)',
        observedPower: currentPowerKw,
        observedTemp: 24.2,
      };
    }

    // Default hero state: 'review'
    return {
      stateKey: 'review',
      eventName: 'Class commencement review',
      priority: 'ORANGE',
      ruleTag: 'RULE: COMMENCEMENT_GRACE_EXCEEDED',
      confidence: 92,
      explanation:
        'Classroom activity has not been confirmed within the configured grace period (10 min). Operational review initiated.',
      recommendedAction: 'Verify the schedule or notify the department coordinator.',
      expectedSubject: defaultSubject,
      expectedCount: defaultCount,
      expectedTime: defaultTime,
      observedCount: headcount,
      observedMotion: 'Idle (0 triggers past grace)',
      observedPower: currentPowerKw,
      observedTemp: 28.4,
    };
  };

  const decision = getComputedDecision();

  // Mapping decision priority to status badge
  const operationalStatus: OperationalStatus =
    decision.priority === 'RED'
      ? 'critical'
      : decision.priority === 'ORANGE'
      ? 'review'
      : decision.priority === 'YELLOW'
      ? 'attention'
      : 'normal';

  const handleAcknowledge = async () => {
    setAcknowledged(true);
    setToastMessage('Operational review acknowledged. Discrepancy logged for Department Coordinator.');
    await acknowledgeAlert('ALT-204');
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1.5">
          {/* Breadcrumb Hierarchy */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12px] font-mono text-muted">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-ink cursor-pointer"
            >
              CAMPUSCARE
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigate('/rooms')}
              className="hover:text-ink cursor-pointer"
            >
              Rooms
            </button>
            <span>/</span>
            <span>{currentRoom?.block || 'CSE Block'}</span>
            <span>/</span>
            <span className="text-ink font-semibold">{currentRoom?.number ? `LH-${currentRoom.number}` : 'LH-204'}</span>
          </nav>

          {/* Room Name (28 Page Title) + Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
              {currentRoom?.name || 'Lecture Hall 204, CSE Block, 2nd Floor'}
            </h1>
            <StatusBadge status={operationalStatus} size="md" />
            <SourceBadge source={currentRoom?.source || 'SIMULATED'} size="md" />
          </div>
        </div>

        {/* Right Header Action Buttons: "Simulate" (secondary), "Acknowledge" (primary) */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setIsSimulateModalOpen(true)}
          >
            Simulate
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={acknowledged}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleAcknowledge}
          >
            {acknowledged ? 'Acknowledged' : 'Acknowledge'}
          </Button>
        </div>
      </div>

      {/* Acknowledged Feedback Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-[8px] bg-status-green-soft border border-status-green/30 text-status-green font-mono text-[13px] flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* ROW 1: 4 MetricTiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Occupancy */}
        <MetricTile
          label="Observed Occupancy"
          value={headcount != null ? `${headcount} people` : '--'}
          unit={currentRoom?.capacity != null ? `/ ${currentRoom.capacity} seats` : `/ 60 seats`}
          delta={{
            value: headcount === 0 ? '-60 vs timetable' : `${headcount} active`,
            trend: headcount === 0 ? 'down' : 'up',
            isPositive: headcount > 0,
          }}
          source={currentRoom?.source || 'SIMULATED'}
          subtext="Camera node vision count"
        />

        {/* Metric 2: Expected State */}
        <MetricTile
          label="Expected State"
          value={
            currentRoom && !currentRoom.currentClass
              ? 'VACANT_SETBACK'
              : activeSimulationState === 'no_class'
              ? 'VACANT_SETBACK'
              : 'CLASS_ACTIVE'
          }
          delta={{
            value: currentRoom ? (currentRoom.classTime || 'Standby slot') : '10:00 - 11:00 slot',
            trend: 'neutral',
            isPositive: true,
          }}
          source={currentRoom?.source || 'SIMULATED'}
          subtext="Academic timetable database"
        />

        {/* Metric 3: Temperature */}
        <MetricTile
          label="Ambient Temperature"
          value={decision.observedTemp != null ? decision.observedTemp.toFixed(1) : '--'}
          unit="°C"
          delta={{ value: '+0.8°C vs setpoint', trend: 'up', isPositive: false }}
          source={currentRoom?.source || 'SIMULATED'}
          subtext="ESP32 bus sensor #12"
        />

        {/* Metric 4: Current Power */}
        <MetricTile
          label="Current Power Draw"
          value={currentPowerKw != null ? currentPowerKw.toFixed(2) : '--'}
          unit="kW"
          delta={{
            value: currentPowerKw > 0.5 ? 'Active lighting + fan' : 'Setback baseline',
            trend: currentPowerKw > 0.5 ? 'up' : 'down',
            isPositive: currentPowerKw <= 0.5,
          }}
          source="SIMULATED"
          subtext="Sub-meter branch CT-204 (Not installed · Simulated)"
        />
      </div>

      {/* MAIN 12-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 8 Columns */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card A: Campus Intelligence Result (THE FOCAL POINT) */}
          <IntelligenceResultCard
            decision={decision}
            onVerifySchedule={() => {
              setToastMessage('Contacting Department Coordinator for Dr. Suresh Varma (AI-401).');
            }}
          />

          {/* Card B: "How we got here" Timeline */}
          <RoomTimelineCard steps={timelineSteps} />

          {/* Card C: 24-hour occupancy chart with shaded class band */}
          <Occupancy24hChart currentObserved={headcount} />
        </div>

        {/* RIGHT COLUMN: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card D: Camera Card with Headcount Slider */}
          <CameraFeedCard
            headcount={headcount}
            onHeadcountChange={handleHeadcountChange}
          />

          {/* Classroom Camera Demo (Browser) - shown only for room-204 directly below CameraFeedCard */}
          {(roomId === 'room-204' || currentRoom?.id === 'room-204' || currentRoom?.number === '204') && (
            <ClassroomCameraDemoCard
              isSimulationMode={dataMode === 'SIMULATION'}
              onFaceCountChange={(demoFaceCount, isRunning) => {
                if (isRunning && dataMode === 'SIMULATION') {
                  handleHeadcountChange(demoFaceCount);
                  updateRoomLive('room-204', { observedHeadcount: demoFaceCount });
                }
              }}
            />
          )}

          {/* Card E: Sensors Card with Sparklines */}
          <SensorsCard
            motionActive={headcount > 0}
            temperature={decision.observedTemp}
            lightLux={lightsOn ? 540 : 80}
            humidity={48.2}
          />

          {/* Card F: Loads Card with Switches */}
          <LoadsCard
            roomId={roomId}
            roomNumber={currentRoom?.number || '204'}
            headcount={headcount}
            motionDetected={headcount > 0}
            isDataFresh={!isDeviceOfflineSimulated && activeSimulationState !== 'offline'}
            isGracePeriod={activeSimulationState === 'started_late'}
            approvedEvent={approvedEventInProgress || null}
            lightsOn={lightsOn}
            onLightsChange={setLightsOn}
            fanOn={fanOn}
            onFanChange={setFanOn}
            onActionLogged={handleActionLogged}
            onToast={handleToast}
          />

          {/* Card G: Today's Timetable */}
          <RoomTimetableCard room={currentRoom} />
        </div>
      </div>

      {/* Floating Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Toast
            type={activeToast.type}
            title={activeToast.title}
            message={activeToast.message}
            onDismiss={() => setActiveToast(null)}
          />
        </div>
      )}

      {/* Simulation Modal (Triggered by Header "Simulate" Button) */}
      <SimulationModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSelectState={handleSelectScenarioState}
        currentState={activeSimulationState}
      />
    </div>
  );
};
