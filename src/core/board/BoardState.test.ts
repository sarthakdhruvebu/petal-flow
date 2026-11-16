import { describe, expect, it } from 'vitest';
import { BoardState } from './BoardState';

describe('BoardState', () => {
  it('spawns into empty cell and refuses when full', () => {
    const board = new BoardState(2, 2);
    expect(board.spawnAtRandomEmpty('sprout', () => 0)).toBe(0);
    board.spawnAtRandomEmpty('sprout', () => 0);
    board.spawnAtRandomEmpty('sprout', () => 0);
    board.spawnAtRandomEmpty('sprout', () => 0);
    expect(board.isFull()).toBe(true);
    expect(board.spawnAtRandomEmpty('sprout')).toBeNull();
  });

  it('moves only into empty cells', () => {
    const board = new BoardState(2, 2);
    board.spawnAtRandomEmpty('sprout', () => 0);
    expect(board.move(0, 1)).toBe(true);
    expect(board.get(0)).toBeNull();
    expect(board.get(1)?.itemId).toBe('sprout');
    board.spawnAtRandomEmpty('leaf', () => 0);
    expect(board.move(1, 0)).toBe(false);
  });
});
