import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  PhoneCall,
  Clock,
  Compass,
  CheckCircle2,
  Send,
  Building2,
  User,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { PriorityPill } from '../components/ui/PriorityPill';
import { SourceBadge } from '../components/ui/SourceBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface EmergencyPageProps {
  onNavigate: (path: string) => void;
}

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ onNavigate }) => {
  const { currentUser, createEmergency, alerts, loading } = useCampus();
  const [incidentType, setIncidentType] = useState<'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD'>('PERIMETER');
  const [locationRoom, setLocationRoom] = useState('room-lab-ai-01');
  const [detailNotes, setDetailNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={240} height={28} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton variant="rect" height={260} />
          <Skeleton variant="rect" height={260} />
        </div>
      </div>
    );
  }

  const redAlerts = alerts.filter((a) => a.priority === 'RED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createEmergency({
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        locationRoomId: locationRoom,
        locationDetail: locationRoom === 'room-lab-ai-01' ? 'AI & Robotics Hub 01' : 'Room 204',
        type: incidentType,
        notes: detailNotes || 'Automated urgent dispatch assistance requested by campus operator.',
      });
      setSubmissionFeedback(`Emergency ID [${res.id}] generated and transmitted to central dispatch.`);
      setDetailNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-status-red font-semibold">
              Emergency & Life-Safety Network
            </span>
            <SourceBadge source="LIVE" size="sm" />
            <span className="text-[11px] font-mono text-muted">demo data</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Campus Safety & Emergency Dispatch
          </h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Rapid security routing and perimeter alarm reconciliation for students, faculty, and facility staff.
          </p>
        </div>

        {/* Hotlines */}
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-[8px] bg-status-red-soft border border-status-red/30 flex items-center gap-2 text-status-red font-mono text-[13px] font-semibold">
            <PhoneCall className="w-4 h-4" />
            <span>Campus Control: ext. 4444</span>
          </div>
        </div>
      </div>

      {submissionFeedback && (
        <div className="p-4 rounded-[8px] bg-status-red-soft border border-status-red/30 text-status-red font-mono text-[13px] flex items-center justify-between">
          <span>{submissionFeedback}</span>
          <button
            type="button"
            onClick={() => setSubmissionFeedback(null)}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 2-Column Layout: Active RED Alarms + Rapid Dispatch Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Red Dispatches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-ink flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-status-red" />
              <span>Active Critical Incidents ({redAlerts.length})</span>
            </h2>
            <PriorityPill priority="RED" size="sm" />
          </div>

          {redAlerts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6 text-status-green" />}
              title="All Egress & Safety Systems Secure"
              explanation="No active perimeter alarms or emergency dispatch tickets are open."
            />
          ) : (
            redAlerts.map((a) => (
              <Card key={a.id} className="border-l-4 border-l-status-red">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[14px] font-bold text-ink">
                      {a.roomName}
                    </span>
                    <SourceBadge source={a.source} size="sm" />
                  </div>
                  <CardTitle className="text-[16px] text-status-red">
                    {a.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[13px]">
                  <p className="text-muted leading-relaxed">{a.description}</p>
                  <div className="p-2.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[12px] space-y-1">
                    <div>Expected: {a.expectedState}</div>
                    <div className="text-status-red font-semibold">Observed: {a.observedState}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-hairline text-[11px] font-mono text-muted">
                    <span>Timestamp: {a.timestamp}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => alert(`Dispatch unit confirmed for ${a.roomName}`)}
                    >
                      Verify Patrol Unit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rapid Dispatch Submission */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Rapid Safety Dispatch Request</CardTitle>
              <CardDescription>
                Submits an immediate priority alert to campus security and the designated building warden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
                {/* Requester Profile */}
                <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted" />
                    <span className="font-medium text-ink">{currentUser.name}</span>
                  </div>
                  <span className="font-mono text-[11px] uppercase bg-surface px-2 py-0.5 rounded border border-hairline text-muted">
                    {currentUser.role}
                  </span>
                </div>

                {/* Incident Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted block">
                    Incident Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'PERIMETER', label: 'Perimeter / Door Alarm' },
                      { key: 'MEDICAL', label: 'Medical Assistance' },
                      { key: 'FIRE_HAZARD', label: 'Fire / Smoke Trigger' },
                      { key: 'INFRASTRUCTURE', label: 'Electrical / Hazard' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setIncidentType(t.key as any)}
                        className={`p-2.5 rounded-[6px] border text-left font-mono text-[12px] transition-colors cursor-pointer ${
                          incidentType === t.key
                            ? 'bg-accent-soft text-accent border-accent/40 font-semibold'
                            : 'bg-surface-2 text-ink border-hairline hover:bg-surface'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Location */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted block">
                    Location Space
                  </label>
                  <select
                    value={locationRoom}
                    onChange={(e) => setLocationRoom(e.target.value)}
                    className="w-full p-2.5 rounded-[8px] bg-surface-2 border border-hairline text-ink font-mono text-[13px] focus:outline-none"
                  >
                    <option value="room-lab-ai-01">LAB-AI-01 (CSE Block Ground)</option>
                    <option value="room-204">Room 204 (CSE Block Level 2)</option>
                    <option value="room-102">Room 102 (Main Block Level 1)</option>
                    <option value="room-101">Room 101 (Main Block Level 1)</option>
                  </select>
                </div>

                {/* Description Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted block">
                    Operational Notes / Incident Observation
                  </label>
                  <textarea
                    rows={3}
                    value={detailNotes}
                    onChange={(e) => setDetailNotes(e.target.value)}
                    placeholder="Describe specific observable conditions..."
                    className="w-full p-2.5 rounded-[8px] bg-surface-2 border border-hairline text-ink placeholder:text-muted focus:outline-none"
                  />
                </div>

                <Button
                  variant="danger"
                  size="md"
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Transmit Critical Alert to Dispatch
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
