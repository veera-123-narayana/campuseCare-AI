import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export const DoDontPanel: React.FC = () => {
  const dos = [
    {
      title: 'Explicit Data Provenance Badges',
      desc: 'Always display a visible LIVE, PI, or SIMULATED pill alongside every numerical measurement. Never present mathematical models as direct sensor telemetry.',
      example: 'Example: "42.8 kW [LIVE]" or "54.2 kWh [SIMULATED]"',
    },
    {
      title: 'Neutral Operational Phrasing',
      desc: 'Describe discrepancies purely as observed sensor states vs timetable records. Maintain absolute non-accusatory institutional tone.',
      example: 'Write: "Classroom activity not confirmed" (instead of "Faculty absent").',
    },
    {
      title: 'Calm Control Room Discipline',
      desc: 'Use 1px hairline borders, single teal accent, Inter Tight UI typography, and JetBrains Mono tabular figures with an 8px spatial grid.',
      example: 'Surface separation via #E7E4DC hairline in light, #26292E in dark.',
    },
  ];

  const donts = [
    {
      title: 'No AI Slop / Neon Glows / Glassmorphism',
      desc: 'Strictly ban cyan glows, blurry frosted-glass panels, decorative background blobs, 3D floating geometries, and animated gradient rings.',
      example: 'Avoid: Backdrop blur overlays, glowing neon card outlines.',
    },
    {
      title: 'No Accusatory Personal Copy',
      desc: 'Never assign personal blame to faculty, students, or staff when sensor telemetry indicates unexpected room states.',
      example: 'Never write: "Instructor skipped class" or "Students wasting energy".',
    },
    {
      title: 'No Uncontrolled Color Palette or Emojis',
      desc: 'Never introduce multiple competing accent colors or emojis as system icons. Use Lucide icons exclusively and semantic statuses solely for events.',
      example: 'Avoid: Multi-color gradient buttons, emoji warning symbols.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Guidelines: Do & Don't</CardTitle>
        <CardDescription>
          Design constitution ensuring CAMPUSCARE maintains professional operational authority for UN SDG 11.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DO Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-hairline text-status-green">
              <div className="w-5 h-5 rounded-full bg-status-green-soft flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-status-green" />
              </div>
              <h4 className="text-[14px] font-semibold uppercase tracking-wider text-ink">
                Mandatory Practices (DO)
              </h4>
            </div>

            <div className="space-y-3">
              {dos.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-[8px] border border-status-green/30 bg-surface-2 p-4 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-status-green">
                      0{idx + 1}
                    </span>
                    <h5 className="text-[14px] font-semibold text-ink">
                      {item.title}
                    </h5>
                  </div>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="pt-2 text-[12px] font-mono text-status-green bg-status-green-soft/60 px-2.5 py-1 rounded-[6px] border border-status-green/20">
                    {item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DONT Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-hairline text-status-red">
              <div className="w-5 h-5 rounded-full bg-status-red-soft flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-status-red" />
              </div>
              <h4 className="text-[14px] font-semibold uppercase tracking-wider text-ink">
                Banned Patterns (DON'T)
              </h4>
            </div>

            <div className="space-y-3">
              {donts.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-[8px] border border-status-red/30 bg-surface-2 p-4 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-status-red">
                      0{idx + 1}
                    </span>
                    <h5 className="text-[14px] font-semibold text-ink">
                      {item.title}
                    </h5>
                  </div>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="pt-2 text-[12px] font-mono text-status-red bg-status-red-soft/60 px-2.5 py-1 rounded-[6px] border border-status-red/20">
                    {item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
