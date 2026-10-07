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

import { IntelligenceResultCard, DecisionState } from '../components/room/IntelligenceResultCard';
import { RoomTimelineCard } from '../components/room/RoomTimelineCard';
import { Occupancy24hChart } from '../components/room/Occupancy24hChart';
import { CameraFeedCard } from '../components/room/CameraFeedCard';
import { SensorsCard } from '../components/room/SensorsCard';
import { LoadsCard } from '../components/room/LoadsCard';
import { RoomTimetableCard } from '../components/room/RoomTimetableCard';
import { SimulationModal } from '../components/room/SimulationModal';

interface RoomDetailPageProps {
  roomId: string;
  onNavigate: (path: string) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({ roomId, onNavigate }) => {
  const { acknowledgeAlert, loading: contextLoading } = useCampus();

  // Interactive Live States
  const [headcount, setHeadcount] = useState<number>(0);
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [fanOn, setFanOn] = useState<boolean>(true);
  const [activeSimulationState, setActiveSimulationState] = useState<DecisionState['stateKey']>('review');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    if (activeSimulationState === 'offline') {
      return {
        stateKey: 'offline',
        eventName: 'Camera telemetry stream interrupted',
        priority: 'RED',
        ruleTag: 'RULE: DEVICE_HEARTBEAT_TIMEOUT',
        confidence: 0,
        explanation:
          'Ceiling vision inference node (CAM-204) heartbeat timed out for 45 seconds. Physical link down on PoE switch port 14.',
        recommendedAction: 'Inspect edge Raspberry Pi PoE connection or verify subnet routing.',
        expectedSubject: 'Artificial Intelligence (AI-401)',
        expectedCount: 60,
        expectedTime: '10:00 - 11:00',
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
        expectedSubject: 'Artificial Intelligence (AI-401)',
        expectedCount: 60,
        expectedTime: '10:00 - 11:00',
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
        expectedSubject: 'Artificial Intelligence (AI-401)',
        expectedCount: 60,
        expectedTime: '10:00 - 11:00',
        observedCount: headcount,
        observedMotion: 'Intermittent ingress',
        observedPower: currentPowerKw,
        observedTemp: 27.9,
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
      expectedSubject: 'Artificial Intelligence (AI-401)',
      expectedCount: 60,
      expectedTime: '10:00 - 11:00',
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
            <span>CSE Block</span>
            <span>/</span>
            <span className="text-ink font-semibold">LH-204</span>
          </nav>

          {/* Room Name (28 Page Title) + Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
              Lecture Hall 204, CSE Block, 2nd Floor
            </h1>
            <StatusBadge status={operationalStatus} size="md" />
            <SourceBadge source="LIVE" size="md" />
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
          value={`${headcount} people`}
          unit={`/ 60 seats`}
          delta={{
            value: headcount === 0 ? '-60 vs timetable' : `${headcount} active`,
            trend: headcount === 0 ? 'down' : 'up',
            isPositive: headcount > 0,
          }}
          source="LIVE"
          subtext="Ceiling camera vision count"
        />

        {/* Metric 2: Expected State */}
        <MetricTile
          label="Expected State"
          value={activeSimulationState === 'no_class' ? 'VACANT_SETBACK' : 'CLASS_ACTIVE'}
          delta={{ value: '10:00 - 11:00 slot', trend: 'neutral', isPositive: true }}
          source="SIMULATED"
          subtext="Academic timetable database"
        />

        {/* Metric 3: Temperature */}
        <MetricTile
          label="Ambient Temperature"
          value={decision.observedTemp.toFixed(1)}
          unit="°C"
          delta={{ value: '+0.8°C vs setpoint', trend: 'up', isPositive: false }}
          source="PI"
          subtext="ESP32 bus sensor #12"
        />

        {/* Metric 4: Current Power */}
        <MetricTile
          label="Current Power Draw"
          value={currentPowerKw.toFixed(2)}
          unit="kW"
          delta={{
            value: currentPowerKw > 0.5 ? 'Active lighting + fan' : 'Setback baseline',
            trend: currentPowerKw > 0.5 ? 'up' : 'down',
            isPositive: currentPowerKw <= 0.5,
          }}
          source="PI"
          subtext="Sub-meter branch CT-204"
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
          <RoomTimelineCard />

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

          {/* Card E: Sensors Card with Sparklines */}
          <SensorsCard
            motionActive={headcount > 0}
            temperature={decision.observedTemp}
            lightLux={lightsOn ? 540 : 80}
            humidity={48.2}
          />

          {/* Card F: Loads Card with Switches */}
          <LoadsCard
            lightsOn={lightsOn}
            onLightsChange={setLightsOn}
            fanOn={fanOn}
            onFanChange={setFanOn}
          />

          {/* Card G: Today's Timetable for LH-204 */}
          <RoomTimetableCard />
        </div>
      </div>

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
