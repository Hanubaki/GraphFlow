import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResilientSocket, SocketConnectionState } from '../services/realtimeSocket';

describe('Real-Time WebSocket Resilience & Queueing Suite', () => {
  let socket: ResilientSocket;

  beforeEach(() => {
    socket = new ResilientSocket({
      initialBackoffMs: 100,
      maxBackoffMs: 2000,
      maxQueueSize: 5,
    });
  });

  it('initializes in disconnected state', () => {
    expect(socket.getState()).toBe('disconnected');
    expect(socket.getQueueLength()).toBe(0);
  });

  it('calculates exponential backoff delay with bounded jitter', () => {
    // Attempt 0: 100ms + [0, 50ms] jitter
    const delay0 = socket.computeBackoffDelay(0);
    expect(delay0).toBeGreaterThanOrEqual(100);
    expect(delay0).toBeLessThanOrEqual(150);

    // Attempt 1: 200ms + [0, 50ms] jitter
    const delay1 = socket.computeBackoffDelay(1);
    expect(delay1).toBeGreaterThanOrEqual(200);
    expect(delay1).toBeLessThanOrEqual(250);

    // Attempt 2: 400ms + [0, 50ms] jitter
    const delay2 = socket.computeBackoffDelay(2);
    expect(delay2).toBeGreaterThanOrEqual(400);
    expect(delay2).toBeLessThanOrEqual(450);

    // High attempt capped at maxBackoffMs (2000ms + 50ms)
    const delayHigh = socket.computeBackoffDelay(10);
    expect(delayHigh).toBeLessThanOrEqual(2050);
  });

  it('queues messages in offline state and caps at maxQueueSize', () => {
    // Socket is disconnected, send 7 messages (limit is 5)
    for (let i = 1; i <= 7; i++) {
      socket.send('NODE_MOVED', { nodeId: `n${i}`, x: i * 10, y: i * 10 });
    }

    // Queue must be capped at 5
    expect(socket.getQueueLength()).toBe(5);
  });

  it('registers and unregisters message listeners cleanly', () => {
    const callback = vi.fn();
    const unsubscribe = socket.on('PRESENCE_SYNC', callback);

    // Simulated event processing
    (socket as any).handleMessage({
      data: JSON.stringify({
        id: 'msg-1',
        sequenceId: 1,
        type: 'PRESENCE_SYNC',
        payload: { userId: 'usr-1', cursor: { x: 50, y: 50 } },
        timestamp: Date.now(),
      }),
    } as MessageEvent);

    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    (socket as any).handleMessage({
      data: JSON.stringify({
        id: 'msg-2',
        sequenceId: 2,
        type: 'PRESENCE_SYNC',
        payload: { userId: 'usr-1', cursor: { x: 60, y: 60 } },
        timestamp: Date.now(),
      }),
    } as MessageEvent);

    expect(callback).toHaveBeenCalledTimes(1); // Not called again after unsubscribing
  });

  it('notifies state change listeners of connection lifecycle transitions', () => {
    const states: SocketConnectionState[] = [];
    socket.onStateChange(st => states.push(st));

    (socket as any).setState('connecting');
    (socket as any).setState('connected');
    (socket as any).setState('reconnecting');
    socket.disconnect();

    expect(states).toContain('connecting');
    expect(states).toContain('connected');
    expect(states).toContain('reconnecting');
    expect(states).toContain('disconnected');
  });
});
