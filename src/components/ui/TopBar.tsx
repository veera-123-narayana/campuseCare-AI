import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Radio,
  CheckCircle2,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { ThemeToggle } from './ThemeToggle';
import { PriorityPill } from './PriorityPill';
import { formatTime } from '../../utils/formatTime';
import { NOTICEBOARD_URL } from '../../constants';

export interface TopBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPath,
  onNavigate,
  className = '',
}) => {
  const {
    dataMode,
    toggleDataMode,
    isDevMode,
    connectionStatus,
    reconnectConnection,
    activeAlertCount,
    alerts,
    setIsCommandPaletteOpen,
  } = useCampus();

  const [timeString, setTimeString] = useState<string>('10:18:22');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format breadcrumbs dynamically from currentPath
  const getBreadcrumbs = () => {
    if (currentPath === '/') return ['CAMPUSCARE', 'Overview'];
    if (currentPath === '/rooms') return ['CAMPUSCARE', 'Rooms & Facilities'];
    if (currentPath.startsWith('/rooms/')) {
      const id = currentPath.split('/')[2];
      return ['CAMPUSCARE', 'Rooms', `Space: ${id.replace('room-', '').toUpperCase()}`];
    }
    if (currentPath === '/alerts') return ['CAMPUSCARE', 'Operational Alerts Queue'];
    if (currentPath === '/assistant') return ['CAMPUSCARE', 'Campus Assistant'];
    if (currentPath === '/emergency') return ['CAMPUSCARE', 'Safety & Emergency Dispatch'];
    if (currentPath === '/sustainability') return ['CAMPUSCARE', 'UN SDG 11 Sustainability'];
    if (currentPath === '/demo') return ['CAMPUSCARE', 'Demo Control & Scenarios'];
    if (currentPath === '/design') return ['CAMPUSCARE', 'Design System Specimen'];
    return ['CAMPUSCARE', 'Console'];
  };

  const breadcrumbs = getBreadcrumbs();
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  return (
    <header
      className={`h-14 px-6 bg-surface border-b border-hairline flex items-center justify-between select-none shrink-0 relative z-20 ${className}`}
    >
      {/* Breadcrumb on the left */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] min-w-0">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <span className="text-muted/60">/</span>}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-ink truncate'
                  : 'text-muted font-medium truncate'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right Controls: Global Search, Notification Bell, Data Mode Indicator, Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Global Search trigger (Cmd/Ctrl + K) */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-surface-2 border border-hairline hover:border-muted/50 text-muted hover:text-ink text-[13px] transition-colors cursor-pointer"
          title="Search rooms and alerts (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[12px]">Search campus...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-hairline text-ink">
            ⌘K
          </kbd>
        </button>

        {/* Noticeboard Button */}
        <a
          href={NOTICEBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center font-medium transition-colors select-none text-[13px] leading-none rounded-[8px] border border-hairline bg-surface-2 text-ink hover:bg-surface hover:border-muted/40 h-8 px-2.5 sm:px-3 gap-1.5 cursor-pointer"
          title="Open Noticeboard (new tab)"
        >
          <span className="hidden sm:inline">Noticeboard</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted shrink-0" />
        </a>

        {/* Data Mode Indicator (Non-interactive indicator; hidden dev toggle behind ?dev=1) */}
        <div
          title={
            dataMode === 'PI CONNECTED'
              ? 'Real hardware telemetry stream active (verified reading in last 60s).'
              : 'Simulation data mode active.'
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-[11px] font-mono uppercase font-semibold select-none ${
            dataMode === 'PI CONNECTED'
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-transparent text-muted border-dashed border-hairline'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dataMode === 'PI CONNECTED' ? 'bg-accent animate-pulse' : 'bg-muted'
            }`}
          />
          <span>{dataMode === 'PI CONNECTED' ? 'PI CONNECTED' : 'SIMULATION'}</span>

          {isDevMode && (
            <button
              type="button"
              onClick={toggleDataMode}
              title="Dev-only manual toggle (?dev=1)"
              className="ml-1 px-1.5 py-0.5 rounded bg-surface border border-accent/40 text-accent text-[9px] hover:bg-accent hover:text-white cursor-pointer"
            >
              Toggle
            </button>
          )}
        </div>

        {/* Backend Connection Indicator (Connected / Reconnecting / Offline) */}
        <button
          type="button"
          onClick={reconnectConnection}
          title={
            connectionStatus === 'Connected'
              ? 'Realtime Telemetry Stream: Connected'
              : connectionStatus === 'Reconnecting'
              ? 'Attempting reconnection to campus event gateway...'
              : 'Gateway Offline: Click to retry connection (last known telemetry cached)'
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-[11px] font-mono uppercase font-semibold transition-colors cursor-pointer select-none ${
            connectionStatus === 'Connected'
              ? 'bg-status-green-soft text-status-green border-status-green/30'
              : connectionStatus === 'Reconnecting'
              ? 'bg-status-yellow-soft text-status-yellow border-status-yellow/30'
              : 'bg-status-red-soft text-status-red border-status-red/30'
          }`}
        >
          {connectionStatus === 'Connected' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
              <span>Connected</span>
            </>
          )}
          {connectionStatus === 'Reconnecting' && (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-status-yellow" />
              <span>Reconnecting</span>
            </>
          )}
          {connectionStatus === 'Offline' && (
            <>
              <WifiOff className="w-3 h-3 text-status-red" />
              <span>Offline (Cached)</span>
            </>
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[12px] text-ink bg-surface-2 px-2.5 py-1 rounded-[6px] border border-hairline tabular-nums">
          <span className="text-muted text-[10px]">TIME</span>
          <span>{timeString}</span>
        </div>

        {/* Notification Bell with Count */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-[8px] bg-surface-2 border border-hairline text-ink hover:bg-surface hover:border-muted/50 transition-colors cursor-pointer"
            title="Operational Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-ink" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-status-orange text-white text-[10px] font-mono font-bold flex items-center justify-center leading-none">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-hairline rounded-[12px] [box-shadow:var(--shadow-popover)] overflow-hidden z-50">
              <div className="p-3 border-b border-hairline flex items-center justify-between bg-surface-2">
                <span className="text-[12px] font-mono font-semibold uppercase text-ink">
                  Active Alerts ({activeAlerts.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-muted hover:text-ink cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-hairline">
                {activeAlerts.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-muted italic">
                    All campus spaces operating nominally.
                  </div>
                ) : (
                  activeAlerts.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onNavigate('/alerts');
                      }}
                      className="p-3 hover:bg-surface-2 transition-colors cursor-pointer text-left space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] font-semibold text-ink">
                          {a.roomName}
                        </span>
                        <PriorityPill priority={a.priority} size="sm" />
                      </div>
                      <p className="text-[12px] text-muted line-clamp-1">{a.title}</p>
                      <span className="text-[10px] font-mono text-muted block">
                        {formatTime(a.timestamp)} · {a.energyImpactKw > 0 ? `+${a.energyImpactKw} kW` : 'No load'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-hairline bg-surface-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate('/alerts');
                  }}
                  className="text-[12px] font-mono text-accent hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View Operational Alerts Queue
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
