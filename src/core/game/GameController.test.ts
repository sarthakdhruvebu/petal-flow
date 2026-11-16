import { describe, expect, it } from 'vitest';
import { GameController } from './GameController';

describe('GameController', () => {
  it('spawns from seed packet until full', () => {
    const g = new GameController();
    for (let i = 0; i < 49; i++) {
      expect(g.tapProducer('seed_packet')).toBe(true);
    }
    expect(g.tapProducer('seed_packet')).toBe(false);
    expect(g.board.isFull()).toBe(true);
  });

  it('merges without bloom for low tiers', () => {
    const g = new GameController();
    g.forcePlace(0, 'sprout');
    g.forcePlace(1, 'sprout');
    expect(g.tryMerge(0, 1)).toBe(true);
    expect(g.board.get(1)?.itemId).toBe('leaf');
    expect(g.progression.xp).toBeGreaterThan(0);
  });

  it('locks input and resolves bloom for buds', () => {
    const g = new GameController();
    g.forcePlace(0, 'bud');
    g.forcePlace(1, 'bud');
    expect(g.tryMerge(0, 1)).toBe(true);
    expect(g.inputLocked).toBe(true);
    g.resolveBloom(0.5); // perfect
    expect(g.inputLocked).toBe(false);
    expect(g.board.get(1)?.itemId).toBe('flower');
    expect(g.board.get(1)?.isPrismatic).toBe(true);
    expect(g.bloomEncountered).toBe(true);
  });

  it('miss bloom still creates normal item', () => {
    const g = new GameController();
    g.forcePlace(0, 'bud');
    g.forcePlace(1, 'bud');
    g.tryMerge(0, 1);
    g.resolveBloom(0.01);
    expect(g.board.get(1)?.itemId).toBe('flower');
    expect(g.board.get(1)?.isPrismatic).toBe(false);
  });
});
