export function mergeXpForResultTier(tier: number): number {
  return 5 * tier;
}

export const PERFECT_BLOOM_BONUS_XP = 15;

/** Cumulative XP thresholds: index 0 unused, level N requires thresholds[N]. */
export const LEVEL_THRESHOLDS: number[] = [0, 0, 40, 100, 180, 280, 380, 480, 580, 680];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 2; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  // Beyond table: +100 XP per level
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const extra = Math.floor((xp - last) / 100);
    level = LEVEL_THRESHOLDS.length - 1 + extra;
  }
  return Math.max(1, level);
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; level: number } {
  const level = levelFromXp(xp);
  const currentFloor =
    level < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[level]
      : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - (LEVEL_THRESHOLDS.length - 1)) * 100;
  const currentNext =
    level + 1 < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[level + 1]
      : currentFloor + 100;
  return {
    level,
    current: xp - currentFloor,
    needed: currentNext - currentFloor,
  };
}
