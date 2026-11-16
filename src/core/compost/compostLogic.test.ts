import { describe, expect, it } from 'vitest';
import { BoardState } from '../board/BoardState';
import { createBoardItem } from '../items/types';
import { COMPOST_UNDO_MS, CompostController } from './compostLogic';

describe('CompostController', () => {
  it('removes item and supports undo into original cell', () => {
    const board = new BoardState();
    board.set(3, createBoardItem('leaf'));
    const compost = new CompostController();
    const now = 1000;
    compost.compost(board, 3, now);
    expect(board.get(3)).toBeNull();
    expect(compost.compostCount).toBe(1);
    const restored = compost.undo(board, now + 1000);
    expect(restored).toBe(3);
    expect(board.get(3)?.itemId).toBe('leaf');
  });

  it('expires undo after window', () => {
    const board = new BoardState();
    board.set(1, createBoardItem('sprout'));
    const compost = new CompostController();
    const now = 0;
    compost.compost(board, 1, now);
    compost.tick(now + COMPOST_UNDO_MS + 1);
    expect(compost.undo(board, now + COMPOST_UNDO_MS + 1)).toBeNull();
  });

  it('flags prismatic confirm', () => {
    const board = new BoardState();
    board.set(0, createBoardItem('flower', true));
    const compost = new CompostController();
    expect(compost.needsPrismaticConfirm(board, 0)).toBe(true);
  });
});
