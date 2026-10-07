import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Building2, BellRing, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { PriorityPill } from './PriorityPill';
import { StatusBadge } from './StatusBadge';

interface CommandPaletteProps {
  onNavigate: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, rooms, alerts } = useCampus();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  const filteredRooms = useMemo(() => {
    if (!query.trim()) return rooms.slice(0, 4);
    const q = query.toLowerCase();
    return rooms.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q) ||
        (r.currentClass && r.currentClass.toLowerCase().includes(q))
    );
  }, [query, rooms]);

  const filteredAlerts = useMemo(() => {
    if (!query.trim()) return alerts.slice(0, 3);
    const q = query.toLowerCase();
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q) ||
        a.roomId.toLowerCase().includes(q) ||
        a.priority.toLowerCase().includes(q)
    );
  }, [query, alerts]);

  if (!isCommandPaletteOpen) return null;

  const handleSelectRoom = (roomId: string) => {
    setIsCommandPaletteOpen(false);
    onNavigate(`/rooms/${roomId}`);
  };

  const handleSelectAlert = (alertId: string) => {
    setIsCommandPaletteOpen(false);
    onNavigate('/alerts');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-hairline rounded-[12px] [box-shadow:var(--shadow-popover)] overflow-hidden flex flex-col text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline bg-surface">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus rooms, active alerts, departments (e.g. 204, AI, emergency)..."
            className="flex-1 bg-transparent border-none text-[14px] text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-muted bg-surface-2 px-1.5 py-0.5 rounded-[4px] border border-hairline">
            ESC
          </kbd>
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-muted hover:text-ink p-1 rounded-[4px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 divide-y divide-hairline">
          {/* Rooms Section */}
          <div className="space-y-1.5 pt-1 first:pt-0">
            <div className="flex items-center justify-between px-2 text-[11px] font-mono uppercase text-muted tracking-wider">
              <span>Rooms & Facilities</span>
              <span>{filteredRooms.length} available</span>
            </div>

            {filteredRooms.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-muted italic">
                No matching rooms found for "{query}".
              </p>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleSelectRoom(room.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-surface-2 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-muted group-hover:text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[14px] font-semibold text-ink">
                          Room {room.number}
                        </span>
                        <span className="text-[12px] text-muted truncate">
                          · {room.block} ({room.floor})
                        </span>
                      </div>
                      <div className="text-[12px] text-muted truncate">
                        {room.currentClass
                          ? `${room.currentClass} (${room.section})`
                          : 'Unscheduled / Vacant'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={room.status} size="sm" />
                    <span className="font-mono text-[11px] text-muted">
                      {room.observedHeadcount}/{room.capacity}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Alerts Section */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center justify-between px-2 text-[11px] font-mono uppercase text-muted tracking-wider">
              <span>Active Alerts & Discrepancies</span>
              <span>{filteredAlerts.length} items</span>
            </div>

            {filteredAlerts.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-muted italic">
                No alerts match query.
              </p>
            ) : (
              filteredAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => handleSelectAlert(alert.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-surface-2 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-center shrink-0">
                      <BellRing className="w-4 h-4 text-status-orange" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink truncate">
                          {alert.title}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted truncate font-mono">
                        {alert.roomName} · {alert.timestamp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityPill priority={alert.priority} size="sm" />
                    <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-surface-2 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-muted">
          <span>Navigate with click or arrow keys</span>
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-hairline text-ink">
              ↵ Enter
            </kbd>
            <span>to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};
