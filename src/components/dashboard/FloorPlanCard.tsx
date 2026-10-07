import React, { useState } from 'react';
import { Layers, ArrowRight, Info, Eye } from 'lucide-react';
import { FloorRoomNode, OperationalStatus } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface FloorPlanCardProps {
  nodes: FloorRoomNode[];
  onSelectRoom: (roomId: string) => void;
  className?: string;
}

const statusColors: Record<
  OperationalStatus,
  {
    fill: string;
    darkFill: string;
    stroke: string;
    dot: string;
    text: string;
    badgeBg: string;
    label: string;
  }
> = {
  normal: {
    fill: '#DCFCE7', // status-green-soft
    darkFill: 'rgba(34, 197, 94, 0.16)',
    stroke: '#16A34A',
    dot: '#16A34A',
    text: '#15803D',
    badgeBg: 'bg-status-green-soft text-status-green',
    label: 'Normal Operation',
  },
  attention: {
    fill: '#FEF9C3', // status-yellow-soft
    darkFill: 'rgba(234, 179, 8, 0.16)',
    stroke: '#CA8A04',
    dot: '#CA8A04',
    text: '#A16207',
    badgeBg: 'bg-status-yellow-soft text-status-yellow',
    label: 'Attention Needed',
  },
  review: {
    fill: '#FFEDD5', // status-orange-soft
    darkFill: 'rgba(249, 115, 22, 0.18)',
    stroke: '#EA580C',
    dot: '#EA580C',
    text: '#C2410C',
    badgeBg: 'bg-status-orange-soft text-status-orange',
    label: 'Review Required',
  },
  critical: {
    fill: '#FEE2E2', // status-red-soft
    darkFill: 'rgba(239, 68, 68, 0.18)',
    stroke: '#DC2626',
    dot: '#DC2626',
    text: '#B91C1C',
    badgeBg: 'bg-status-red-soft text-status-red',
    label: 'Critical Alert',
  },
  inactive: {
    fill: '#F3F4F6', // status-gray-soft
    darkFill: 'rgba(156, 163, 175, 0.12)',
    stroke: '#9CA3AF',
    dot: '#9CA3AF',
    text: '#6B7280',
    badgeBg: 'bg-status-gray-soft text-status-gray',
    label: 'Idle / Standby',
  },
};

