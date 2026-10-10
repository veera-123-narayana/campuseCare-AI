import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  Zap,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  Radio,
  Thermometer,
  Users,
  EyeOff,
  Flame,
  AlertTriangle,
  ArrowRight,
  Pause,
  FastForward,
  X,
  ExternalLink,
  Cpu,
  Power,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { SourceBadge } from '../components/ui/SourceBadge';
import { PriorityPill } from '../components/ui/PriorityPill';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PiPhoneCameraSetupCard } from '../components/demo/PiPhoneCameraSetupCard';
import { NoticeboardEventsCard } from '../components/demo/NoticeboardEventsCard';
import { PriorityLevel } from '../types';

interface DemoPageProps {
  onNavigate: (path: string) => void;
}

interface ScenarioConfig {
  id: string;
  keyNumber: string;
  title: string;
  oneLineDescription: string;
  targetSpace: string;
  priority: PriorityLevel;
  category: 'Operational' | 'Thermal' | 'Hardware' | 'Energy' | 'Safety';
  payloadSummary: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'normal-class',
    keyNumber: '1',
    title: 'Normal class',
    oneLineDescription: 'CS302 lecture in session: 48/60 headcount, normal temperature, lights & HVAC active.',
    targetSpace: 'Room 204',
    priority: 'GREEN',
    category: 'Operational',
    payloadSummary: 'Headcount 48/60 · Normal state verified by camera node',
  },
  {
    id: 'started-late',
    keyNumber: '2',
    title: 'Started late',
    oneLineDescription: 'Class delayed: 14 students entering at 10:05 within active 10-minute grace period.',
    targetSpace: 'Room 204',
    priority: 'YELLOW',
    category: 'Operational',
    payloadSummary: 'Headcount 14/60 · 10m grace period active · Advisory state',
  },
  {
    id: 'class-not-confirmed',
    keyNumber: '3',
    title: 'Class not confirmed',
    oneLineDescription: 'Grace period exceeded (10 min): 0 students detected; operational review raised.',
    targetSpace: 'Room 204',
    priority: 'ORANGE',
    category: 'Operational',
    payloadSummary: '0 headcount past grace threshold · 3.2 kW circuit load active',
  },
  {
    id: 'unexpected-occupancy',
    keyNumber: '4',
    title: 'Unexpected occupancy',
    oneLineDescription: '35 occupants gathered in Room 204 during unscheduled free slot with full lights.',
    targetSpace: 'Room 204',
    priority: 'YELLOW',
    category: 'Operational',
    payloadSummary: '35 occupants during unscheduled timetable gap · Advisory review',
  },
  {
    id: 'high-temperature',
    keyNumber: '5',
    title: 'High temperature',
    oneLineDescription: 'Ambient temperature reached 36.8°C with HVAC malfunction, exceeding 30.0°C safety band.',
    targetSpace: 'Room 204',
    priority: 'ORANGE',
    category: 'Thermal',
    payloadSummary: 'Temperature 36.8°C (threshold: 30°C) · HVAC compressor fault',
  },
  {
    id: 'sensor-offline',
    keyNumber: '6',
    title: 'Sensor offline',
    oneLineDescription: 'ESP8266 multi-sensor environmental beacon missed 3 consecutive heartbeat intervals (>5 min).',
    targetSpace: 'Room 204',
    priority: 'YELLOW',
    category: 'Hardware',
    payloadSummary: 'Telemetry timeout · ESP8266 node missed heartbeat for 320s',
  },
  {
    id: 'camera-offline',
    keyNumber: '7',
    title: 'Camera offline',
    oneLineDescription: 'Camera node RTSP stream offline; Campus Intelligence falls back to degraded IR / motion sensor mode.',
    targetSpace: 'Room 204',
    priority: 'YELLOW',
    category: 'Hardware',
    payloadSummary: 'RTSP video stream lost · Vision confidence 0% · Degraded IR / motion sensor fallback',
  },
  {
    id: 'energy-waste',
    keyNumber: '8',
    title: 'Energy-waste opportunity',
    oneLineDescription: 'Vacant hall consuming 3.9 kW lights & HVAC for >25 minutes; triggers automated setback.',
    targetSpace: 'Room 204',
    priority: 'ORANGE',
    category: 'Energy',
    payloadSummary: 'Unoccupied load 3.9 kW · 89% potential energy saving identified',
  },
  {
    id: 'emergency-request',
    keyNumber: '9',
    title: 'Emergency request',
    oneLineDescription: 'Rapid medical assistance SOS triggered at Room 204 console; critical RED dispatch.',
    targetSpace: 'Room 204',
    priority: 'RED',
    category: 'Safety',
    payloadSummary: 'Hardware SOS beacon active · Immediate security & first-aid dispatch',
  },
];

