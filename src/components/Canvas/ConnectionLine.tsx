import React from 'react';
import { GraphNode, GraphEdge, DataPacket } from '../../types/graph';
import { getNodeOutputPort, getNodeInputPort, createBezierPath, getBezierPoint } from '../../utils/geometry';

interface ConnectionLineProps {
  edge: GraphEdge;
  fromNode: GraphNode;
  toNode: GraphNode;
  isSelected: boolean;
  packets: DataPacket[];
  onSelect: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  edge,
  fromNode,
  toNode,
  isSelected,
  packets,
  onSelect,
  onDelete,
}) => {
  const source = getNodeOutputPort(fromNode);
  const target = getNodeInputPort(toNode);
  const pathD = createBezierPath(source, target);
  const midpoint = getBezierPoint(source, target, 0.5);

  // Filter packets that belong to this edge
  const edgePackets = packets.filter(p => p.edgeId === edge.id);

  // Protocol badge colors
  const protocolColors: Record<string, string> = {
    'HTTP/REST': 'text-cyan-400 border-cyan-500/30 bg-cyan-950/80',
    'gRPC': 'text-purple-400 border-purple-500/30 bg-purple-950/80',
    'WebSocket': 'text-emerald-400 border-emerald-500/30 bg-emerald-950/80',
    'Kafka': 'text-amber-400 border-amber-500/30 bg-amber-950/80',
    'TCP': 'text-blue-400 border-blue-500/30 bg-blue-950/80',
    'SQL Query': 'text-indigo-400 border-indigo-500/30 bg-indigo-950/80',
  };

  const badgeStyle = protocolColors[edge.protocol] || 'text-slate-300 border-slate-700 bg-slate-900/80';

  return (
    <g className="cursor-pointer group" onClick={() => onSelect(edge.id)}>
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

      {/* Render Animated Data Packets along the Curve */}
      {edgePackets.map(pkt => {
        const pt = getBezierPoint(source, target, pkt.progress);
        const isError = pkt.status === 'error';
        const isWarning = pkt.status === 'warning';
        const color = isError ? '#f43f5e' : isWarning ? '#fbbf24' : '#00f0ff';

        return (
          <g key={pkt.id} className="pointer-events-none">
            {/* Packet Glow Aura */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isError ? 7 : 5}
              fill={color}
              opacity="0.3"
              className={isError ? 'animate-ping' : ''}
            />
            {/* Packet Core */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isError ? 4.5 : 3.5}
              fill={color}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          </g>
        );
      })}

      {/* Protocol Label & Delete Pin at Midpoint */}
      <foreignObject
        x={midpoint.x - 48}
        y={midpoint.y - 12}
        width="96"
        height="24"
        className="overflow-visible pointer-events-auto"
      >
        <div
          className={`flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono tracking-tight shadow-md backdrop-blur-sm transition-transform group-hover:scale-110 ${badgeStyle} ${
            isSelected ? 'ring-1 ring-cyan-400' : ''
          }`}
        >
          <span>{edge.label || edge.protocol}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(edge.id);
            }}
            className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
            title="Remove Connection"
          >
            ×
          </button>
        </div>
      </foreignObject>
    </g>
  );
};
