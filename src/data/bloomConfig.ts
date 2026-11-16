export interface BloomTimingConfig {
  sweepDurationMs: number;
  perfectWidth: number;
  goodWidthEachSide: number;
  easing: 'linear';
}

export const BloomConfig = {
  sweepDurationMs: 2000,
  perfectWidth: 0.15,
  goodWidthEachSide: 0.25,
  easing: 'linear' as const,
  firstEncounter: {
    sweepDurationMs: 2400,
    perfectWidth: 0.22,
    goodWidthEachSide: 0.26,
    easing: 'linear' as const,
  } satisfies BloomTimingConfig,
  /** Merging FROM these tiers triggers Bloom. */
  triggerTiers: [3, 4, 5] as number[],
};

export type BloomOutcome = 'perfect' | 'good' | 'miss';