interface PipelineStageInfo {
  step: number;
  label: string;
  sublabel: string;
  description: string;
}

const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    step: 1,
    label: 'Data Ingest',
    sublabel: 'Optical & Sensor MQTT',
    description: 'Raw frame bounding-boxes & ESP8266 telemetry received at edge broker',
  },
  {
    step: 2,
    label: 'Event Parsing',
    sublabel: 'Normalization',
    description: 'Payload validated against schema and normalized into campus telemetry event',
  },
  {
    step: 3,
    label: 'Context Enrichment',
    sublabel: 'Schedule & Grace Window',
    description: 'Correlated with room timetable, class start time, and 10-minute grace rule',
  },
  {
    step: 4,
    label: 'Campus Decision',
    sublabel: 'Decision Engine',
    description: 'Rule match evaluated: Vision confidence 92% evaluated separately from state',
  },
  {
    step: 5,
    label: 'Alert Triage',
    sublabel: 'Priority & Deduplication',
    description: 'Priority tier determined (Red/Orange/Yellow/Green) and deduplicated',
  },
  {
    step: 6,
    label: 'Dashboard & Action',
    sublabel: 'Dispatch Ledger',
    description: 'Propagated live to Room 204 hero view, Facilities Desk, and carbon ledger',
  },
];

interface GuidedDemoStep {
  step: number;
  timeLabel: string;
  title: string;
  scenarioId: string;
  caption: string;
  actionNote: string;
}

