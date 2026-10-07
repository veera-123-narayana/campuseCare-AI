import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  Zap,
  ShieldAlert,
  Building2,
  CheckCircle2,
  User,
  Radio,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { SourceBadge } from '../components/ui/SourceBadge';
import { PriorityPill } from '../components/ui/PriorityPill';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface DemoPageProps {
  onNavigate: (path: string) => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const {
    runScenario,
    dataMode,
    toggleDataMode,
    currentUser,
    switchRole,
    rooms,
  } = useCampus();

  const [activeScenario, setActiveScenario] = useState<string>('baseline');
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRun = async (scenarioId: string, name: string) => {
    setIsRunning(true);
    setActiveScenario(scenarioId);
    try {
      await runScenario(scenarioId);
      setFeedback(`Scenario "${name}" successfully dispatched to simulated campus gateway.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const room204 = rooms.find((r) => r.id === 'room-204');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Expo Demonstration Sandbox
            </span>
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Interactive Scenario Controller
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Test the core decision engine: Expected state + observed state + time + grace period → event → priority tier.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={() => handleRun('reset', 'Baseline Operational State')}
        >
          Reset All States
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-[8px] bg-accent-soft border border-accent/20 text-accent font-mono text-[13px] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main 2-Column: Scenarios & Live Status Inspect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Scenario Buttons */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[20px] font-semibold text-ink">
            Interactive Test Scenarios
          </h2>

          <div className="space-y-4">
            {/* Scenario 1: Lecture Cancelled / Waste */}
            <Card
              className={`${
                activeScenario === 'empty-lecture-waste'
                  ? 'border-status-orange border-2'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityPill priority="ORANGE" size="sm" />
                    <span className="font-mono text-[12px] text-muted">SCENARIO A</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted">Target: Room 204</span>
                </div>
                <CardTitle className="text-[16px]">
                  Unconfirmed Lecture Activity (High Energy Waste)
                </CardTitle>
                <CardDescription>
                  Timetable shows AI lecture (60 students). 18 minutes past grace period, ceiling camera reads 0 and motion is idle, but lights and AC are drawing 3.6 kW.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2 border-t border-hairline">
                <span className="text-[12px] text-muted">
                  Triggers ORANGE alert: "Classroom activity not confirmed"
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isRunning && activeScenario === 'empty-lecture-waste'}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => handleRun('empty-lecture-waste', 'Unconfirmed Lecture Activity')}
                >
                  Fire Scenario
                </Button>
              </CardContent>
            </Card>

            {/* Scenario 2: Automated Setback Applied */}
            <Card
              className={`${
                activeScenario === 'automated-setback-success'
                  ? 'border-status-green border-2'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityPill priority="GREEN" size="sm" />
                    <span className="font-mono text-[12px] text-muted">SCENARIO B</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted">Target: Room 204</span>
                </div>
                <CardTitle className="text-[16px]">
                  Automated Setback Engagement
                </CardTitle>
                <CardDescription>
                  Executes automated energy setback: turns off lighting relays and adjusts HVAC to setback mode, slashing load from 3.6 kW to 0.4 kW (89% savings).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2 border-t border-hairline">
                <span className="text-[12px] text-muted">
                  Resolves discrepancy & logs carbon savings under UN SDG 11
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isRunning && activeScenario === 'automated-setback-success'}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => handleRun('automated-setback-success', 'Automated Setback Engagement')}
                >
                  Fire Scenario
                </Button>
              </CardContent>
            </Card>

            {/* Scenario 3: Perimeter Breach */}
            <Card
              className={`${
                activeScenario === 'perimeter-trip'
                  ? 'border-status-red border-2'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityPill priority="RED" size="sm" />
                    <span className="font-mono text-[12px] text-muted">SCENARIO C</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted">Target: LAB-AI-01</span>
                </div>
                <CardTitle className="text-[16px]">
                  Perimeter Door Contact Trip (Safety Dispatch)
                </CardTitle>
                <CardDescription>
                  Simulates magnetic door contact interrupted outside scheduled lab hours. Immediately triggers RED critical priority alert with zero grace window.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2 border-t border-hairline">
                <span className="text-[12px] text-muted">
                  Immediate dispatch to campus security desk
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isRunning && activeScenario === 'perimeter-trip'}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => handleRun('perimeter-trip', 'Perimeter Door Contact Trip')}
                >
                  Fire Scenario
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Col: Controls & Live State Preview */}
        <div className="space-y-6">
          {/* Environment Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px]">Environment Toggles</CardTitle>
              <CardDescription>
                Simulated hardware environment controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-[13px]">
              {/* Data Mode Switch */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-surface-2 border border-hairline">
                <div>
                  <span className="font-semibold text-ink block">Data Mode</span>
                  <span className="text-[11px] text-muted">Toggle hardware ingest simulation</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleDataMode}
                >
                  {dataMode}
                </Button>
              </div>

              {/* Persona Switcher */}
              <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline space-y-2">
                <span className="font-semibold text-ink block">User Role Persona</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['Admin / HOD', 'Faculty', 'Student'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => switchRole(role)}
                      className={`py-1.5 px-2 rounded-[6px] text-[11px] font-mono transition-colors cursor-pointer text-center ${
                        currentUser.role === role
                          ? 'bg-accent text-white dark:text-bg font-bold'
                          : 'bg-surface text-ink border border-hairline hover:bg-surface-2'
                      }`}
                    >
                      {role.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Room 204 Telemetry Inspector */}
          {room204 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[16px]">Live Room 204 Telemetry</CardTitle>
                  <PriorityPill priority={room204.priority} size="sm" />
                </div>
                <CardDescription>
                  Current state affected by active scenario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px]">
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Class:</span>
                  <span className="font-medium text-ink">{room204.currentClass}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Headcount:</span>
                  <span className="font-mono text-ink">{room204.observedHeadcount} / {room204.capacity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-hairline text-muted">
                  <span>Active Circuit Load:</span>
                  <span className="font-mono text-ink font-bold">{room204.energyKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between py-1 text-muted">
                  <span>HVAC / Lighting:</span>
                  <span className="font-mono text-ink">{room204.hvacStatus} / {room204.lightStatus}</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => onNavigate('/rooms/room-204')}
                >
                  Open Room 204 Deep Dive
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
