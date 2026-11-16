import { describe, expect, it } from 'vitest';
import { ProgressionState } from './ProgressionState';

describe('ProgressionState', () => {
  it('awards merge xp and perfect bonus', () => {
    const p = new ProgressionState();
    const a = p.awardMerge(2);
    expect(a.gained).toBe(10);
    const b = p.awardMerge(4, 'perfect');
    expect(b.gained).toBe(20 + 15);
  });

  it('levels up across threshold', () => {
    const p = new ProgressionState(35);
    const r = p.awardMerge(1); // +5 => 40
    expect(r.leveledUp).toBe(true);
    expect(r.newLevel).toBe(2);
  });
});
