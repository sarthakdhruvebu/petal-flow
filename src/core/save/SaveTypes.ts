import type { BoardItem } from '../items/types';
import type { ActiveOrder } from '../orders/WishJar';
import type { HopperState } from '../offline/Hopper';
import { createHopperState } from '../offline/Hopper';

export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_KEY = 'petal_flow_save_v1';

export interface AnalyticsSnapshot {
  sessionStartedAt: number;
  timeToFirstMergeMs: number | null;
  timeToFirstBloomMs: number | null;
  mergeCount: number;
  bloomCount: number;
  perfectCount: number;
  compostCount: number;
  boardFullCount: number;
}

export interface GameSaveData {
  schemaVersion: number;
  xp: number;
  gold: number;
  board: (BoardItem | null)[];
  boardCols: number;
  boardRows: number;
  muted: boolean;
  volume: number;
  bloomEncountered: boolean;
  compostCount: number;
  analytics: AnalyticsSnapshot;
  savedAt: number;
  /** Phase C */
  unlockedProducers: string[];
  activeOrder: ActiveOrder | null;
  completedOrderIds: string[];
  restorationCompleted: string[];
  hopper: HopperState;
}

export function createDefaultAnalytics(now = Date.now()): AnalyticsSnapshot {
  return {
    sessionStartedAt: now,
    timeToFirstMergeMs: null,
    timeToFirstBloomMs: null,
    mergeCount: 0,
    bloomCount: 0,
    perfectCount: 0,
    compostCount: 0,
    boardFullCount: 0,
  };
}

export function createDefaultSave(now = Date.now()): GameSaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    xp: 0,
    gold: 0,
    board: Array.from({ length: 49 }, () => null),
    boardCols: 7,
    boardRows: 7,
    muted: false,
    volume: 1,
    bloomEncountered: false,
    compostCount: 0,
    analytics: createDefaultAnalytics(now),
    savedAt: now,
    unlockedProducers: ['seed_packet'],
    activeOrder: null,
    completedOrderIds: [],
    restorationCompleted: [],
    hopper: createHopperState(now),
  };
}

function validateOrder(raw: unknown): ActiveOrder | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ActiveOrder>;
  if (typeof o.templateId !== 'string' || typeof o.itemId !== 'string') return null;
  if (typeof o.quantity !== 'number' || o.quantity < 1) return null;
  if (typeof o.goldReward !== 'number' || typeof o.xpReward !== 'number') return null;
  return {
    templateId: o.templateId,
    itemId: o.itemId,
    quantity: o.quantity,
    goldReward: o.goldReward,
    xpReward: o.xpReward,
    requirePrismatic: !!o.requirePrismatic,
    optional: !!o.optional,
  };
}

function validateHopper(raw: unknown, now: number): HopperState {
  if (!raw || typeof raw !== 'object') return createHopperState(now);
  const h = raw as Partial<HopperState>;
  const queue = Array.isArray(h.queue) ? h.queue.filter((x): x is string => typeof x === 'string') : [];
  const lastAccruedAt = typeof h.lastAccruedAt === 'number' ? h.lastAccruedAt : now;
  return { queue, lastAccruedAt };
}

export function validateSave(raw: unknown): GameSaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<GameSaveData>;
  if (s.schemaVersion !== SAVE_SCHEMA_VERSION) return null;
  if (typeof s.xp !== 'number' || s.xp < 0) return null;
  if (typeof s.gold !== 'number' || s.gold < 0) return null;
  if (!Array.isArray(s.board) || s.board.length !== 49) return null;
  if (typeof s.muted !== 'boolean') return null;
  if (typeof s.bloomEncountered !== 'boolean') return null;

  const defaults = createDefaultSave();
  return {
    ...defaults,
    ...s,
    schemaVersion: SAVE_SCHEMA_VERSION,
    board: s.board.map((c) => {
      if (!c) return null;
      if (typeof c !== 'object') return null;
      const item = c as BoardItem;
      if (typeof item.uid !== 'string' || typeof item.itemId !== 'string') return null;
      return {
        uid: item.uid,
        itemId: item.itemId,
        isPrismatic: !!item.isPrismatic,
      };
    }),
    analytics: {
      ...createDefaultAnalytics(),
      ...(s.analytics ?? {}),
    },
    unlockedProducers: Array.isArray(s.unlockedProducers)
      ? s.unlockedProducers.filter((x): x is string => typeof x === 'string')
      : defaults.unlockedProducers,
    activeOrder: s.activeOrder === null ? null : validateOrder(s.activeOrder) ?? null,
    completedOrderIds: Array.isArray(s.completedOrderIds)
      ? s.completedOrderIds.filter((x): x is string => typeof x === 'string')
      : [],
    restorationCompleted: Array.isArray(s.restorationCompleted)
      ? s.restorationCompleted.filter((x): x is string => typeof x === 'string')
      : [],
    hopper: validateHopper(s.hopper, Date.now()),
  };
}
