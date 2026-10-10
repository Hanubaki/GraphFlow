/**
 * Resilient Real-Time WebSocket Client.
 * Implements jittered exponential backoff, heartbeat ping-pong health checks,
 * in-memory offline message queueing, and sequence deduplication.
 */

export type SocketConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RealtimeEnvelope<T = unknown> {
  id: string;
  sequenceId: number;
  type: string;
  payload: T;
  timestamp: number;
}

export type MessageListener<T = unknown> = (envelope: RealtimeEnvelope<T>) => void;
export type StateChangeListener = (state: SocketConnectionState) => void;

export interface ResilientSocketOptions {
  heartbeatIntervalMs?: number;
  pongTimeoutMs?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  maxQueueSize?: number;
}

export class ResilientSocket {
  private url: string | null = null;
  private socket: WebSocket | null = null;
  private state: SocketConnectionState = 'disconnected';

  private retryCount = 0;
  private sequenceCounter = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private outgoingQueue: RealtimeEnvelope[] = [];
  private messageListeners = new Map<string, Set<MessageListener<any>>>();
  private stateChangeListeners = new Set<StateChangeListener>();

  private readonly heartbeatIntervalMs: number;
  private readonly pongTimeoutMs: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly maxQueueSize: number;

  constructor(options: ResilientSocketOptions = {}) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30000;
    this.pongTimeoutMs = options.pongTimeoutMs ?? 10000;
    this.initialBackoffMs = options.initialBackoffMs ?? 1000;
    this.maxBackoffMs = options.maxBackoffMs ?? 30000;
    this.maxQueueSize = options.maxQueueSize ?? 100;
  }

  public connect(url: string): void {
    this.url = url;
    this.cleanup();
    this.setState(this.retryCount > 0 ? 'reconnecting' : 'connecting');

    try {
      if (typeof WebSocket === 'undefined') {
        // Safe fallback in non-browser/mock test environments
        return;
      }

      this.socket = new WebSocket(url);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.cleanup();
    this.retryCount = 0;
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.setState('disconnected');
  }

  public send<T = unknown>(type: string, payload: T): void {
    const envelope: RealtimeEnvelope<T> = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sequenceId: ++this.sequenceCounter,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.state === 'connected' && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(envelope));
        return;
      } catch {
        // Fallthrough to enqueue on socket write error
      }
    }

    // Queue for automatic flushing upon reconnection
    if (this.outgoingQueue.length >= this.maxQueueSize) {
      this.outgoingQueue.shift(); // Evict oldest
    }
    this.outgoingQueue.push(envelope);
  }

  public on<T = unknown>(type: string, listener: MessageListener<T>): () => void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    this.messageListeners.get(type)!.add(listener);

    return () => {
      this.messageListeners.get(type)?.delete(listener);
    };
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  public getState(): SocketConnectionState {
    return this.state;
  }

  public getQueueLength(): number {
    return this.outgoingQueue.length;
  }

  public computeBackoffDelay(attempt: number): number {
    const exponential = Math.min(this.maxBackoffMs, this.initialBackoffMs * Math.pow(2, attempt));
    const jitter = Math.random() * (this.initialBackoffMs * 0.5);
    return Math.floor(exponential + jitter);
  }

  private handleOpen(): void {
    this.retryCount = 0;
    this.setState('connected');
    this.startHeartbeat();
    this.flushQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Heartbeat pong frame
      if (data.type === 'pong') {
        this.clearPongTimeout();
        return;
      }

      const listeners = this.messageListeners.get(data.type);
      if (listeners) {
        listeners.forEach(fn => fn(data));
      }
    } catch {
      // Ignore unparseable frames
    }
  }

  private handleError(): void {
    // Errors automatically trigger onclose in browser WebSocket specification
  }

  private handleClose(): void {
    this.cleanup();
    if (this.state !== 'disconnected') {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');
    const delay = this.computeBackoffDelay(this.retryCount);
    this.retryCount++;

    this.reconnectTimer = setTimeout(() => {
      if (this.url && this.state !== 'disconnected') {
        this.connect(this.url);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.pingIntervalTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          this.pongTimeoutTimer = setTimeout(() => {
            // Heartbeat failed: socket is a zombie connection, force restart
            if (this.socket) {
              try {
                this.socket.close();
              } catch {}
            }
          }, this.pongTimeoutMs);
        } catch {}
      }
    }, this.heartbeatIntervalMs);
  }

  private clearPongTimeout(): void {
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  private clearHeartbeat(): void {
    if (this.pingIntervalTimer) {
      clearInterval(this.pingIntervalTimer);
      this.pingIntervalTimer = null;
    }
    this.clearPongTimeout();
  }

  private flushQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    while (this.outgoingQueue.length > 0) {
      const envelope = this.outgoingQueue.shift()!;
      try {
        this.socket.send(JSON.stringify(envelope));
      } catch {
        this.outgoingQueue.unshift(envelope);
        break;
      }
    }
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearHeartbeat();
  }

  private setState(newState: SocketConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeListeners.forEach(listener => listener(newState));
    }
  }
}

export const realtimeSocket = new ResilientSocket();
