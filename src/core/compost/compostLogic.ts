import type { BoardItem } from '../items/types';
import type { BoardState, CellIndex } from '../board/BoardState';

export const COMPOST_UNDO_MS = 5000;

export interface CompostEntry {
  item: BoardItem;
  fromCell: CellIndex;
  expiresAt: number;
}

export class CompostController {
  pending: CompostEntry | null = null;
  compostCount = 0;

  /** Stage a compost; item removed from board. Returns false if cell empty. */
  compost(board: BoardState, cell: CellIndex, now: number): CompostEntry | null {
    const item = board.get(cell);
    if (!item) return null;
    // Finalize previous pending without undo
    this.finalizePending();
    board.set(cell, null);
    this.pending = { item, fromCell: cell, expiresAt: now + COMPOST_UNDO_MS };
    this.compostCount += 1;
    return this.pending;
  }

  canUndo(now: number): boolean {
    return !!this.pending && now < this.pending.expiresAt;
  }

  /**
   * Restore pending item. Prefer original cell if empty, else first empty.
   * If board full, keep pending and return null.
   */
  undo(board: BoardState, now: number): CellIndex | null {
    if (!this.canUndo(now) || !this.pending) return null;
    const { item, fromCell } = this.pending;
    let target: CellIndex | null = null;
    if (board.get(fromCell) === null) target = fromCell;
    else {
      const empty = board.emptyIndices();
      if (empty.length === 0) return null;
      target = empty[0];
    }
    board.set(target, item);
    this.compostCount = Math.max(0, this.compostCount - 1);
    this.pending = null;
    return target;
  }

  tick(now: number): void {
    if (this.pending && now >= this.pending.expiresAt) {
      this.finalizePending();
    }
  }

  finalizePending(): void {
    this.pending = null;
  }

  needsPrismaticConfirm(board: BoardState, cell: CellIndex): boolean {
    return board.get(cell)?.isPrismatic === true;
  }
}
