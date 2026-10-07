import React from 'react';
import { Camera, Sliders, Eye, RefreshCw, Layers } from 'lucide-react';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface CameraFeedCardProps {
  headcount: number;
  onHeadcountChange: (val: number) => void;
  className?: string;
}

export const CameraFeedCard: React.FC<CameraFeedCardProps> = ({
  headcount,
  onHeadcountChange,
  className = '',
}) => {
  // Generate sample bounding box positions based on headcount
  const sampleBoxes = Array.from({ length: Math.min(headcount, 12) }).map((_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    return {
      id: `P-${String(i + 1).padStart(2, '0')}`,
      x: 55 + col * 75 + (row % 2) * 15,
      y: 65 + row * 45,
      w: 42,
      h: 38,
      conf: 91 + (i % 8),
    };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted" />
            <CardTitle className="text-[18px]">Vision Telemetry Node</CardTitle>
          </div>
          <SourceBadge source="SIMULATED" size="sm" />
        </div>
        <CardDescription>
          Edge inference video pipeline running on ceiling-mounted Raspberry Pi 5.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Simulated Camera Video Viewport */}
        <div className="relative rounded-[8px] bg-[#111315] border border-hairline overflow-hidden select-none aspect-[16/10]">
          {/* Architectural Lecture Hall Backdrop */}
          <svg
            viewBox="0 0 380 230"
            className="w-full h-full opacity-90"
            preserveAspectRatio="none"
          >
            {/* Background grid */}
            <defs>
              <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22262B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#111315" />
            <rect width="100%" height="100%" fill="url(#gridPattern)" />

            {/* Front Stage / Projection Screen */}
            <polygon points="120,20 260,20 280,45 100,45" fill="#1C2025" stroke="#2F353E" strokeWidth="1" />
            <text x="190" y="36" textAnchor="middle" fill="#6B7280" fontSize="8" fontFamily="var(--font-mono)">
              LECTURE PODIUM & AV BOARD
            </text>

            {/* Tiered Desk Rows (Lecture Hall Seating) */}
            <path d="M 60,85 L 320,85" stroke="#2B3038" strokeWidth="6" strokeLinecap="round" />
            <path d="M 45,130 L 335,130" stroke="#2B3038" strokeWidth="6" strokeLinecap="round" />
            <path d="M 30,175 L 350,175" stroke="#2B3038" strokeWidth="6" strokeLinecap="round" />

            {/* Seat Stools */}
            {[70, 110, 150, 190, 230, 270, 310].map((x) => (
              <circle key={`s1-${x}`} cx={x} cy={75} r="4" fill="#20242A" stroke="#373D47" strokeWidth="0.8" />
            ))}
            {[55, 95, 135, 175, 215, 255, 295, 325].map((x) => (
              <circle key={`s2-${x}`} cx={x} cy={120} r="4" fill="#20242A" stroke="#373D47" strokeWidth="0.8" />
            ))}

            {/* Render Simulated Bounding Boxes if headcount > 0 */}
            {sampleBoxes.map((box) => (
              <g key={box.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx="3"
                  fill="rgba(45, 212, 191, 0.12)"
                  stroke="#2DD4BF"
                  strokeWidth="1.2"
                  strokeDasharray="2 1"
                />
                <circle cx={box.x + box.w / 2} cy={box.y + box.h / 3} r="5" fill="#2DD4BF" opacity="0.6" />
                <rect
                  x={box.x}
                  y={box.y - 10}
                  width={34}
                  height={10}
                  rx="2"
                  fill="#2DD4BF"
                />
                <text
                  x={box.x + 2}
                  y={box.y - 2}
                  fill="#0E0F11"
                  fontSize="6.5"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  {box.id} {box.conf}%
                </text>
              </g>
            ))}

            {/* When headcount = 0: Render Empty Hall Crosshairs */}
            {headcount === 0 && (
              <g>
                <circle cx="190" cy="115" r="28" fill="none" stroke="#EA580C" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.8" />
                <line x1="150" y1="115" x2="230" y2="115" stroke="#EA580C" strokeWidth="0.8" opacity="0.6" />
                <line x1="190" y1="75" x2="190" y2="155" stroke="#EA580C" strokeWidth="0.8" opacity="0.6" />
                <text
                  x="190"
                  y="120"
                  textAnchor="middle"
                  fill="#F97316"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  NO TARGETS DETECTED
                </text>
                <text
                  x="190"
                  y="132"
                  textAnchor="middle"
                  fill="#8B9098"
                  fontSize="7"
                  fontFamily="var(--font-mono)"
                >
                  CONFIDENCE: 92%
                </text>
              </g>
            )}
          </svg>

          {/* Top Overlays */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90">
            <span className="bg-black/70 px-2 py-0.5 rounded border border-white/10">
              CAM-204 · CEILING VISION
            </span>
            <span className="bg-black/70 text-[#2DD4BF] px-2 py-0.5 rounded border border-dashed border-[#2DD4BF]/40">
              SIMULATED camera node
            </span>
          </div>

          {/* Bottom Overlays */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/80">
            <span className="bg-black/70 px-2 py-0.5 rounded border border-white/10">
              RES: 1280x720 · 15.2 FPS
            </span>
            <span
              className={`px-2 py-0.5 rounded border font-semibold ${
                headcount === 0
                  ? 'bg-status-orange-soft text-status-orange border-status-orange/30'
                  : 'bg-accent-soft text-accent border-accent/30'
              }`}
            >
              BBox: {headcount} {headcount > 12 ? `(${sampleBoxes.length} tracked)` : ''}
            </span>
          </div>
        </div>

        {/* Live Interactive Headcount Slider (0 - 60) */}
        <div className="space-y-2 pt-2 border-t border-hairline">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-muted uppercase text-[11px] tracking-wider">
              Simulated Vision Count:
            </span>
            <span className="font-mono font-bold text-[14px] text-ink">
              {headcount} <span className="text-muted text-[11px] font-normal">/ 60 seats</span>
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={headcount}
            onChange={(e) => onHeadcountChange(Number(e.target.value))}
            className="w-full accent-accent h-1.5 bg-surface-2 rounded-lg cursor-pointer"
          />

          {/* Quick preset chips */}
          <div className="flex items-center justify-between gap-1 pt-1 text-[11px] font-mono">
            {[
              { val: 0, label: '0 (Review)' },
              { val: 8, label: '8 (Late)' },
              { val: 45, label: '45 (Nominal)' },
              { val: 60, label: '60 (Full)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onHeadcountChange(p.val)}
                className={`px-2 py-1 rounded-[6px] border text-[10px] transition-colors cursor-pointer ${
                  headcount === p.val
                    ? 'bg-accent text-white dark:text-bg font-bold border-accent'
                    : 'bg-surface-2 text-ink border-hairline hover:bg-surface'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted leading-tight pt-1">
            * Client-side preview slider dynamically re-evaluates the intelligence decision card.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
