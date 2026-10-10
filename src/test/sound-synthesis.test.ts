import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundFx } from '../utils/sound';

describe('Web Audio API Procedural Synthesis Suite', () => {
  beforeEach(() => {
    soundFx.enabled = true;
  });

  it('provides a global mute toggle', () => {
    expect(soundFx.enabled).toBe(true);
    soundFx.enabled = false;
    expect(soundFx.enabled).toBe(false);
  });

  it('safely handles playback in headless / test environment without throwing', () => {
    expect(() => {
      soundFx.playClick();
      soundFx.playConnect();
      soundFx.playPacketDelivered();
      soundFx.playError();
      soundFx.playSpike();
      soundFx.playNodeAdded();
      soundFx.playNodeDeleted();
      soundFx.playSuccess();
    }).not.toThrow();
  });

  it('verifies mock Web Audio API receives proper exponential ADSR ramps', () => {
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockOsc = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockCtx = {
      state: 'running',
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Temporarily mount mock AudioContext
    (soundFx as any).ctx = mockCtx;

    soundFx.playNodeAdded();

    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 10);
    expect(mockOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(659.25, 10.08);
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10.1);
    expect(mockOsc.start).toHaveBeenCalledWith(10);
    expect(mockOsc.stop).toHaveBeenCalledWith(10.1);

    // Clean up
    (soundFx as any).ctx = null;
  });
});