const GUIDED_DEMO_STEPS: GuidedDemoStep[] = [
  {
    step: 1,
    timeLabel: '10:00 AM',
    title: 'Scheduled Class Baseline',
    scenarioId: 'normal-class',
    caption:
      'CS302 Distributed Systems is scheduled in Lecture Hall 204 (60 students). The Camera node verifies normal attendance and HVAC is in comfort mode.',
    actionNote: 'Baseline established · Green status verified',
  },
  {
    step: 2,
    timeLabel: '10:05 AM',
    title: 'Class Starts Late (Grace Window Active)',
    scenarioId: 'started-late',
    caption:
      'Only 14 students have arrived 5 minutes into the scheduled period. Campus Intelligence recognizes the active 10-minute grace window and flags a Yellow advisory without premature disruption.',
    actionNote: '10-minute grace countdown active · Advisory advisory logged',
  },
  {
    step: 3,
    timeLabel: '10:10 AM',
    title: 'Grace Period Exceeded — Review Raised',
    scenarioId: 'class-not-confirmed',
    caption:
      'The 10-minute grace window expires with 0 students remaining. Campus Intelligence raises an Orange Review alert: "Classroom activity unconfirmed" while lights and cooling still draw 3.2 kW.',
    actionNote: 'Focal intelligence card generated · Review ticket assigned',
  },
  {
    step: 4,
    timeLabel: '10:12 AM',
    title: 'Facilities Triage & Energy Waste Identification',
    scenarioId: 'energy-waste',
    caption:
      'The Facilities Desk triages the discrepancy. Rather than continuing to burn 3.9 kW in an empty hall, the system presents an automated setback opportunity for immediate intervention.',
    actionNote: 'High energy waste flagged · Potential 89% load reduction',
  },
  {
    step: 5,
    timeLabel: '10:14 AM',
    title: 'Automated Energy Setback Applied',
    scenarioId: 'automated-setback-success',
    caption:
      'Automated setback engages: non-critical lighting circuits power down and HVAC throttles to eco mode. Power plummets from 3.9 kW to 0.4 kW.',
    actionNote: 'Load slashed to 0.4 kW · 89% power savings achieved',
  },
  {
    step: 6,
    timeLabel: '10:15 AM',
    title: 'Discrepancy Resolved & Carbon Ledger Updated',
    scenarioId: 'baseline',
    caption:
      'Department coordinator confirms lecture cancellation. The alert is resolved, timeline verified, and 3.5 kWh avoided waste is recorded toward UN SDG 11 metrics.',
    actionNote: 'Full closed-loop cycle complete · SDG 11 carbon credit logged',
  },
];

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const {
    runScenario,
    isSimulationMode,
    toggleSimulationMode,
    setSimulationMode,
    activeScenarioId,
    setActiveScenarioId,
    updateRoomLive,
    rooms,
    isDeviceOfflineSimulated,
    setIsDeviceOfflineSimulated,
  } = useCampus();

  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [pipelineScenarioName, setPipelineScenarioName] = useState<string>('');
  const [pipelineFinishedNote, setPipelineFinishedNote] = useState<string | null>(null);

  // Guided demo state
  const [isGuidedDemoRunning, setIsGuidedDemoRunning] = useState<boolean>(false);
  const [guidedDemoStepIndex, setGuidedDemoStepIndex] = useState<number>(0);
  const [guidedDemoTimeRemaining, setGuidedDemoTimeRemaining] = useState<number>(90);
  const [isGuidedDemoPaused, setIsGuidedDemoPaused] = useState<boolean>(false);

  const room204 = rooms.find((r) => r.id === 'room-204');

  // Sliders local preview state synced from room204
  const [localHeadcount, setLocalHeadcount] = useState<number>(room204?.observedHeadcount ?? 0);
  const [localTemperature, setLocalTemperature] = useState<number>(28.4);
  const [localMotion, setLocalMotion] = useState<boolean>(room204?.motionDetected ?? false);

  useEffect(() => {
    if (room204) {
      setLocalHeadcount(room204.observedHeadcount);
      setLocalMotion(room204.motionDetected);
    }
  }, [room204?.observedHeadcount, room204?.motionDetected]);

  // Execute scenario through the 6-stage 3-second pipeline
  const executeScenarioWithPipeline = useCallback(
    async (scenarioId: string, title: string) => {
      setIsPipelineRunning(true);
      setPipelineScenarioName(title);
      setPipelineFinishedNote(null);
      setActivePipelineStep(1);

      // Stage progression over ~3000ms (500ms per stage)
      const stageTimer1 = setTimeout(() => setActivePipelineStep(2), 500);
      const stageTimer2 = setTimeout(() => setActivePipelineStep(3), 1000);
      const stageTimer3 = setTimeout(() => setActivePipelineStep(4), 1500);
      const stageTimer4 = setTimeout(() => setActivePipelineStep(5), 2000);
      const stageTimer5 = setTimeout(() => setActivePipelineStep(6), 2500);

      const completionTimer = setTimeout(async () => {
        try {
          await runScenario(scenarioId);
          setPipelineFinishedNote(
            `Scenario "${title}" fully propagated through edge pipeline to dashboard.`
          );
        } catch (err) {
          console.error('Scenario execution error:', err);
        } finally {
          setIsPipelineRunning(false);
        }
      }, 3000);

      return () => {
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        clearTimeout(stageTimer4);
        clearTimeout(stageTimer5);
        clearTimeout(completionTimer);
      };
    },
    [runScenario]
  );

  // Guided demo 90-second runner
  const guidedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGuidedDemoRunning || isGuidedDemoPaused) {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
      return;
    }

    guidedTimerRef.current = setInterval(() => {
      setGuidedDemoTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsGuidedDemoRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
    };
  }, [isGuidedDemoRunning, isGuidedDemoPaused]);

  // Advance guided steps every 15 seconds (90s / 6 steps)
  useEffect(() => {
    if (!isGuidedDemoRunning) return;

    // Calculate which step (0 to 5) we should be on
    const elapsed = 90 - guidedDemoTimeRemaining;
    const expectedStep = Math.min(5, Math.floor(elapsed / 15));

    if (expectedStep !== guidedDemoStepIndex) {
      setGuidedDemoStepIndex(expectedStep);
      const currentStepObj = GUIDED_DEMO_STEPS[expectedStep];
      if (currentStepObj) {
        executeScenarioWithPipeline(currentStepObj.scenarioId, currentStepObj.title);
      }
    }
  }, [guidedDemoTimeRemaining, isGuidedDemoRunning, guidedDemoStepIndex, executeScenarioWithPipeline]);

  const handleStartGuidedDemo = () => {
    setIsGuidedDemoRunning(true);
    setIsGuidedDemoPaused(false);
    setGuidedDemoTimeRemaining(90);
    setGuidedDemoStepIndex(0);
    const firstStep = GUIDED_DEMO_STEPS[0];
    executeScenarioWithPipeline(firstStep.scenarioId, firstStep.title);
  };

  const handleStopGuidedDemo = () => {
    setIsGuidedDemoRunning(false);
    setIsGuidedDemoPaused(false);
    setGuidedDemoTimeRemaining(90);
  };

  const handleNextGuidedStep = () => {
    if (guidedDemoStepIndex < GUIDED_DEMO_STEPS.length - 1) {
      const nextIndex = guidedDemoStepIndex + 1;
      setGuidedDemoStepIndex(nextIndex);
      setGuidedDemoTimeRemaining(90 - nextIndex * 15);
      const nextStep = GUIDED_DEMO_STEPS[nextIndex];
      executeScenarioWithPipeline(nextStep.scenarioId, nextStep.title);
    }
  };

  const handlePrevGuidedStep = () => {
    if (guidedDemoStepIndex > 0) {
      const prevIndex = guidedDemoStepIndex - 1;
      setGuidedDemoStepIndex(prevIndex);
      setGuidedDemoTimeRemaining(90 - prevIndex * 15);
      const prevStep = GUIDED_DEMO_STEPS[prevIndex];
      executeScenarioWithPipeline(prevStep.scenarioId, prevStep.title);
    }
  };

  // Direct Live Telemetry Sliders
  const handleHeadcountChange = (val: number) => {
    setLocalHeadcount(val);
    updateRoomLive('room-204', {
      observedHeadcount: val,
      motionDetected: val > 0,
      status: val === 0 ? 'review' : 'normal',
      priority: val === 0 ? 'ORANGE' : 'GREEN',
    });
  };

  const handleTemperatureChange = (val: number) => {
    setLocalTemperature(val);
    if (val >= 32.0) {
      updateRoomLive('room-204', {
        status: 'review',
        priority: 'ORANGE',
      });
    } else {
      updateRoomLive('room-204', {
        status: localHeadcount === 0 ? 'review' : 'normal',
        priority: localHeadcount === 0 ? 'ORANGE' : 'GREEN',
      });
    }
  };

  const handleMotionToggle = () => {
    const next = !localMotion;
    setLocalMotion(next);
    updateRoomLive('room-204', {
      motionDetected: next,
    });
  };

  const handleDeviceOfflineToggle = () => {
    const next = !isDeviceOfflineSimulated;
    setIsDeviceOfflineSimulated(next);
    if (next) {
      updateRoomLive('room-204', {
        status: 'attention',
        priority: 'YELLOW',
      });
    }
  };

  const handleResetToBaseline = async () => {
    setLocalHeadcount(0);
    setLocalTemperature(28.4);
    setLocalMotion(false);
    setIsDeviceOfflineSimulated(false);
    handleStopGuidedDemo();
    await executeScenarioWithPipeline('baseline', 'Baseline State');
  };

  const currentGuidedStep = GUIDED_DEMO_STEPS[guidedDemoStepIndex];

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Expo Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Expo Presenter Console
            </span>
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-hairline text-ink">
              Keyboard Shortcuts <kbd className="font-bold text-status-orange">1</kbd>–<kbd className="font-bold text-status-orange">9</kbd>
            </span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Interactive Scenario Controller
          </h1>
          <p className="text-[14px] text-muted leading-relaxed max-w-3xl">
            Pushes synthetic events through the <strong>same unified pipeline</strong> as production edge hardware (data → event → context → decision → alert → dashboard).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Guided Demo Button */}
          <Button
            variant={isGuidedDemoRunning ? 'danger' : 'primary'}
            size="md"
            leftIcon={isGuidedDemoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            onClick={isGuidedDemoRunning ? handleStopGuidedDemo : handleStartGuidedDemo}
          >
            {isGuidedDemoRunning ? 'Stop Guided Demo' : 'Guided Demo (90s Story)'}
          </Button>

          {/* Reset Baseline */}
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleResetToBaseline}
          >
            Reset Baseline
          </Button>
        </div>
      </div>

      {/* Guided Demo 90s Player Banner (Active when guided demo is running) */}
      {isGuidedDemoRunning && currentGuidedStep && (
        <div className="rounded-[10px] bg-surface-2 border-2 border-accent p-5 space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-accent text-white dark:text-bg uppercase tracking-wide">
                Guided Expo Demo · Step {guidedDemoStepIndex + 1} of 6
              </span>
              <span className="text-[13px] font-mono font-semibold text-accent">
                {currentGuidedStep.timeLabel}
              </span>
              <span className="text-hairline">|</span>
              <span className="text-[13px] font-semibold text-ink">
                {currentGuidedStep.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-muted">
                Time remaining: <strong className="text-ink">{guidedDemoTimeRemaining}s</strong>
              </span>

              <button
                type="button"
                onClick={() => setIsGuidedDemoPaused(!isGuidedDemoPaused)}
                className="text-[12px] font-mono px-2 py-1 rounded bg-surface border border-hairline hover:bg-surface-2 cursor-pointer flex items-center gap-1"
              >
                {isGuidedDemoPaused ? <Play className="w-3 h-3 text-status-green" /> : <Pause className="w-3 h-3" />}
                {isGuidedDemoPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                type="button"
                onClick={handlePrevGuidedStep}
                disabled={guidedDemoStepIndex === 0}
                className="text-[12px] font-mono px-2 py-1 rounded bg-surface border border-hairline hover:bg-surface-2 disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>

              <button
                type="button"
                onClick={handleNextGuidedStep}
                disabled={guidedDemoStepIndex === GUIDED_DEMO_STEPS.length - 1}
                className="text-[12px] font-mono px-2 py-1 rounded bg-surface border border-hairline hover:bg-surface-2 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleStopGuidedDemo}
                className="text-muted hover:text-ink p-1 rounded hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-1000 ease-linear"
              style={{ width: `${((90 - guidedDemoTimeRemaining) / 90) * 100}%` }}
            />
          </div>

          {/* On-Screen Caption */}
          <div className="bg-surface p-4 rounded-[8px] border border-hairline flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[14px] text-ink font-medium leading-relaxed">
                "{currentGuidedStep.caption}"
              </p>
              <p className="text-[12px] font-mono text-accent">
                Action: {currentGuidedStep.actionNote}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/rooms/room-204')}
            >
              Inspect Room 204
            </Button>
          </div>
        </div>
      )}

      {/* Pi + phone camera + IR setup card */}
      <PiPhoneCameraSetupCard />

      {/* Events from Noticeboard (simulated) */}
      <NoticeboardEventsCard />

      {/* Real-Time Hardware Pipeline Stepper (lights up stage by stage over ~3s) */}
      <Card className="border border-hairline shadow-2xs">
        <CardHeader className="pb-3 border-b border-hairline">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-status-orange" />
              <CardTitle className="text-[16px]">Telemetry Ingestion Pipeline</CardTitle>
              <span className="text-[11px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded border border-hairline">
                data → event → context → decision → alert → dashboard
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPipelineRunning ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-mono bg-status-orange-soft text-status-orange font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-status-orange animate-ping" />
                  Executing Pipeline ({activePipelineStep}/6)...
                </span>
              ) : pipelineFinishedNote ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-mono bg-status-green-soft text-status-green font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pipeline Latency: 142ms · Synchronized
                </span>
              ) : (
                <span className="text-[11px] font-mono text-muted">
                  Pipeline Idle · Click any scenario or press 1–9
                </span>
              )}
            </div>
          </div>
          <CardDescription className="text-[12px]">
            Every scenario event traverses the identical multi-stage inference architecture as physical Raspberry Pi camera nodes and environmental gateways.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-6">
          {/* Horizontal 6-Stage Stepper */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {PIPELINE_STAGES.map((stage) => {
              const isActive = activePipelineStep === stage.step;
              const isPast = activePipelineStep > stage.step;

              return (
                <div
                  key={stage.step}
                  className={`p-3.5 rounded-[8px] border transition-all duration-300 flex flex-col justify-between ${
                    isActive
                      ? 'border-status-orange bg-status-orange-soft/40 shadow-xs ring-2 ring-status-orange/20'
                      : isPast
                      ? 'border-status-green/40 bg-status-green-soft/20 text-ink'
                      : 'border-hairline bg-surface text-muted'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                          isActive
                            ? 'bg-status-orange text-white animate-pulse'
                            : isPast
                            ? 'bg-status-green text-white'
                            : 'bg-surface-2 text-muted border border-hairline'
                        }`}
                      >
                        {isPast ? '✓' : stage.step}
                      </span>

                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          isActive
                            ? 'text-status-orange'
                            : isPast
                            ? 'text-status-green'
                            : 'text-muted'
                        }`}
                      >
                        {isActive ? 'Processing' : isPast ? 'Done' : 'Waiting'}
                      </span>
                    </div>

                    <h4 className="text-[13px] font-semibold text-ink mb-0.5">
                      {stage.label}
                    </h4>
                    <p className="text-[11px] font-mono text-muted mb-2">
                      {stage.sublabel}
                    </p>
                  </div>

                  <p className="text-[11px] text-muted leading-tight border-t border-hairline pt-2">
                    {stage.description}
                  </p>
                </div>
              );
            })}
          </div>

          {pipelineFinishedNote && (
            <div className="mt-4 p-3 rounded-[6px] bg-accent-soft border border-accent/20 text-accent font-mono text-[12px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pipelineFinishedNote}</span>
              </div>
              <button
                type="button"
                onClick={() => setPipelineFinishedNote(null)}
                className="cursor-pointer text-muted hover:text-ink font-bold"
              >
                ×
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main 2-Column: 9 Scenarios (Left 2 Cols) & Live Hardware Controls (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: 9 Scenario Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">
                9 Expo Test Scenarios
              </h2>
              <p className="text-[13px] text-muted">
                Click "Run" or press the corresponding numeric key <kbd className="font-mono text-xs">1</kbd>–<kbd className="font-mono text-xs">9</kbd>.
              </p>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Active: <strong className="text-ink">{activeScenarioId || 'baseline'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENARIOS.map((scn) => {
              const isCardActive = activeScenarioId === scn.id;
              const isCurrentlyExecuting = isPipelineRunning && pipelineScenarioName === scn.title;

              return (
                <Card
                  key={scn.id}
                  className={`transition-all duration-200 hover:border-accent/40 ${
                    isCardActive
                      ? 'border-status-orange ring-1 ring-status-orange shadow-xs'
                      : 'border-hairline'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={scn.priority} size="sm" />
                        <span className="text-[11px] font-mono text-muted">
                          {scn.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted">shortcut</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono font-bold text-[11px] text-ink shadow-2xs">
                          {scn.keyNumber}
                        </kbd>
                      </div>
                    </div>

                    <CardTitle className="text-[15px] font-semibold flex items-center justify-between">
                      <span>{scn.title}</span>
                      <span className="text-[11px] font-mono text-muted font-normal">
                        {scn.targetSpace}
                      </span>
                    </CardTitle>

                    <CardDescription className="text-[12px] leading-relaxed text-muted line-clamp-2">
                      {scn.oneLineDescription}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2 border-t border-hairline flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted truncate max-w-[190px]">
                      {scn.payloadSummary}
                    </span>

                    <Button
                      variant={
                        scn.priority === 'RED'
                          ? 'danger'
                          : scn.priority === 'ORANGE'
                          ? 'primary'
                          : 'secondary'
                      }
                      size="sm"
                      isLoading={isCurrentlyExecuting}
                      leftIcon={<Play className="w-3 h-3" />}
                      onClick={() => executeScenarioWithPipeline(scn.id, scn.title)}
                    >
                      Run
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Controls Panel & Room 204 Telemetry Inspector */}
        <div className="space-y-6">
          {/* Hardware & Environment Controls */}
          <Card className="border border-hairline shadow-2xs">
            <CardHeader className="pb-3 border-b border-hairline">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[16px] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  Live Hardware Controls
                </CardTitle>
                <SourceBadge source="SIMULATED" size="sm" />
              </div>
              <CardDescription className="text-[12px]">
                Adjust live parameters; Room 204 updates immediately client-side.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-5 text-[13px]">
              {/* Simulation Start / Stop Toggle */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div>
                  <span className="font-semibold text-ink block">Simulation Engine</span>
                  <span className="text-[11px] text-muted">
                    {isSimulationMode ? 'Active (Banner visible)' : 'Stopped (Manual mode)'}
                  </span>
                </div>
                <Button
                  variant={isSimulationMode ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={toggleSimulationMode}
                >
                  {isSimulationMode ? 'Stop Simulation' : 'Start Simulation'}
                </Button>
              </div>

              {/* Headcount Slider (0 to 60) */}
              <div className="space-y-2 p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-accent" />
                    Headcount (Camera inference)
                  </span>
                  <span className="font-mono font-bold text-ink text-[13px] px-2 py-0.5 rounded bg-surface border border-hairline">
                    {localHeadcount} / 60
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={localHeadcount}
                  onChange={(e) => handleHeadcountChange(parseInt(e.target.value, 10))}
                  className="w-full accent-accent cursor-pointer h-2 bg-surface rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>0 (Vacant review)</span>
                  <span>14 (Delayed)</span>
                  <span>48 (Normal)</span>
                  <span>60 (Full)</span>
                </div>
              </div>

              {/* Temperature Slider (18.0 to 42.0 C) */}
              <div className="space-y-2 p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-status-orange" />
                    Temperature (ESP8266 ADC)
                  </span>
                  <span
                    className={`font-mono font-bold text-[13px] px-2 py-0.5 rounded bg-surface border border-hairline ${
                      localTemperature > 30.0 ? 'text-status-orange' : 'text-ink'
                    }`}
                  >
                    {localTemperature.toFixed(1)} °C
                  </span>
                </div>
                <input
                  type="range"
                  min="18.0"
                  max="42.0"
                  step="0.2"
                  value={localTemperature}
                  onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                  className="w-full accent-status-orange cursor-pointer h-2 bg-surface rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>18.0°C (Chilled)</span>
                  <span>24.0°C (Comfort band)</span>
                  <span>36.8°C (Alarm)</span>
                </div>
              </div>

              {/* IR / Motion Sensor Toggle */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div>
                  <span className="font-semibold text-ink block">IR / motion sensor</span>
                  <span className="text-[11px] font-mono text-muted">
                    {localMotion ? 'Motion detected (Pulse active)' : 'Idle (No activity for 5m)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMotionToggle}
                  className={`px-3 py-1.5 rounded-[6px] text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                    localMotion
                      ? 'bg-status-green text-white'
                      : 'bg-surface text-muted border border-hairline hover:bg-surface-2'
                  }`}
                >
                  {localMotion ? 'ACTIVE' : 'IDLE'}
                </button>
              </div>

              {/* Simulate Device Offline Toggle */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div>
                  <span className="font-semibold text-ink block">Simulate Device Offline</span>
                  <span className="text-[11px] text-muted">
                    {isDeviceOfflineSimulated
                      ? 'ESP-204 & camera heartbeat missing'
                      : 'All edge nodes communicating'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDeviceOfflineToggle}
                  className={`px-3 py-1.5 rounded-[6px] text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                    isDeviceOfflineSimulated
                      ? 'bg-status-red text-white'
                      : 'bg-surface text-muted border border-hairline hover:bg-surface-2'
                  }`}
                >
                  {isDeviceOfflineSimulated ? 'OFFLINE' : 'ONLINE'}
                </button>
              </div>

              {/* Reset to Baseline Button */}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleResetToBaseline}
              >
                Reset All Parameters to Baseline
              </Button>
            </CardContent>
          </Card>

          {/* Live Room 204 Telemetry Inspector */}
          {room204 && (
            <Card className="border border-hairline shadow-2xs">
              <CardHeader className="pb-3 border-b border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent" />
                    <CardTitle className="text-[16px]">Room 204 Live Sync</CardTitle>
                  </div>
                  <PriorityPill priority={room204.priority} size="sm" />
                </div>
                <CardDescription className="text-[12px]">
                  State reflected instantly across the hero room view.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-3 space-y-2.5 text-[13px]">
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Scheduled Session:</span>
                  <span className="font-medium text-ink">{room204.currentClass}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Observed Headcount:</span>
                  <span className="font-mono text-ink font-semibold">
                    {room204.observedHeadcount} / {room204.capacity}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Motion State:</span>
                  <span className="font-mono text-ink">
                    {room204.motionDetected ? 'Detected' : 'Idle'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Active Circuit Load:</span>
                  <span className="font-mono text-ink font-bold">
                    {room204.energyKw.toFixed(2)} kW
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>HVAC / Lighting:</span>
                  <span className="font-mono text-ink">
                    {room204.hvacStatus} / {room204.lightStatus}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-muted">
                  <span>Decision State:</span>
                  <span className="font-mono text-[11px] text-accent font-semibold">
                    {room204.classState}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-3"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate('/rooms/room-204')}
                >
                  Open Hero View: Room 204
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
