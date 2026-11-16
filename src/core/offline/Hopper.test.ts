import { describe, expect, it } from 'vitest';
import { accrueHopper, collectFromHopper, createHopperState } from './Hopper';
import { HOPPER_MAX_MS } from '../../data/hopper';

describe('Hopper', () => {
  it('accrues items based on elapsed time', () => {
    const start = 1_000_000;
    let state = createHopperState(start);
    // 1 hour for seed_packet at 30/hour => 30 items (capped by hopperCap 20)
    state = accrueHopper(state, ['seed_packet'], start + 60 * 60 * 1000);
    expect(state.queue.length).toBe(20);
    expect(state.queue.every((id) => id === 'sprout')).toBe(true);
  });

  it('grants zero on clock rollback', () => {
    const start = 5_000_000;
    let state = createHopperState(start);
    state = accrueHopper(state, ['seed_packet'], start + 60_000);
    const before = state.queue.length;
    state = accrueHopper(state, ['seed_packet'], start - 10_000);
    expect(state.queue.length).toBe(before);
    expect(state.lastAccruedAt).toBe(start - 10_000);
  });

  it('caps accumulation window at 4 hours', () => {
    const start = 0;
    let state = createHopperState(start);
    state = accrueHopper(state, ['seed_packet'], start + HOPPER_MAX_MS * 3);
    // 4h * 30/h = 120 but cap 20
    expect(state.queue.length).toBe(20);
  });

  it('collects without discarding remainder', () => {
    let state = createHopperState();
    state.queue = ['sprout', 'sprout', 'sprout'];
    const { collected, state: next } = collectFromHopper(state, 2);
    expect(collected).toEqual(['sprout', 'sprout']);
    expect(next.queue).toEqual(['sprout']);
  });
});