export const FloorPlanCard: React.FC<FloorPlanCardProps> = ({
  nodes,
  onSelectRoom,
  className = '',
}) => {
  const [hoveredNode, setHoveredNode] = useState<FloorRoomNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, roomId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRoom(roomId);
    }
  };

  return (
    <Card className={`relative flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                  Physical Spatial Map
                </span>
                <SourceBadge source="PI" size="sm" />
              </div>
              <CardTitle className="text-[20px]">
                CSE Block · Level 2 Floor Status
              </CardTitle>
            </div>
            <span className="text-[12px] font-mono text-muted">
              Click any space to inspect hardware feeds
            </span>
          </div>
          <CardDescription>
            Live occupancy & energy telemetry mapped to architectural floor plan. Focusable via keyboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* SVG Floorplan Viewport */}
          <div className="relative rounded-[8px] bg-surface-2 border border-hairline p-2 overflow-hidden select-none">
            <svg
              viewBox="0 0 700 370"
              className="w-full h-auto cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredNode(null)}
              role="region"
              aria-label="Floor plan of CSE Block Level 2"
            >
              {/* Architectural Grid & Outer Perimeter */}
              <rect
                x="15"
                y="15"
                width="670"
                height="340"
                rx="8"
                fill="none"
                stroke="var(--hairline)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Central Hallway / Corridor */}
              <rect
                x="30"
                y="155"
                width="640"
                height="50"
                rx="4"
                className="fill-surface stroke-[var(--hairline)]"
                strokeWidth="1"
              />
              <text
                x="350"
                y="185"
                textAnchor="middle"
                className="fill-[var(--muted)] font-mono text-[10px] uppercase tracking-[0.2em] pointer-events-none select-none"
              >
                CENTRAL LEVEL 2 CONCOURSE
              </text>

              {/* Individual Room Polygons */}
              {nodes.map((node) => {
                const config = statusColors[node.status] || statusColors.normal;
                const isHovered = hoveredNode?.id === node.id;
                const isReview = node.priority === 'ORANGE';

                return (
                  <g
                    key={node.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Room ${node.number}, ${node.name}, status: ${node.status}, occupancy: ${node.observedOccupancy} of ${node.expectedOccupancy}`}
                    onClick={() => onSelectRoom(node.id)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onFocus={() => setHoveredNode(node)}
                    onBlur={() => setHoveredNode(null)}
                    onKeyDown={(e) => handleKeyDown(e, node.id)}
                    className="cursor-pointer focus:outline-none group"
                  >
                    {/* Room Rectangle */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx="6"
                      fill={config.fill}
                      className="dark:fill-[var(--surface)] transition-all duration-150"
                      stroke={isHovered ? config.stroke : 'var(--hairline)'}
                      strokeWidth={isHovered ? 2 : 1}
                      style={{
                        fillOpacity: isHovered ? 0.95 : 0.8,
                      }}
                    />

                    {/* Left Accent indicator line on card */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={3.5}
                      height={node.height}
                      rx="2"
                      fill={config.stroke}
                    />

                    {/* Room Number & Status Dot */}
                    <circle
                      cx={node.x + 18}
                      cy={node.y + 20}
                      r="4"
                      fill={config.dot}
                      className={isReview ? 'animate-pulse' : ''}
                    />
                    <text
                      x={node.x + 30}
                      y={node.y + 24}
                      className="fill-[var(--ink)] font-mono text-[13px] font-semibold tracking-tight"
                    >
                      {node.number}
                    </text>

                    {/* Room Name Subtitle */}
                    <text
                      x={node.x + 14}
                      y={node.y + 45}
                      className="fill-[var(--muted)] text-[10px] font-sans font-medium"
                    >
                      {node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name}
                    </text>

                    {/* Key Telemetry Figures in Room Card */}
                    <text
                      x={node.x + 14}
                      y={node.y + 78}
                      className="fill-[var(--ink)] font-mono text-[11px] font-medium"
                    >
                      {node.observedOccupancy}
                      <tspan className="fill-[var(--muted)] text-[9px]">/{node.capacity} occ</tspan>
                    </text>

                    <text
                      x={node.x + 14}
                      y={node.y + 96}
                      className="fill-[var(--muted)] font-mono text-[10px]"
                    >
                      {node.energyKw.toFixed(1)} kW · {node.temperature.toFixed(1)}°C
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Hover Tooltip inside Map Container */}
            {hoveredNode && (
              <div
                className="absolute pointer-events-none z-30 p-3 bg-surface border border-hairline rounded-[8px] [box-shadow:var(--shadow-popover)] text-ink text-[12px] min-w-[210px] space-y-1.5 transition-all"
                style={{
                  left: Math.min(Math.max(mousePos.x + 12, 10), 460),
                  top: Math.min(Math.max(mousePos.y - 85, 10), 240),
                }}
              >
                <div className="flex items-center justify-between pb-1 border-b border-hairline">
                  <span className="font-mono font-bold text-[13px]">
                    Room {hoveredNode.number}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase ${
                      statusColors[hoveredNode.status].badgeBg
                    }`}
                  >
                    {hoveredNode.priority}
                  </span>
                </div>

                <div className="text-muted leading-tight font-medium">
                  {hoveredNode.name}
                </div>

                <div className="pt-1 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-muted">
                    <span>Headcount:</span>
                    <span className="text-ink font-semibold">
                      {hoveredNode.observedOccupancy} / {hoveredNode.capacity} (Exp: {hoveredNode.expectedOccupancy})
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Circuit Draw:</span>
                    <span className="text-ink font-semibold">{hoveredNode.energyKw.toFixed(1)} kW</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Temperature:</span>
                    <span className="text-ink font-semibold">{hoveredNode.temperature.toFixed(1)} °C</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>HVAC Relays:</span>
                    <span className="text-ink font-semibold">{hoveredNode.hvacStatus}</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-hairline text-[10px] font-mono text-accent flex items-center justify-between">
                  <span>Click space to inspect</span>
                  <span>↵ Enter</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Legend Below Map */}
      <div className="pt-4 mt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted font-mono">
        <span className="uppercase text-[11px] tracking-wider text-muted font-medium">
          Legend:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-green" />
            <span>Normal (Verified)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-yellow" />
            <span>Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-orange" />
            <span>Review Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-red" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-gray" />
            <span>Idle / Standby</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
