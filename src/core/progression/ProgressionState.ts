import {
  LEVEL_THRESHOLDS,
  PERFECT_BLOOM_BONUS_XP,
  levelFromXp,
  mergeXpForResultTier,
  xpProgressInLevel,
} from '../../data/progression';
import type { BloomOutcome } from '../../data/bloomConfig';

export class ProgressionState {
  xp: number;
  gold: number;

  constructor(xp = 0, gold = 0) {
    this.xp = xp;
    this.gold = gold;
  }

  get level(): number {
    return levelFromXp(this.xp);
  }

  get progress(): { current: number; needed: number; level: number } {
    return xpProgressInLevel(this.xp);
  }

  awardMerge(resultTier: number, bloom?: BloomOutcome): { gained: number; leveledUp: boolean; newLevel: number } {
    const before = this.level;
    let gained = mergeXpForResultTier(resultTier);
    if (bloom === 'perfect') gained += PERFECT_BLOOM_BONUS_XP;
    this.xp += gained;
    const after = this.level;
    return { gained, leveledUp: after > before, newLevel: after };
  }

  awardXp(amount: number): { leveledUp: boolean; newLevel: number } {
    const before = this.level;
    this.xp += Math.max(0, amount);
    const after = this.level;
    return { leveledUp: after > before, newLevel: after };
  }

  addGold(amount: number): void {
    this.gold += Math.max(0, amount);
  }

  spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }
}

export { LEVEL_THRESHOLDS, PERFECT_BLOOM_BONUS_XP, mergeXpForResultTier };
