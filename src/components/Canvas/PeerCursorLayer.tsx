import React, { memo } from 'react';
import { PeerPresence } from '../../services/multiplayerPresence';

interface PeerCursorLayerProps {
  peers: PeerPresence[];
}

export const PeerCursorLayer: React.FC<PeerCursorLayerProps> = memo(({ peers }) => {
  const activePeersWithCursor = peers.filter(p => p.cursor !== null);

  if (activePeersWithCursor.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20" aria-hidden="true">
      {activePeersWithCursor.map(peer => {
        if (!peer.cursor) return null;

        return (
          <div
            key={peer.id}
            style={{
              transform: `translate3d(${peer.cursor.x}px, ${peer.cursor.y}px, 0)`,
              transition: 'transform 80ms cubic-bezier(0, 0, 0.2, 1)',
            }}
            className="absolute top-0 left-0 flex flex-col items-start select-none will-change-transform"
          >
            {/* SVG Cursor Pointer */}
            <svg
              className="w-5 h-5 -rotate-45 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              viewBox="0 0 24 24"
              fill={peer.color}
              stroke="#0f172a"
              strokeWidth="1.5"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>

            {/* Peer Moniker & Selection Badge */}
            <div
              style={{
                backgroundColor: peer.color,
                boxShadow: `0 0 12px ${peer.color}55`,
              }}
              className="mt-1 ml-3 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold text-slate-950 flex items-center gap-1.5 shadow-lg whitespace-nowrap animate-fadeIn"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950/80 animate-ping" />
              <span>{peer.name}</span>

              {peer.selectedNodeId && (
                <span className="opacity-75 text-[11px] bg-slate-950/20 px-1 py-0.2 rounded font-sans">
                  inspecting {peer.selectedNodeId}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

PeerCursorLayer.displayName = 'PeerCursorLayer';
