import { BloomConfig, type BloomOutcome, type BloomTimingConfig } from '../../data/bloomConfig';

export function shouldTriggerBloom(fromTier: number): boolean {
  return BloomConfig.triggerTiers.includes(fromTier);
}

export function getBloomTiming(isFirstEncounter: boolean): BloomTimingConfig {
  if (isFirstEncounter) return BloomConfig.firstEncounter;
  return {
    sweepDurationMs: BloomConfig.sweepDurationMs,
    perfectWidth: BloomConfig.perfectWidth,
    goodWidthEachSide: BloomConfig.goodWidthEachSide,
    easing: BloomConfig.easing,
  };
}

/**
 * Indicator position in [0, 1] along the bar.
 * Perfect is centered; good bands flank perfect; rest is miss.
 */
export function classifyBloomHit(
  position: number,
  timing: BloomTimingConfig = getBloomTiming(false),
): BloomOutcome {
  const p = Math.min(1, Math.max(0, position));
  const perfect = timing.perfectWidth;
  const good = timing.goodWidthEachSide;
  const perfectStart = 0.5 - perfect / 2;
  const perfectEnd = 0.5 + perfect / 2;
  if (p >= perfectStart && p <= perfectEnd) return 'perfect';
  const goodStart = perfectStart - good;
  const goodEnd = perfectEnd + good;
  if (p >= goodStart && p <= goodEnd) return 'good';
  return 'miss';
}

/** Linear sweep: t in [0,1] -> position. */
export function sweepPosition(t: number, easing: BloomTimingConfig['easing'] = 'linear'): number {
  const x = Math.min(1, Math.max(0, t));
  if (easing === 'linear') return x;
  return x;
}
