/**
 * Real-time Multiplayer Presence & Collaboration Engine.
 * Adheres to realtime-websockets and clean-architecture-refactoring guidelines.
 * Uses BroadcastChannel for instant multi-tab synchronization and ResilientSocket for network synchronization.
 */

import { realtimeSocket } from './realtimeSocket';

export interface PeerPresence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selectedNodeId: string | null;
  lastActive: number;
}

const PEER_COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

const PERSONA_TITLES = [
  'Architect',
  'DevOps',
  'SRE',
  'Cloud-Eng',
  'Data-Lead',
  'Security',
  'Backend',
  'Principal',
];

/**
 * Generates or recovers a consistent session persona for this tab.
 */
export function getOrCreateLocalPersona(): { id: string; name: string; color: string } {
  const STORAGE_KEY = 'graphflow_multiplayer_peer';
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {}

  const id = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = PERSONA_TITLES[Math.floor(Math.random() * PERSONA_TITLES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const name = `${title}-${num}`;
  const color = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];

  const persona = { id, name, color };
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
    }
  } catch {}

  return persona;
}

export type PresenceListener = (peers: PeerPresence[]) => void;

export class MultiplayerPresenceManager {
  private localPersona = getOrCreateLocalPersona();
  private localCursor: { x: number; y: number } | null = null;
  private localSelectedNodeId: string | null = null;

  private peers = new Map<string, PeerPresence>();
  private listeners = new Set<PresenceListener>();

  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private staleCleanupInterval: ReturnType<typeof setInterval> | null = null;

  private readonly STALE_THRESHOLD_MS = 8000;
  private readonly HEARTBEAT_INTERVAL_MS = 2500;
  private readonly CLEANUP_INTERVAL_MS = 2000;

  constructor() {
    this.initTransport();
  }

  private initTransport(): void {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel for fast zero-config multi-tab collaboration
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('graphflow_multiplayer_presence_v1');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch {}
    }

    // 2. Resilient WebSocket for network peers
    realtimeSocket.on('presence:sync', (envelope: any) => {
      this.handleIncomingMessage(envelope.payload);
    });

    realtimeSocket.on('presence:leave', (envelope: any) => {
      if (envelope.payload?.id) {
        this.peers.delete(envelope.payload.id);
        this.notifyListeners();
      }
    });

    // 3. Heartbeat cycle
    this.heartbeatInterval = setInterval(() => {
      this.broadcastSelf();
    }, this.HEARTBEAT_INTERVAL_MS);

    // 4. Stale peer pruning cycle
    this.staleCleanupInterval = setInterval(() => {
      this.pruneStalePeers();
    }, this.CLEANUP_INTERVAL_MS);

    // 5. Clean teardown on tab close
    window.addEventListener('beforeunload', () => {
      this.broadcastLeave();
    });

    // Announce presence immediately
    this.broadcastSelf();
  }

  public getLocalPresence(): PeerPresence {
    return {
      id: this.localPersona.id,
      name: this.localPersona.name,
      color: this.localPersona.color,
      cursor: this.localCursor,
      selectedNodeId: this.localSelectedNodeId,
      lastActive: Date.now(),
    };
  }

  public getRemotePeers(): PeerPresence[] {
    return Array.from(this.peers.values()).filter(p => p.id !== this.localPersona.id);
  }

  public updateCursor(worldX: number, worldY: number): void {
    this.localCursor = { x: Math.round(worldX), y: Math.round(worldY) };
    this.broadcastSelf();
  }

  public clearCursor(): void {
    if (this.localCursor !== null) {
      this.localCursor = null;
      this.broadcastSelf();
    }
  }

  public updateSelectedNode(nodeId: string | null): void {
    if (this.localSelectedNodeId !== nodeId) {
      this.localSelectedNodeId = nodeId;
      this.broadcastSelf();
    }
  }

  public subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    listener(this.getRemotePeers());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public pruneStalePeers(): void {
    const now = Date.now();
    let hasChanges = false;
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastActive > this.STALE_THRESHOLD_MS) {
        this.peers.delete(id);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.notifyListeners();
    }
  }

  public broadcastSelf(): void {
    const selfPresence = this.getLocalPresence();

    const payload = {
      type: 'presence:update',
      peer: selfPresence,
      timestamp: Date.now(),
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch {}
    }

    if (realtimeSocket.getState() === 'connected') {
      realtimeSocket.send('presence:sync', payload);
    }
  }

  public broadcastLeave(): void {
    const payload = {
      type: 'presence:leave',
      id: this.localPersona.id,
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch {}
    }

    if (realtimeSocket.getState() === 'connected') {
      realtimeSocket.send('presence:leave', payload);
    }
  }

  public handleIncomingMessage(msg: any): void {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'presence:update' && msg.peer && msg.peer.id) {
      if (msg.peer.id === this.localPersona.id) return; // Ignore own echoes

      this.peers.set(msg.peer.id, {
        ...msg.peer,
        lastActive: msg.peer.lastActive ?? Date.now(),
      });
      this.notifyListeners();
    } else if (msg.type === 'presence:leave' && msg.id) {
      if (this.peers.has(msg.id)) {
        this.peers.delete(msg.id);
        this.notifyListeners();
      }
    }
  }

  public destroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.staleCleanupInterval) clearInterval(this.staleCleanupInterval);
    this.broadcastLeave();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }
    this.listeners.clear();
    this.peers.clear();
  }

  private notifyListeners(): void {
    const remote = this.getRemotePeers();
    this.listeners.forEach(fn => fn(remote));
  }
}

export const multiplayerPresence = new MultiplayerPresenceManager();
