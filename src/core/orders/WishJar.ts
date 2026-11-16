import { ORDER_TEMPLATES, type OrderTemplate } from '../../data/orders';
import { getItemDef } from '../../data/chains';
import type { BoardState, CellIndex } from '../board/BoardState';

export interface ActiveOrder {
  templateId: string;
  itemId: string;
  quantity: number;
  goldReward: number;
  xpReward: number;
  requirePrismatic: boolean;
  optional: boolean;
}

export function createOrderFromTemplate(t: OrderTemplate): ActiveOrder {
  return {
    templateId: t.id,
    itemId: t.itemId,
    quantity: t.quantity,
    goldReward: t.goldReward,
    xpReward: t.xpReward,
    requirePrismatic: !!t.requirePrismatic,
    optional: !!t.optional,
  };
}

export function pickNextOrder(
  level: number,
  completedIds: string[],
  rng: () => number = Math.random,
): ActiveOrder {
  const pool = ORDER_TEMPLATES.filter((t) => t.minLevel <= level);
  // Prefer not-recently-completed, but allow repeats if pool small
  const fresh = pool.filter((t) => !completedIds.includes(t.id));
  const use = fresh.length > 0 ? fresh : pool;
  const pick = use[Math.floor(rng() * use.length)] ?? ORDER_TEMPLATES[0];
  return createOrderFromTemplate(pick);
}

export function countMatchingOnBoard(
  board: BoardState,
  order: ActiveOrder,
): { count: number; cells: CellIndex[] } {
  const cells: CellIndex[] = [];
  for (let i = 0; i < board.cells.length; i++) {
    const item = board.get(i);
    if (!item) continue;
    if (item.itemId !== order.itemId) continue;
    if (order.requirePrismatic && !item.isPrismatic) continue;
    cells.push(i);
  }
  return { count: cells.length, cells };
}

export function canFulfill(board: BoardState, order: ActiveOrder): boolean {
  return countMatchingOnBoard(board, order).count >= order.quantity;
}

/** Removes up to quantity matching items. Returns removed cell indices. */
export function submitOrderItems(board: BoardState, order: ActiveOrder): CellIndex[] {
  const { cells } = countMatchingOnBoard(board, order);
  const take = cells.slice(0, order.quantity);
  for (const c of take) board.set(c, null);
  return take;
}

export function orderLabel(order: ActiveOrder): string {
  const def = getItemDef(order.itemId);
  const name = def?.displayName ?? order.itemId;
  const prism = order.requirePrismatic ? 'Prismatic ' : '';
  return `${order.quantity}× ${prism}${name}`;
}
