import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface TokenItem {
  name: string;
  variable: string;
  lightHex: string;
  darkHex: string;
  role: string;
}

const colorTokens: TokenItem[] = [
  {
    name: 'Background (bg)',
    variable: '--bg',
    lightHex: '#F6F4EF',
    darkHex: '#0E0F11',
    role: 'Application backdrop, warm light editorial parchment and deep control dark.',
  },
  {
    name: 'Surface',
    variable: '--surface',
    lightHex: '#FFFFFF',
    darkHex: '#16181B',
    role: 'Cards, primary containers, panels, and data tables.',
  },
  {
    name: 'Surface 2',
    variable: '--surface-2',
    lightHex: '#FBFAF7',
    darkHex: '#1B1E22',
    role: 'Secondary wells, table headers, segmented controls, inputs.',
  },
  {
    name: 'Ink',
    variable: '--ink',
    lightHex: '#16181D',
    darkHex: '#ECEDEE',
    role: 'Primary text, headings, and high-emphasis symbols.',
  },
  {
    name: 'Muted',
    variable: '--muted',
    lightHex: '#6B7280',
    darkHex: '#8B9098',
    role: 'Secondary copy, uppercase field labels, metadata, icons.',
  },
  {
    name: 'Hairline',
    variable: '--hairline',
    lightHex: '#E7E4DC',
    darkHex: '#26292E',
    role: '1px structural borders, dividers, subtle boundaries.',
  },
  {
    name: 'Accent',
    variable: '--accent',
    lightHex: '#0F766E',
    darkHex: '#2DD4BF',
    role: 'Single accent: primary brand actions, selected tabs, focus indicators.',
  },
  {
    name: 'Accent Soft',
    variable: '--accent-soft',
    lightHex: '#E6F2F0',
    darkHex: 'rgba(45, 212, 191, 0.12)',
    role: 'Active tab backgrounds, LIVE badge background.',
  },
];

const statusTokens = [
  {
    name: 'Green (Normal)',
    hex: '#16A34A / #22C55E',
    role: 'INFO, verified attendance, active energy setback',
    bgClass: 'bg-status-green',
    textClass: 'text-status-green',
    tintClass: 'bg-status-green-soft',
  },
  {
    name: 'Yellow (Attention)',
    hex: '#CA8A04 / #EAB308',
    role: 'ATTENTION, minor threshold exceeded, low idle load',
    bgClass: 'bg-status-yellow',
    textClass: 'text-status-yellow',
    tintClass: 'bg-status-yellow-soft',
  },
  {
    name: 'Orange (Review)',
    hex: '#EA580C / #F97316',
    role: 'REVIEW REQUIRED, grace expired, empty room energized',
    bgClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    tintClass: 'bg-status-orange-soft',
  },
  {
    name: 'Red (Critical)',
    hex: '#DC2626 / #EF4444',
    role: 'CRITICAL, safety hardware trip, emergency perimeter',
    bgClass: 'bg-status-red',
    textClass: 'text-status-red',
    tintClass: 'bg-status-red-soft',
  },
  {
    name: 'Gray (Standby)',
    hex: '#9CA3AF',
    role: 'INACTIVE / IDLE, scheduled recess, locked facility',
    bgClass: 'bg-status-gray',
    textClass: 'text-status-gray',
    tintClass: 'bg-status-gray-soft',
  },
];

export const TokenSwatches: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Core Color Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette Tokens</CardTitle>
          <CardDescription>
            Strict "Control Room Editorial" foundation. Single accent color, zero gradients, zero neon glow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {colorTokens.map((token) => (
              <div
                key={token.variable}
                className="rounded-[8px] border border-hairline bg-surface-2 p-3.5 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">
                    {token.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {token.variable}
                  </span>
                </div>

                {/* Swatch preview */}
                <div
                  className="h-12 rounded-[6px] border border-hairline flex items-center justify-center font-mono text-[11px] font-medium"
                  style={{ backgroundColor: `var(${token.variable})` }}
                >
                  <span className="px-2 py-0.5 rounded-[4px] bg-surface/80 text-ink backdrop-blur-none border border-hairline">
                    preview
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-muted">
                    <span>Light:</span>
                    <span className="text-ink font-semibold">{token.lightHex}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Dark:</span>
                    <span className="text-ink font-semibold">{token.darkHex}</span>
                  </div>
                </div>

                <p className="text-[12px] text-muted pt-1 border-t border-hairline leading-normal">
                  {token.role}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Semantic Status Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Status Tokens</CardTitle>
          <CardDescription>
            Strict semantic application only. Never used decoratively. Paired with soft background tints for badges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {statusTokens.map((item) => (
              <div
                key={item.name}
                className="rounded-[8px] border border-hairline bg-surface-2 p-3 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${item.bgClass}`} />
                  <span className="text-[13px] font-semibold text-ink leading-tight">
                    {item.name}
                  </span>
                </div>

                <div className={`p-2 rounded-[6px] border border-hairline ${item.tintClass} flex items-center justify-between`}>
                  <span className={`text-[12px] font-mono font-medium ${item.textClass}`}>
                    Sample Tint
                  </span>
                  <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                </div>

                <div className="text-[11px] font-mono text-muted">
                  HEX: <span className="text-ink font-medium">{item.hex}</span>
                </div>

                <p className="text-[11px] text-muted leading-tight border-t border-hairline pt-2">
                  {item.role}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid & Elevation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Geometry & Grid Tokens</CardTitle>
          <CardDescription>
            Geometric discipline: 8px spatial grid, 12px cards, 8px controls, 999px pills, 1px hairline borders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Corner Radii</span>
              <p className="font-semibold text-ink">12px Cards · 8px Controls · 999px Pills</p>
              <p className="text-[12px] text-muted">Zero sharp-corner brutality; zero round pill over-usage.</p>
            </div>
            <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Spacing Grid</span>
              <p className="font-semibold text-ink">8px Baseline Grid</p>
              <p className="text-[12px] text-muted">24px card interior padding (p-6), 32px section gaps (space-y-8).</p>
            </div>
            <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Elevation & Shadows</span>
              <p className="font-semibold text-ink">Near-Zero Shadows</p>
              <p className="text-[12px] text-muted">Hairline 1px border separation. Single soft shadow reserved for popovers.</p>
            </div>
            <div className="p-4 rounded-[8px] border border-hairline bg-surface-2 space-y-1">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Numerics</span>
              <p className="font-semibold text-ink">Tabular Mono Figures</p>
              <p className="text-[12px] text-muted">JetBrains Mono with tnum enabled to eliminate jitter on live updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
