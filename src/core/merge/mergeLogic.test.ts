import { describe, expect, it } from 'vitest';
import { BoardState } from '../board/BoardState';
import { createBoardItem } from '../items/types';
import { canMergeItems, commitMerge, hasAnyMerge } from './mergeLogic';

describe('mergeLogic', () => {
  it('merges two identical sprouts into a leaf', () => {
    const a = createBoardItem('sprout');
    const b = createBoardItem('sprout');
    const check = canMergeItems(a, b);
    expect(check.ok).toBe(true);
    expect(check.nextItemId).toBe('leaf');
    expect(check.bloomEligible).toBe(false);
  });

  it('rejects different tiers', () => {
    const a = createBoardItem('sprout');
    const b = createBoardItem('leaf');
    expect(canMergeItems(a, b).ok).toBe(false);
  });

  it('allows normal + prismatic same tier', () => {
    const a = createBoardItem('bud', false);
    const b = createBoardItem('bud', true);
    const check = canMergeItems(a, b);
    expect(check.ok).toBe(true);
    expect(check.nextItemId).toBe('flower');
    expect(check.bloomEligible).toBe(true);
  });

  it('rejects max tier magical flowers', () => {
    const a = createBoardItem('magical_flower');
    const b = createBoardItem('magical_flower');
    expect(canMergeItems(a, b).ok).toBe(false);
  });

  it('commitMerge places next tier and clears source', () => {
    const board = new BoardState();
    board.set(0, createBoardItem('sprout'));
    board.set(1, createBoardItem('sprout'));
    const result = commitMerge(board, 0, 1, false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(board.get(0)).toBeNull();
    expect(board.get(1)?.itemId).toBe('leaf');
    expect(board.get(1)?.isPrismatic).toBe(false);
  });

  it('commitMerge can create prismatic', () => {
    const board = new BoardState();
    board.set(0, createBoardItem('bud'));
    board.set(1, createBoardItem('bud'));
    const result = commitMerge(board, 0, 1, true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(board.get(1)?.itemId).toBe('flower');
    expect(board.get(1)?.isPrismatic).toBe(true);
  });

  it('detects available merges', () => {
    const board = new BoardState();
    board.set(0, createBoardItem('leaf'));
    board.set(5, createBoardItem('leaf'));
    expect(hasAnyMerge(board)).toBe(true);
    board.set(5, createBoardItem('sprout'));
    expect(hasAnyMerge(board)).toBe(false);
  });
});
