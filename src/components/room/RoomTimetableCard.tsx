import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface TimetableSlot {
  id: string;
  subject: string;
  code: string;
  section: string;
  faculty: string;
  timeSlot: string;
  expectedStudents: number;
  status: 'COMPLETED' | 'ACTIVE' | 'UPCOMING';
}

const lh204Schedule: TimetableSlot[] = [
  {
    id: 't-1',
    subject: 'Discrete Mathematics',
    code: 'CS-204',
    section: 'CSE-A',
    faculty: 'Dr. Ramesh Kumar',
    timeSlot: '08:30 - 09:30',
    expectedStudents: 52,
    status: 'COMPLETED',
  },
  {
    id: 't-2',
    subject: 'Artificial Intelligence',
    code: 'AI-401',
    section: 'CSE-A',
    faculty: 'Dr. Suresh Varma',
    timeSlot: '10:00 - 11:00',
    expectedStudents: 60,
    status: 'ACTIVE',
  },
  {
    id: 't-3',
    subject: 'Neural Networks Practicum',
    code: 'AI-410',
    section: 'CSE-B',
    faculty: 'Dr. Malini Rao',
    timeSlot: '11:30 - 13:00',
    expectedStudents: 45,
    status: 'UPCOMING',
  },
  {
    id: 't-4',
    subject: 'Operating Systems Tutorial',
    code: 'CS-301',
    section: 'CSE-C',
    faculty: 'Prof. Ananya Sen',
    timeSlot: '14:00 - 15:30',
    expectedStudents: 40,
    status: 'UPCOMING',
  },
];

export const RoomTimetableCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <CardTitle className="text-[18px]">Today’s Schedule</CardTitle>
          </div>
          <SourceBadge source="SIMULATED" size="sm" />
        </div>
        <CardDescription>
          Synchronized daily timetable blocks for Lecture Hall 204.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {lh204Schedule.map((slot) => {
            const isActive = slot.status === 'ACTIVE';
            const isCompleted = slot.status === 'COMPLETED';

            return (
              <div
                key={slot.id}
                className={`p-3 rounded-[8px] border text-[13px] transition-colors ${
                  isActive
                    ? 'bg-status-orange-soft/40 border-status-orange/40 ring-1 ring-status-orange/20'
                    : isCompleted
                    ? 'bg-surface-2/60 border-hairline opacity-75'
                    : 'bg-surface-2 border-hairline'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-ink line-clamp-1">
                    {slot.subject}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                      isActive
                        ? 'bg-status-orange-soft text-status-orange border border-status-orange/30'
                        : isCompleted
                        ? 'bg-status-green-soft text-status-green'
                        : 'bg-surface text-muted border border-hairline'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>
                    {slot.code} · {slot.section} ({slot.faculty})
                  </span>
                  <span>{slot.timeSlot}</span>
                </div>

                <div className="text-[11px] font-mono text-muted pt-1 mt-1 border-t border-hairline/60 flex items-center justify-between">
                  <span>Expected: {slot.expectedStudents} students</span>
                  {isActive && (
                    <span className="text-status-orange font-semibold">
                      Current Window
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
