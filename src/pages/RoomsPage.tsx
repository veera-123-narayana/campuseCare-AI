import React, { useState } from 'react';
import {
  Building2,
  Filter,
  Users,
  Zap,
  Activity,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { Room, PriorityLevel } from '../types';
import { PriorityPill } from '../components/ui/PriorityPill';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface RoomsPageProps {
  onNavigate: (path: string) => void;
}

export const RoomsPage: React.FC<RoomsPageProps> = ({ onNavigate }) => {
  const { rooms, loading } = useCampus();
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'CSE Block' | 'Main Block'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={200} height={28} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={220} />
          ))}
        </div>
      </div>
    );
  }

  const filteredRooms = rooms.filter((r) => {
    if (blockFilter !== 'ALL' && r.block !== blockFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Campus Spaces Directory
            </span>
            <SourceBadge source="LIVE" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Rooms & Facility Occupancy Grid
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Real-time telemetry feeds cross-referenced with daily timetable schedule.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Block filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[8px] border border-hairline">
            {(['ALL', 'CSE Block', 'Main Block'] as const).map((block) => (
              <button
                key={block}
                type="button"
                onClick={() => setBlockFilter(block)}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  blockFilter === block
                    ? 'bg-surface text-ink font-semibold border border-hairline shadow-none'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {block === 'ALL' ? 'All Blocks' : block}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-[8px] border border-hairline">
            {(['ALL', 'GREEN', 'YELLOW', 'ORANGE', 'RED'] as const).map((pri) => (
              <button
                key={pri}
                type="button"
                onClick={() => setPriorityFilter(pri)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  priorityFilter === pri
                    ? 'bg-surface text-ink font-semibold border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {pri}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State check */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6 text-accent" />}
          title="No Rooms Match Filter"
          explanation="No campus spaces match the selected block and priority criteria."
          actionText="Clear All Filters"
          onAction={() => {
            setBlockFilter('ALL');
            setPriorityFilter('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const hasDiscrepancy =
              room.expectedOccupancy > 0 && room.observedHeadcount === 0;

            return (
              <div
                key={room.id}
                onClick={() => onNavigate(`/rooms/${room.id}`)}
                className="rounded-[12px] border border-hairline bg-surface p-6 flex flex-col justify-between hover:border-muted/50 transition-all cursor-pointer group"
              >
                <div>
                  {/* Top Header: Room number, Block, Priority */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[18px] font-mono font-bold text-ink">
                          Room {room.number}
                        </span>
                        <SourceBadge source={room.source} size="sm" />
                      </div>
                      <span className="text-[12px] text-muted">
                        {room.block} · {room.floor}
                      </span>
                    </div>
                    <PriorityPill priority={room.priority} size="sm" />
                  </div>

                  {/* Class Info Box */}
                  <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline mb-4 text-[13px]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1">
                      Expected Class Timetable
                    </span>
                    {room.currentClass ? (
                      <div>
                        <div className="font-semibold text-ink line-clamp-1">
                          {room.currentClass}
                        </div>
                        <div className="font-mono text-[11px] text-muted flex items-center justify-between mt-1">
                          <span>{room.classCode} · {room.section}</span>
                          <span>{room.classTime}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted italic">Unscheduled / Standby</span>
                    )}
                  </div>

                  {/* Sensor Comparison Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
                    <div className="p-2.5 rounded-[6px] border border-hairline bg-surface-2/60">
                      <span className="text-[10px] font-mono uppercase text-muted block mb-0.5">
                        Headcount
                      </span>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span
                          className={`text-[16px] font-bold ${
                            hasDiscrepancy ? 'text-status-orange' : 'text-ink'
                          }`}
                        >
                          {room.observedHeadcount}
                        </span>
                        <span className="text-muted">/ {room.capacity}</span>
                      </div>
                      <span className="text-[10px] text-muted">
                        Expected: {room.expectedOccupancy}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[6px] border border-hairline bg-surface-2/60">
                      <span className="text-[10px] font-mono uppercase text-muted block mb-0.5">
                        Circuit Load
                      </span>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-[16px] font-bold text-ink">
                          {room.energyKw.toFixed(1)}
                        </span>
                        <span className="text-muted">kW</span>
                      </div>
                      <span className="text-[10px] text-muted">
                        HVAC: {room.hvacStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status & link */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between text-[12px]">
                  <StatusBadge status={room.status} size="sm" />
                  <div className="flex items-center gap-1 font-mono text-accent text-[12px] group-hover:underline">
                    <span>Inspect Space</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
