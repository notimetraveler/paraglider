/**
 * Landing / touchdown audio - one-shot feedback on ground contact.
 * Volume and character scale with landing quality.
 */

import type { LandingQuality } from "@/modules/game-session";
import { getAudioContext } from "./context";
import { LANDING_VOLUME, sinkToLandingDuration } from "./params";

export interface LandingConfig {
  volume: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: LandingConfig = {
  volume: 0.4,
  enabled: true,
};

/**
 * Play touchdown sound. Call once when landing.
 */
export function playLandingSound(
  quality: LandingQuality,
  sinkRate: number,
  config: Partial<LandingConfig> = {}
): void {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (!cfg.enabled || cfg.volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const vol = (LANDING_VOLUME[quality] ?? 0.5) * cfg.volume;
  const duration = sinkToLandingDuration(sinkRate);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = quality === "smooth" ? 80 : quality === "hard" ? 60 : 45;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}
