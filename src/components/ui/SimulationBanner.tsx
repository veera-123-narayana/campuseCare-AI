import React from 'react';
import { SlidersHorizontal, RotateCcw, X, Radio, ArrowRight } from 'lucide-react';
import { useCampus } from '../../context/CampusContext';

interface SimulationBannerProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({ onNavigate, currentPath }) => {
  const {
    isSimulationMode,
    setSimulationMode,
    activeScenarioId,
    runScenario,
  } = useCampus();

  if (!isSimulationMode) {
    return null;
  }

  return (
    <div className="w-full bg-status-orange-soft/40 border-b border-status-orange/30 text-ink px-4 py-1.5 flex items-center justify-between text-[12px] transition-all z-40 select-none shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 font-mono font-bold tracking-wider uppercase text-[11px] text-status-orange shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-orange opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-orange"></span>
          </span>
          SIMULATION MODE
        </div>

        <span className="text-hairline shrink-0 hidden sm:inline">|</span>

        <p className="truncate text-[12px] text-muted">
          Edge telemetry running synthetic scenarios for expo demonstration
          {activeScenarioId && (
            <span className="font-mono text-ink ml-1.5 font-medium hidden md:inline">
              (Active: <span className="text-status-orange">{activeScenarioId}</span>)
            </span>
          )}
        </p>

        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-muted/80 bg-surface px-1.5 py-0.5 rounded border border-hairline">
          Press <kbd className="font-mono font-bold text-ink">1</kbd>–<kbd className="font-mono font-bold text-ink">9</kbd> anywhere for scenarios
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {currentPath !== '/demo' && (
          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="flex items-center gap-1 text-[11px] font-mono font-medium text-ink bg-surface hover:bg-surface-2 px-2 py-1 rounded-[5px] border border-hairline cursor-pointer transition-colors shadow-2xs"
          >
            <SlidersHorizontal className="w-3 h-3 text-status-orange" />
            <span className="hidden sm:inline">Presenter Console</span>
            <span className="sm:hidden">Console</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => runScenario('baseline')}
          title="Reset all rooms and alerts to baseline state"
          className="flex items-center gap-1 text-[11px] font-mono font-medium text-muted hover:text-ink bg-surface hover:bg-surface-2 px-2 py-1 rounded-[5px] border border-hairline cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Baseline</span>
        </button>

        <button
          type="button"
          onClick={() => setSimulationMode(false)}
          title="Dismiss simulation mode banner"
          className="text-muted hover:text-ink p-1 rounded hover:bg-surface transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span className="sr-only">Exit Simulation Mode</span>
        </button>
      </div>
    </div>
  );
};
