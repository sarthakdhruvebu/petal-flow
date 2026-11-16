import { getItemDef, getNextItemDef } from '../../data/chains';
import { createBoardItem, type BoardItem } from '../items/types';
import type { BoardState, CellIndex } from '../board/BoardState';

export interface MergeValidation {
  ok: boolean;
  reason?: string;
  fromTier?: number;
  nextItemId?: string;
  bloomEligible?: boolean;
}

export function canMergeItems(a: BoardItem, b: BoardItem): MergeValidation {
  const da = getItemDef(a.itemId);
  const db = getItemDef(b.itemId);
  if (!da || !db) return { ok: false, reason: 'unknown_item' };
  if (da.chainId !== db.chainId) return { ok: false, reason: 'different_chain' };
  if (da.tier !== db.tier) return { ok: false, reason: 'different_tier' };
  const next = getNextItemDef(a.itemId);
  if (!next) return { ok: false, reason: 'max_tier' };
  return {
    ok: true,
    fromTier: da.tier,
    nextItemId: next.id,
    bloomEligible: da.bloomEligible,
  };
}

export interface MergeCommitResult {
  ok: true;
  resultCell: CellIndex;
  removedCell: CellIndex;
  resultItem: BoardItem;
  fromTier: number;
  bloomEligible: boolean;
  nextItemId: string;
}

export interface MergeCommitFail {
  ok: false;
  reason: string;
}

/**
 * Removes source items and places a provisional result (normal next tier).
 * Caller may upgrade to Prismatic after Bloom Perfect.
 */
export function commitMerge(
  board: BoardState,
  from: CellIndex,
  to: CellIndex,
  makePrismatic = false,
): MergeCommitResult | MergeCommitFail {
  const a = board.get(from);
  const b = board.get(to);
  if (!a || !b) return { ok: false, reason: 'empty_cell' };
  const check = canMergeItems(a, b);
  if (!check.ok || !check.nextItemId || check.fromTier === undefined) {
    return { ok: false, reason: check.reason ?? 'invalid' };
  }
  const result = createBoardItem(check.nextItemId, makePrismatic);
  board.set(from, null);
  board.set(to, result);
  return {
    ok: true,
    resultCell: to,
    removedCell: from,
    resultItem: result,
    fromTier: check.fromTier,
    bloomEligible: !!check.bloomEligible,
    nextItemId: check.nextItemId,
  };
}

export function findMergeablePairs(board: BoardState): Array<[CellIndex, CellIndex]> {
  const pairs: Array<[CellIndex, CellIndex]> = [];
  const occupied: CellIndex[] = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (board.get(i)) occupied.push(i);
  }
  for (let i = 0; i < occupied.length; i++) {
    for (let j = i + 1; j < occupied.length; j++) {
      const a = board.get(occupied[i])!;
      const b = board.get(occupied[j])!;
      if (canMergeItems(a, b).ok) pairs.push([occupied[i], occupied[j]]);
    }
  }
  return pairs;
}

export function hasAnyMerge(board: BoardState): boolean {
  return findMergeablePairs(board).length > 0;
}
