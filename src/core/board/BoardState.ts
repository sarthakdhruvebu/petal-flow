import { BOARD } from '../../config/gameConfig';
import { createBoardItem, type BoardItem } from '../items/types';

export type CellIndex = number;

export class BoardState {
  readonly cols: number;
  readonly rows: number;
  readonly cells: (BoardItem | null)[];

  constructor(cols = BOARD.cols, rows = BOARD.rows, cells?: (BoardItem | null)[]) {
    this.cols = cols;
    this.rows = rows;
    this.cells = cells ? [...cells] : Array.from({ length: cols * rows }, () => null);
  }

  get size(): number {
    return this.cols * this.rows;
  }

  index(col: number, row: number): CellIndex {
    return row * this.cols + col;
  }

  colRow(index: CellIndex): { col: number; row: number } {
    return { col: index % this.cols, row: Math.floor(index / this.cols) };
  }

  get(index: CellIndex): BoardItem | null {
    return this.cells[index] ?? null;
  }

  set(index: CellIndex, item: BoardItem | null): void {
    this.cells[index] = item;
  }

  emptyIndices(): CellIndex[] {
    const out: CellIndex[] = [];
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === null) out.push(i);
    }
    return out;
  }

  isFull(): boolean {
    return this.emptyIndices().length === 0;
  }

  countItems(): number {
    return this.cells.reduce((n, c) => n + (c ? 1 : 0), 0);
  }

  spawnAtRandomEmpty(itemId: string, rng: () => number = Math.random): CellIndex | null {
    const empty = this.emptyIndices();
    if (empty.length === 0) return null;
    const pick = empty[Math.floor(rng() * empty.length)];
    this.set(pick, createBoardItem(itemId, false));
    return pick;
  }

  move(from: CellIndex, to: CellIndex): boolean {
    if (from === to) return false;
    const item = this.get(from);
    if (!item || this.get(to) !== null) return false;
    this.set(to, item);
    this.set(from, null);
    return true;
  }

  clone(): BoardState {
    return new BoardState(
      this.cols,
      this.rows,
      this.cells.map((c) => (c ? { ...c } : null)),
    );
  }

  toJSON(): (BoardItem | null)[] {
    return this.cells.map((c) => (c ? { ...c } : null));
  }

  static fromJSON(cells: (BoardItem | null)[], cols = BOARD.cols, rows = BOARD.rows): BoardState {
    return new BoardState(cols, rows, cells);
  }
}
