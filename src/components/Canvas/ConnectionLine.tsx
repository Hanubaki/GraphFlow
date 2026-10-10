import React, { useMemo } from 'react';
import { GraphNode, GraphEdge, DataPacket, ProtocolType } from '../../types/graph';
import { getNodeOutputPort, getNodeInputPort, createBezierPath, getBezierPoint, getBezierTangent } from '../../utils/geometry';

interface ConnectionLineProps {
  edge: GraphEdge;
  fromNode: GraphNode;
  toNode: GraphNode;
  isSelected: boolean;
  packets: DataPacket[];
  onSelect: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
}

const protocolColors: Record<ProtocolType, string> = {
  'HTTP/REST': 'text-cyan-400 border-cyan-500/30 bg-cyan-950/80',
  'gRPC': 'text-purple-400 border-purple-500/30 bg-purple-950/80',
  'WebSocket': 'text-emerald-400 border-emerald-500/30 bg-emerald-950/80',
  'Kafka': 'text-amber-400 border-amber-500/30 bg-amber-950/80',
  'TCP': 'text-blue-400 border-blue-500/30 bg-blue-950/80',
  'SQL Query': 'text-indigo-400 border-indigo-500/30 bg-indigo-950/80',
};

interface ConnectionWireProps {
  pathD: string;
  midpoint: { x: number; y: number };
  isSelected: boolean;
  protocol: ProtocolType;
  label?: string;
  edgeId: string;
  onDelete: (edgeId: string) => void;
}

// Memoized static SVG wire & HTML badge - never re-renders on packet animation ticks!
const ConnectionWire = React.memo<ConnectionWireProps>(({
  pathD,
  midpoint,
  isSelected,
  protocol,
  label,
  edgeId,
  onDelete,
}) => {
  const badgeStyle = protocolColors[protocol] || 'text-slate-300 border-slate-700 bg-slate-900/80';

  return (
    <>
      {/* Invisible thicker path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="24"
        className="pointer-events-stroke"
      />

      {/* Outer Glow when selected */}
      {isSelected && (
        <path
          d={pathD}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="6"
          strokeOpacity="0.4"
          className="filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
        />
      )}

      {/* Main Base Wire */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#06b6d4' : '#334155'}
        strokeWidth="2"
        className="transition-colors group-hover:stroke-slate-400"
      />

      {/* Flow Dash Animation Overlay */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#38bdf8' : '#64748b'}
        strokeWidth="2"
        strokeDasharray="4 6"
        className="opacity-60 animate-flow-dash pointer-events-none"
      />

      {/* Protocol Label & Delete Pin at Midpoint */}
      <foreignObject
        x={midpoint.x - 55}
        y={midpoint.y - 14}
        width="110"
        height="28"
        className="overflow-visible pointer-events-auto"
      >
        <div
          className={`flex items-center justify-center gap-1.5 h-6 px-2 rounded-full border text-[10px] font-mono tracking-tight shadow-md backdrop-blur-sm transition-transform group-hover:scale-105 ${badgeStyle} ${
            isSelected ? 'ring-1 ring-cyan-400' : ''
          }`}
        >
          <span className="truncate max-w-[80px]">{label || protocol}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(edgeId);
            }}
            className="w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-all shrink-0"
            title="Remove Connection"
          >
            ×
          </button>
        </div>
      </foreignObject>
    </>
  );
});

ConnectionWire.displayName = 'ConnectionWire';

interface PacketDotProps {
  pkt: DataPacket;
  source: { x: number; y: number };
  target: { x: number; y: number };
}

const PacketDot = React.memo<PacketDotProps>(({ pkt, source, target }) => {
  const pt = getBezierPoint(source, target, pkt.progress);
  const tangent = getBezierTangent(source, target, pkt.progress);
  const isError = pkt.status === 'error';
  const isWarning = pkt.status === 'warning';
  const color = isError ? '#f43f5e' : isWarning ? '#fbbf24' : '#00f0ff';

  return (
    <g
      transform={`translate(${pt.x}, ${pt.y}) rotate(${tangent.angleDeg})`}
      className="pointer-events-none will-change-transform"
    >
      {/* Directional Velocity Trail aligned to curve tangent */}
      <line
        x1="-8"
        y1="0"
        x2="0"
        y2="0"
        stroke={color}
        strokeWidth={isError ? 2.5 : 2}
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Packet Glow Aura */}
      <circle
        cx="0"
        cy="0"
        r={isError ? 6.5 : 4.5}
        fill={color}
        opacity="0.35"
        className={isError ? 'animate-ping' : ''}
      />
      {/* Packet Core */}
      <circle
        cx="0"
        cy="0"
        r={isError ? 4.2 : 3.2}
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.2"
      />
    </g>
  );
});

PacketDot.displayName = 'PacketDot';

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  edge,
  fromNode,
  toNode,
  isSelected,
  packets,
  onSelect,
  onDelete,
}) => {
  // Memoize geometry calculations based strictly on node positions & dimensions
  const source = useMemo(
    () => getNodeOutputPort(fromNode),
    [fromNode.x, fromNode.y, fromNode.width, fromNode.height]
  );
  const target = useMemo(
    () => getNodeInputPort(toNode),
    [toNode.x, toNode.y, toNode.width, toNode.height]
  );
  const pathD = useMemo(
    () => createBezierPath(source, target),
    [source, target]
  );
  const midpoint = useMemo(
    () => getBezierPoint(source, target, 0.5),
    [source, target]
  );

  // Filter packets that belong to this specific edge
  const edgePackets = useMemo(
    () => packets.filter(p => p.edgeId === edge.id),
    [packets, edge.id]
  );

  return (
    <g className="cursor-pointer group" onClick={() => onSelect(edge.id)}>
      {/* Static Wire Layer (Memoized) */}
      <ConnectionWire
        pathD={pathD}
        midpoint={midpoint}
        isSelected={isSelected}
        protocol={edge.protocol}
        label={edge.label}
        edgeId={edge.id}
        onDelete={onDelete}
      />

      {/* Dynamic Packets Layer (Only renders when packets exist on this wire) */}
      {edgePackets.map(pkt => (
        <PacketDot
          key={pkt.id}
          pkt={pkt}
          source={source}
          target={target}
        />
      ))}
    </g>
  );
};
