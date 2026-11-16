import { describe, expect, it } from 'vitest';
import { BoardState } from '../board/BoardState';
import { createBoardItem } from '../items/types';
import { canFulfill, createOrderFromTemplate, submitOrderItems } from './WishJar';
import { ORDER_TEMPLATES } from '../../data/orders';

describe('WishJar', () => {
  it('fulfills and removes matching items', () => {
    const order = createOrderFromTemplate(ORDER_TEMPLATES.find((t) => t.id === 'leaves_2')!);
    const board = new BoardState();
    board.set(0, createBoardItem('leaf'));
    board.set(1, createBoardItem('leaf'));
    board.set(2, createBoardItem('sprout'));
    expect(canFulfill(board, order)).toBe(true);
    submitOrderItems(board, order);
    expect(board.get(0)).toBeNull();
    expect(board.get(1)).toBeNull();
    expect(board.get(2)?.itemId).toBe('sprout');
  });

  it('requires prismatic when flagged', () => {
    const order = createOrderFromTemplate(ORDER_TEMPLATES.find((t) => t.id === 'prism_flower_1')!);
    const board = new BoardState();
    board.set(0, createBoardItem('flower', false));
    expect(canFulfill(board, order)).toBe(false);
    board.set(0, createBoardItem('flower', true));
    expect(canFulfill(board, order)).toBe(true);
  });
});
