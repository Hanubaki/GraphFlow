---
name: web-audio-synthesis
description: >-
  Web Audio API programming, dynamic procedural sound synthesis, oscillator nodes, ADSR envelopes, gain nodes,
  and tactile UI audio feedback without external audio files. Use when designing sound effects, synthesizers, or audio interactions.
---

# Web Audio API Procedural Synthesis Runbook

Crafting lightweight, zero-latency tactile sound effects natively in the browser without loading heavy audio assets.

## 1. Safe AudioContext Initialization

Browsers block audio autoplay until the user interacts with the page:

```typescript
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}
```

## 2. Procedural Sound Synthesis (ADSR Envelopes)

Never use sudden step changes in gain (causes audio pops/clicks). Always ramp linearly or exponentially:

```typescript
export function playBlip(frequency = 440, duration = 0.1) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine'; // 'sine' | 'triangle' | 'square' | 'sawtooth'
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Attack & Decay
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}
```

## 3. Best Practices

* Keep volume subtle ($0.05 \le \text{gain} \le 0.2$) so UI feedback remains pleasant, never jarring.
* Always provide a prominent global mute toggle.
