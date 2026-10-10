import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Lightbulb,
  Fan,
  Video,
  Info,
  ChevronDown,
  RotateCcw,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { Switch } from '../ui/Switch';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { NoticeboardEventItem } from '../../types/noticeboard';

export interface LoadsCardProps {
  roomId?: string;
  roomNumber?: string;
  headcount: number;
  motionDetected?: boolean;
  isDataFresh?: boolean;
  isGracePeriod?: boolean;
  approvedEvent?: NoticeboardEventItem | null;
  lightsOn: boolean;
  onLightsChange: (on: boolean) => void;
  fanOn: boolean;
  onFanChange: (on: boolean) => void;
  onActionLogged?: (entry: {
    title: string;
    detail: string;
    status: 'normal' | 'attention' | 'review' | 'critical';
  }) => void;
  onToast?: (
    message: string,
    title?: string,
    type?: 'info' | 'success' | 'warning' | 'danger'
  ) => void;
  className?: string;
}

export const LoadsCard: React.FC<LoadsCardProps> = ({
  roomId = 'room-204',
  roomNumber = '204',
  headcount,
  motionDetected = false,
  isDataFresh = true,
  isGracePeriod = false,
  approvedEvent = null,
  lightsOn,
  onLightsChange,
  fanOn,
  onFanChange,
  onActionLogged,
  onToast,
  className = '',
}) => {
  // 1. Autonomous setback toggle (default ON)
  const [isAutonomyEnabled, setIsAutonomyEnabled] = useState<boolean>(true);

  // 2. Projector presence toggle (default ON for room-204)
  const isRoom204 = roomId === 'room-204' || roomNumber === '204';
  const [hasProjector, setHasProjector] = useState<boolean>(isRoom204);

  // 3. Projector state: 'ON' | 'COOLING_DOWN' | 'OFF'
  const [projectorState, setProjectorState] = useState<'ON' | 'COOLING_DOWN' | 'OFF'>('ON');

  // 4. Configurable delays (range 5 to 600 s)
  const [lightsDelaySec, setLightsDelaySec] = useState<number>(15);
  const [projectorDelaySec, setProjectorDelaySec] = useState<number>(30);
  const [isDelaysOpen, setIsDelaysOpen] = useState<boolean>(false);

  // 5. Empty seconds tracking and cooldown seconds
  const [emptySeconds, setEmptySeconds] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // 6. Manual override timestamp (5-minute pause)
  const [manualOverrideUntil, setManualOverrideUntil] = useState<number | null>(null);

  // Ref to know if loads were turned off automatically so we know when to restore on occupancy
  const wasAutoSwitchedOffRef = useRef<boolean>(false);

  // Check manual pause
  const now = Date.now();
  const isManualPaused = manualOverrideUntil !== null && now < manualOverrideUntil;

  // Empty condition: headcount === 0 AND no motion AND data is fresh (<60s)
  const isRoomEmpty = headcount === 0 && !motionDetected && isDataFresh;

  // Manual load flip handlers (triggers 5-minute manual pause)
  const triggerManualOverride = useCallback((loadName: string) => {
    const pauseUntil = Date.now() + 5 * 60 * 1000;
    setManualOverrideUntil(pauseUntil);
    onToast?.(
      `Autonomy paused for 5 minutes (manual ${loadName} override)`,
      'Manual Override',
      'warning'
    );
  }, [onToast]);

  const handleManualLightsChange = (next: boolean) => {
    onLightsChange(next);
    triggerManualOverride('lights');
  };

  const handleManualFanChange = (next: boolean) => {
    onFanChange(next);
    triggerManualOverride('fans');
  };

  const handleManualProjectorChange = (next: boolean) => {
    if (projectorState === 'COOLING_DOWN') return;
    setProjectorState(next ? 'ON' : 'OFF');
    triggerManualOverride('projector');
  };

  // Main 1-second autonomous setback interval
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        if (!isAutonomyEnabled) {
          setEmptySeconds(0);
          return;
        }

        // Never switch anything off on stale or missing data
        if (!isDataFresh) {
          setEmptySeconds(0);
          return;
        }

        const currentTime = Date.now();
        if (manualOverrideUntil !== null && currentTime < manualOverrideUntil) {
          // Manual override active: pause autonomy
          return;
        }

        // If faces or motion are present: room is occupied
        const isOccupied = headcount > 0 || !!motionDetected;
        if (isOccupied) {
          // Restore on occupancy
          if (wasAutoSwitchedOffRef.current) {
            wasAutoSwitchedOffRef.current = false;
            if (!lightsOn) onLightsChange(true);
            if (!fanOn) onFanChange(true);

            onActionLogged?.({
              title: 'Lights and fans ON (auto, SIMULATED relay)',
              detail: 'Restored on occupancy',
              status: 'normal',
            });
            onToast?.('Lights and fans restored on occupancy', 'Restored on occupancy', 'success');

            // Projector is NOT switched back on automatically
            if (hasProjector && projectorState !== 'ON') {
              setProjectorState('OFF');
              setCooldownSeconds(0);
              onToast?.('Projector left off - switch on manually', 'Projector Notice', 'info');
              onActionLogged?.({
                title: 'Projector left off (manual switch required)',
                detail: 'Restored on occupancy',
                status: 'attention',
              });
            }
          }
          setEmptySeconds(0);
          setCooldownSeconds(0);
          return;
        }

        // Room is empty (0 headcount, no motion, fresh data)
        // Rule 3: Do NOT auto-switch off while inside class grace period with no event
        if (isGracePeriod && !approvedEvent) {
          setEmptySeconds(0);
          return;
        }

        // Increment empty counter
        setEmptySeconds((prev) => {
          const nextEmpty = prev + 1;

          // Rule 4: If approved event is in progress, lights & fans delay is 5 s
          const targetLightsDelay = approvedEvent ? 5 : lightsDelaySec;

          // Turn lights and fans off
          if (nextEmpty >= targetLightsDelay && (lightsOn || fanOn)) {
            if (lightsOn) onLightsChange(false);
            if (fanOn) onFanChange(false);
            wasAutoSwitchedOffRef.current = true;

            const reason = approvedEvent
              ? `0 faces and no motion for 5 s and event '${approvedEvent.title}' in progress`
              : `0 faces and no motion for ${lightsDelaySec} s`;

            onActionLogged?.({
              title: 'Lights and fans OFF (auto, SIMULATED relay)',
              detail: reason,
              status: 'normal',
            });
            onToast?.(
              `Lights and fans OFF (auto, SIMULATED relay): ${reason}`,
              'Autonomous Setback',
              'info'
            );
          }

          // Handle Projector delay
          if (hasProjector && projectorState === 'ON' && nextEmpty >= projectorDelaySec) {
            setProjectorState('COOLING_DOWN');
            setCooldownSeconds(10);

            onActionLogged?.({
              title: 'Projector cooling down (auto, SIMULATED relay)',
              detail: `0 faces and no motion for ${projectorDelaySec} s: cool-down active.`,
              status: 'attention',
            });
            onToast?.('Cooling down projector (simulated relay)', 'Projector Setback', 'info');
          }

          return nextEmpty;
        });

        // Handle projector cooldown 10s countdown
        if (hasProjector && projectorState === 'COOLING_DOWN') {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              setProjectorState('OFF');
              onActionLogged?.({
                title: 'Projector OFF (auto, SIMULATED relay)',
                detail: `0 faces and no motion for ${projectorDelaySec} s (cool-down complete).`,
                status: 'normal',
              });
              onToast?.('Projector OFF (auto, simulated relay)', 'Projector Setback', 'info');
              return 0;
            }
            return prev - 1;
          });
        }
      } catch (err) {
        console.warn('Error in autonomous setback timer:', err);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isAutonomyEnabled,
    isDataFresh,
    manualOverrideUntil,
    headcount,
    motionDetected,
    isGracePeriod,
    approvedEvent,
    lightsDelaySec,
    projectorDelaySec,
    hasProjector,
    projectorState,
    lightsOn,
    fanOn,
    onLightsChange,
    onFanChange,
    onActionLogged,
    onToast,
  ]);

  // Compute exact status line as required by rule 6
  const getStatusLine = (): { text: string; badgeClass: string } => {
    if (!isDataFresh) {
      return {
        text: 'Waiting for sensor data',
        badgeClass: 'bg-status-red-soft text-status-red border-status-red/30',
      };
    }

    if (isManualPaused) {
      return {
        text: 'Paused (manual override)',
        badgeClass: 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
      };
    }

    if (!isAutonomyEnabled) {
      return {
        text: 'Autonomy disabled',
        badgeClass: 'bg-surface-2 text-muted border-hairline',
      };
    }

    if (!isRoomEmpty) {
      return {
        text: 'Armed',
        badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
      };
    }

    if (isGracePeriod && !approvedEvent) {
      return {
        text: 'Armed',
        badgeClass: 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
      };
    }

    // Room is empty!
    if (hasProjector && projectorState === 'COOLING_DOWN') {
      return {
        text: 'Cooling down projector',
        badgeClass: 'bg-status-orange-soft text-status-orange border-status-orange/30',
      };
    }

    const allLoadsOff = !lightsOn && !fanOn && (!hasProjector || projectorState === 'OFF');
    if (allLoadsOff) {
      if (approvedEvent) {
        return {
          text: 'Event in progress - empty as expected',
          badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
        };
      }
      return {
        text: hasProjector
          ? 'Lights, fans and projector OFF (auto)'
          : 'Lights and fans OFF (auto)',
        badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
      };
    }

    // Counting down
    const targetLightsDelay = approvedEvent ? 5 : lightsDelaySec;
    if (emptySeconds < targetLightsDelay) {
      const remaining = Math.max(1, targetLightsDelay - emptySeconds);
      return {
        text: `Counting down: ${remaining} s`,
        badgeClass: 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
      };
    }

    if (hasProjector && projectorState === 'ON' && emptySeconds < projectorDelaySec) {
      if (approvedEvent) {
        return {
          text: 'Event in progress - empty as expected',
          badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
        };
      }
      const remainingProj = Math.max(1, projectorDelaySec - emptySeconds);
      return {
        text: `Counting down: ${remainingProj} s`,
        badgeClass: 'bg-status-yellow-soft text-status-yellow border-status-yellow/30',
      };
    }

    if (approvedEvent) {
      return {
        text: 'Event in progress - empty as expected',
        badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
      };
    }

    return {
      text: 'Armed',
      badgeClass: 'bg-status-green-soft text-status-green border-status-green/30',
    };
  };

  const statusLine = getStatusLine();

  return (
    <Card className={`border border-hairline shadow-2xs ${className}`}>
      <CardHeader className="pb-3 border-b border-hairline">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <CardTitle className="text-[17px]">Autonomous Setback & Load Relays</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded border border-hairline">
              Relay not connected
            </span>
          </div>
        </div>
        <CardDescription className="text-[12px]">
          Simulated load relays and empty-room setback automation.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Autonomous Setback Switch & Status Line */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <span className="font-semibold text-ink text-[13px] block">
                Autonomous setback
              </span>
              <span className="text-[11px] text-muted block">
                Switches loads off when room is confirmed empty by fresh sensors.
              </span>
            </div>
            <Switch checked={isAutonomyEnabled} onChange={setIsAutonomyEnabled} />
          </div>

          {/* Status Line */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-hairline flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono text-muted">Status:</span>
              <span
                className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-[6px] border ${statusLine.badgeClass}`}
              >
                {statusLine.text}
              </span>
            </div>

            {isManualPaused && (
              <button
                type="button"
                onClick={() => setManualOverrideUntil(null)}
                className="text-[11px] font-mono text-accent hover:underline cursor-pointer"
              >
                Resume autonomy
              </button>
            )}

            <div className="text-[11px] font-mono text-muted">
              {isRoomEmpty ? (
                <span className="text-ink font-semibold">
                  Empty for: {emptySeconds} s
                </span>
              ) : (
                <span>Occupied ({headcount} people)</span>
              )}
            </div>
          </div>

          {/* Rules in Plain Words Collapsible */}
          <details className="pt-1 group text-[12px]">
            <summary className="cursor-pointer text-[12px] font-medium text-accent hover:underline flex items-center gap-1 select-none">
              <span>Rules in plain words</span>
              <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 p-2.5 rounded-[6px] bg-surface border border-hairline/80 text-[12px] text-muted leading-relaxed">
              Lights, fans and projector switch off only when the room is confirmed empty
              by fresh sensor data. Events can explain an empty room but never force anything
              off. If people return, lights and fans come back on.
            </div>
          </details>
        </div>

        {/* Load 1: Lights */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-[6px] border flex items-center justify-center shrink-0 ${
                lightsOn
                  ? 'bg-status-yellow-soft border-status-yellow/30 text-status-yellow'
                  : 'bg-surface border-hairline text-muted'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink text-[13px] leading-tight">
                  High-Bay Lighting Relays
                </span>
                <SourceBadge source="SIMULATED" size="sm" />
              </div>
              <span className="font-mono text-[11px] text-muted block mt-0.5">
                Relay not connected · {lightsOn ? 'Active (ON)' : 'Setback (OFF)'}
              </span>
            </div>
          </div>

          <Switch checked={lightsOn} onChange={handleManualLightsChange} />
        </div>

        {/* Load 2: Fans */}
        <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-[6px] border flex items-center justify-center shrink-0 ${
                fanOn
                  ? 'bg-accent-soft border-accent/30 text-accent'
                  : 'bg-surface border-hairline text-muted'
              }`}
            >
              <Fan className={`w-4 h-4 ${fanOn ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink text-[13px] leading-tight">
                  HVAC Fan Coil Ventilation
                </span>
                <SourceBadge source="SIMULATED" size="sm" />
              </div>
              <span className="font-mono text-[11px] text-muted block mt-0.5">
                Relay not connected · {fanOn ? 'Active (ON)' : 'Setback (OFF)'}
              </span>
            </div>
          </div>

          <Switch checked={fanOn} onChange={handleManualFanChange} />
        </div>

        {/* Projector Section */}
        <div className="space-y-2">
          {/* Editable toggle: "This room has a projector" */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-medium text-ink">
              This room has a projector
            </span>
            <Switch
              checked={hasProjector}
              onChange={(checked) => {
                setHasProjector(checked);
                if (!checked) {
                  setProjectorState('OFF');
                }
              }}
            />
          </div>

          {/* Load 3: Projector Row (Shown only if hasProjector is true) */}
          {hasProjector && (
            <div className="p-3.5 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-[6px] border flex items-center justify-center shrink-0 ${
                    projectorState === 'ON'
                      ? 'bg-accent-soft border-accent/30 text-accent'
                      : projectorState === 'COOLING_DOWN'
                      ? 'bg-status-orange-soft border-status-orange/30 text-status-orange'
                      : 'bg-surface border-hairline text-muted'
                  }`}
                >
                  <Video
                    className={`w-4 h-4 ${
                      projectorState === 'COOLING_DOWN' ? 'animate-pulse' : ''
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink text-[13px] leading-tight">
                      Digital Multimedia Projector
                    </span>
                    <SourceBadge source="SIMULATED" size="sm" />
                  </div>
                  <span className="font-mono text-[11px] text-muted block mt-0.5">
                    Relay not connected ·{' '}
                    {projectorState === 'COOLING_DOWN'
                      ? `Cooling down (${cooldownSeconds} s)`
                      : projectorState === 'ON'
                      ? 'Active (ON)'
                      : 'Standby (OFF)'}
                  </span>
                </div>
              </div>

              <Switch
                checked={projectorState === 'ON' || projectorState === 'COOLING_DOWN'}
                disabled={projectorState === 'COOLING_DOWN'}
                onChange={handleManualProjectorChange}
              />
            </div>
          )}
        </div>

        {/* Editable Delays Configuration Collapsible */}
        <div className="border-t border-hairline pt-3">
          <button
            type="button"
            onClick={() => setIsDelaysOpen(!isDelaysOpen)}
            className="w-full flex items-center justify-between text-[12px] font-mono text-muted hover:text-ink cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sliders className="w-3.5 h-3.5" />
              Autonomous Delays Configuration
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isDelaysOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDelaysOpen && (
            <div className="mt-3 p-3.5 rounded-[8px] bg-surface-2 border border-hairline space-y-3">
              {/* Lights & Fans Delay */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-ink">
                    Lights and fans empty delay (seconds)
                  </label>
                  <span className="font-mono text-[12px] text-accent font-bold">
                    {lightsDelaySec} s
                  </span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={lightsDelaySec}
                  onChange={(e) => {
                    const val = Math.min(600, Math.max(5, parseInt(e.target.value, 10) || 5));
                    setLightsDelaySec(val);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-[6px] bg-surface border border-hairline text-[12px] font-mono text-ink focus:outline-none focus:border-accent"
                />
                <span className="text-[11px] text-muted block">
                  use 120 s or more in real use (Range: 5 to 600 s)
                </span>
              </div>

              {/* Projector Delay */}
              {hasProjector && (
                <div className="space-y-1 pt-2 border-t border-hairline">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-ink">
                      Projector empty delay (seconds)
                    </label>
                    <span className="font-mono text-[12px] text-accent font-bold">
                      {projectorDelaySec} s
                    </span>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={projectorDelaySec}
                    onChange={(e) => {
                      const val = Math.min(600, Math.max(5, parseInt(e.target.value, 10) || 5));
                      setProjectorDelaySec(val);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[6px] bg-surface border border-hairline text-[12px] font-mono text-ink focus:outline-none focus:border-accent"
                  />
                  <span className="text-[11px] text-muted block">
                    projectors need a cool-down; real use needs longer (Includes 10 s cooling down)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty Duration & Policy Callout */}
        <div className="p-2.5 rounded-[6px] bg-surface border border-hairline/80 flex items-start gap-2 text-[11px] text-muted leading-relaxed">
          <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Simulated relays:</strong> Relay controls are local prototypes (Relay not
            connected). Autonomy runs entirely client-side against displayed sensor inferences.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
