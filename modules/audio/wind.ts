/**
 * Wind audio - continuous noise scaled by airspeed.
 * Helps with speed awareness during flight.
 */

import { getAudioContext } from "./context";
import { airspeedToWindGain } from "./params";

export interface WindConfig {
  volume: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: WindConfig = {
  volume: 0.2,
  enabled: true,
};

export interface WindAudio {
  update(airspeed: number): void;
  stop(): void;
  resume(): Promise<void>;
  /** Update config at runtime */
  setConfig(config: Partial<WindConfig>): void;
}

/**
 * Create wind audio. Uses looped filtered noise, gain from airspeed.
 */
export function createWindAudio(config: Partial<WindConfig> = {}): WindAudio {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  function setConfig(update: Partial<WindConfig>): void {
    Object.assign(cfg, update);
  }
  let gainNode: GainNode | null = null;
  let source: AudioBufferSourceNode | null = null;

  function init(): AudioContext | null {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (gainNode) return ctx;

    {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      gainNode = ctx.createGain();
      gainNode.gain.value = 0;

      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    }
    return getAudioContext();
  }

  function update(airspeed: number): void {
    if (!cfg.enabled || cfg.volume <= 0) return;
    const ctx = init();
    if (!ctx || !gainNode) return;

    const targetGain = airspeedToWindGain(airspeed) * cfg.volume * 0.4;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.08);
  }

  function stop(): void {
    const ctx = getAudioContext();
    if (gainNode && ctx) {
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    }
  }

  async function resume(): Promise<void> {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") await ctx.resume();
  }

  return { update, stop, resume, setConfig };
}
