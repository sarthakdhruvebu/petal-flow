import { describe, expect, it } from 'vitest';
import { classifyBloomHit, getBloomTiming, shouldTriggerBloom } from './bloomLogic';
import { BloomConfig } from '../../data/bloomConfig';

describe('bloomLogic', () => {
  it('triggers on configured tiers only', () => {
    expect(shouldTriggerBloom(2)).toBe(false);
    expect(shouldTriggerBloom(3)).toBe(true);
    expect(shouldTriggerBloom(4)).toBe(true);
    expect(shouldTriggerBloom(5)).toBe(true);
    expect(shouldTriggerBloom(6)).toBe(false);
  });

  it('classifies perfect / good / miss around center', () => {
    const timing = {
      sweepDurationMs: 2000,
      perfectWidth: 0.15,
      goodWidthEachSide: 0.25,
      easing: 'linear' as const,
    };
    expect(classifyBloomHit(0.5, timing)).toBe('perfect');
    expect(classifyBloomHit(0.5 - 0.15 / 2 + 0.001, timing)).toBe('perfect');
    expect(classifyBloomHit(0.5 - 0.15 / 2 - 0.05, timing)).toBe('good');
    expect(classifyBloomHit(0.01, timing)).toBe('miss');
    expect(classifyBloomHit(0.99, timing)).toBe('miss');
  });

  it('first encounter uses easier timing', () => {
    const first = getBloomTiming(true);
    expect(first.perfectWidth).toBe(BloomConfig.firstEncounter.perfectWidth);
    expect(first.sweepDurationMs).toBe(BloomConfig.firstEncounter.sweepDurationMs);
    const normal = getBloomTiming(false);
    expect(normal.perfectWidth).toBe(BloomConfig.perfectWidth);
  });
});
