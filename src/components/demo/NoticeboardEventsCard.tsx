import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Plus, Trash2, Info, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { SourceBadge } from '../ui/SourceBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { NOTICEBOARD_URL } from '../../constants';
import { useCampus } from '../../context/CampusContext';
import { NoticeboardEventItem } from '../../types/noticeboard';

function getEventStatus(date: string, startTime: string, endTime: string): 'Upcoming' | 'In progress' | 'Ended' {
  try {
    const now = new Date();
    // Parse Date and Time
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return 'Upcoming';

    const [startH, startM] = (startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (endTime || '23:59').split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, startH || 0, startM || 0, 0);
    const endDateTime = new Date(year, month - 1, day, endH || 0, endM || 0, 0);

    if (now < startDateTime) {
      return 'Upcoming';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'In progress';
    } else {
      return 'Ended';
    }
  } catch {
    return 'Upcoming';
  }
}

export const NoticeboardEventsCard: React.FC = () => {
  const {
    rooms,
    noticeboardEvents,
    addNoticeboardEvent,
    removeNoticeboardEvent,
    toggleNoticeboardEventApproval,
  } = useCampus();

  // Periodic re-evaluation to keep status pills accurate
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [affectedRooms, setAffectedRooms] = useState<string[]>(['room-204']);
  const [note, setNote] = useState('');
  const [formApproved, setFormApproved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roomOptions = rooms.length > 0 ? rooms : [
    { id: 'room-204', number: '204', name: 'Lecture Hall 204' },
    { id: 'room-102', number: '102', name: 'Seminar Hall 102' },
    { id: 'room-301', number: '301', name: 'Tutorial Room 301' },
    { id: 'lab-ai-01', number: 'AI-01', name: 'AI Research Lab' },
  ];

  const handleToggleRoom = (roomId: string) => {
    setAffectedRooms((prev) => {
      if (prev.includes(roomId)) {
        if (prev.length === 1) return prev; // Keep at least one room
        return prev.filter((r) => r !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an event title');
      return;
    }
    if (affectedRooms.length === 0) {
      setErrorMsg('Please select at least one affected room');
      return;
    }

    setErrorMsg(null);
    addNoticeboardEvent({
      title: title.trim(),
      date,
      startTime,
      endTime,
      affectedRooms,
      note: note.trim(),
      approved: formApproved,
    });

    // Reset fields to sensible defaults
    setTitle('');
    setNote('');
  };

  return (
    <Card className="border border-hairline shadow-2xs">
      <CardHeader className="pb-4 border-b border-hairline">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <CardTitle className="text-[16px]">Events from Noticeboard (simulated)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source="SIMULATED" size="sm" />
            <a
              href={NOTICEBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-mono text-accent hover:underline border border-hairline px-2.5 py-1 rounded-[6px] bg-surface-2 hover:bg-surface transition-colors"
            >
              <span>Open Noticeboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <CardDescription className="text-[12px]">
          Simulated institutional schedule notices and auditorium events. Events explain an empty room. They never force anything off. Sensors always win.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Event Form */}
        <form onSubmit={handleAddEvent} className="p-4 rounded-[8px] bg-surface-2 border border-hairline space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-hairline">
            <span className="text-[13px] font-semibold text-ink">Add Simulated Noticeboard Event</span>
            <span className="text-[11px] font-mono text-muted">React state only · No network calls</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Title */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[12px] font-medium text-ink block">
                Event Title <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guest Lecture / Faculty Symposium"
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface border border-hairline text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink block">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-[6px] bg-surface border border-hairline text-[13px] text-ink focus:outline-none focus:border-accent font-mono"
              />
            </div>

            {/* Time Slot (Start & End) */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink block">
                Time Window
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-[6px] bg-surface border border-hairline text-[12px] text-ink focus:outline-none focus:border-accent font-mono"
                />
                <span className="text-muted text-[12px]">–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-[6px] bg-surface border border-hairline text-[12px] text-ink focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>
          </div>

          {/* Affected Rooms Multi-Select */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink block">
              Affected Rooms
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {roomOptions.map((r) => {
                const isSelected = affectedRooms.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleToggleRoom(r.id)}
                    className={`px-2.5 py-1 rounded-[6px] text-[12px] font-mono border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-accent-soft text-accent border-accent/40 font-semibold'
                        : 'bg-surface text-muted border-hairline hover:text-ink'
                    }`}
                  >
                    {r.number ? `LH-${r.number}` : r.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-ink block">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Relocated to Central Auditorium"
              className="w-full px-3 py-1.5 rounded-[6px] bg-surface border border-hairline text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {/* Switch & Submit Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-hairline">
            <Switch
              checked={formApproved}
              onChange={setFormApproved}
              label="Event approved by a person"
              description="An event only affects setback and grace rules when approved."
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Add event
            </Button>
          </div>

          {errorMsg && (
            <p className="text-[12px] text-status-red font-mono">{errorMsg}</p>
          )}
        </form>

        {/* Informative Guidance Callout */}
        <div className="p-3 rounded-[6px] bg-surface border border-hairline/80 flex items-start gap-2.5 text-[12px] text-muted leading-relaxed">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Policy note:</strong> Events explain an empty room. They never force anything off. Sensors always win. If occupants or motion are detected in the room during an active event, all loads switch back on immediately.
          </span>
        </div>

        {/* List of Added Events */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">
              Registered Noticeboard Events ({noticeboardEvents.length})
            </span>
            <span className="text-[11px] font-mono text-muted">
              Computed against current system time
            </span>
          </div>

          {noticeboardEvents.length === 0 ? (
            <div className="p-6 rounded-[8px] border border-dashed border-hairline text-center text-muted text-[13px]">
              No noticeboard events currently registered. Fill out the form above to simulate one.
            </div>
          ) : (
            <div className="space-y-3">
              {noticeboardEvents.map((evt) => {
                const status = getEventStatus(evt.date, evt.startTime, evt.endTime);
                const statusClass =
                  status === 'In progress'
                    ? 'bg-status-green-soft text-status-green border-status-green/30'
                    : status === 'Upcoming'
                    ? 'bg-status-yellow-soft text-status-yellow border-status-yellow/30'
                    : 'bg-surface-2 text-muted border-hairline';

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-[8px] bg-surface border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink text-[14px]">
                          {evt.title}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusClass}`}
                        >
                          {status}
                        </span>
                        <SourceBadge source="SIMULATED" size="sm" />
                      </div>

                      <div className="flex items-center gap-3 text-[12px] text-muted flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {evt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {evt.startTime} – {evt.endTime}
                        </span>
                        <span>
                          Rooms: {evt.affectedRooms.map((r) => r.replace('room-', 'LH-')).join(', ')}
                        </span>
                      </div>

                      {evt.note && (
                        <p className="text-[12px] text-muted italic">
                          Note: {evt.note}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted">
                          Entered by a person. Not read from the noticeboard.
                        </span>
                        <span className="text-hairline">·</span>
                        <a
                          href={NOTICEBOARD_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline"
                        >
                          <span>Open Noticeboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-hairline">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={evt.approved}
                          onChange={(val) => toggleNoticeboardEventApproval(evt.id, val)}
                          label="Event approved by a person"
                        />
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-status-red" />}
                        onClick={() => removeNoticeboardEvent(evt.id)}
                        className="text-status-red hover:bg-status-red-soft"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
