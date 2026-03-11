/**
 * Variometer audio - beep tone indicating climb/sink rate.
 * Paragliding varios: higher pitch + faster beeps = stronger climb.
 * Sink = silence or low slow beep.
 */

/** Base frequency (Hz) - typical vario 400-600 */
const BASE_FREQ = 500;
/** Max frequency at strong climb (Hz) */
const MAX_FREQ = 900;
/** Sink threshold (m/s) - below this, silent */
const SINK_THRESHOLD = 0.1;
/** Climb threshold (m/s) - above this, beep */
const CLIMB_THRESHOLD = 0.2;
/** Max climb for scaling (m/s) */
const MAX_CLIMB = 4;

export interface VarioConfig {
  volume: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: VarioConfig = {
  volume: 0.3,
  enabled: true,
};

export interface Variometer {
  update(verticalSpeed: number): void;
  stop(): void;
  /** Resume AudioContext after user gesture (required by browsers) */
  resume(): void;
}

/**
 * Create variometer. AudioContext must be resumed after user gesture.
 */
export function createVariometer(config: Partial<VarioConfig> = {}): Variometer {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let audioContext: AudioContext | null = null;
  let lastBeepTime = 0;

  function getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContext;
  }

  function playBeep(freq: number, durationMs: number, gain: number): void {
    const ctx = getContext();
    if (!ctx || !cfg.enabled || cfg.volume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.connect(g);
    g.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain * cfg.volume, now + 0.01);
    g.gain.setValueAtTime(gain * cfg.volume, now + durationMs / 1000 - 0.02);
    g.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  function update(verticalSpeed: number): void {
    if (!cfg.enabled) return;

    const ctx = getContext();
    if (!ctx) return;

    if (verticalSpeed < SINK_THRESHOLD) {
      return;
    }

    if (verticalSpeed < CLIMB_THRESHOLD) {
      return;
    }

    const t = ctx.currentTime;
    const climbNorm = Math.min(1, (verticalSpeed - CLIMB_THRESHOLD) / (MAX_CLIMB - CLIMB_THRESHOLD));
    const freq = BASE_FREQ + climbNorm * (MAX_FREQ - BASE_FREQ);
    const beepDuration = 40 + climbNorm * 60;
    const interval = 0.4 - climbNorm * 0.25;

    if (t - lastBeepTime >= interval) {
      lastBeepTime = t;
      playBeep(freq, beepDuration, 0.5);
    }
  }

  function stop(): void {
    lastBeepTime = 0;
  }

  async function resume(): Promise<void> {
    const ctx = getContext();
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
  }

  return { update, stop, resume };
}
