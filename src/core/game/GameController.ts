import { getProducer, PRODUCERS } from '../../data/producers';
import { getItemDef } from '../../data/chains';
import { BoardState, type CellIndex } from '../board/BoardState';
import { commitMerge, canMergeItems, hasAnyMerge, findMergeablePairs } from '../merge/mergeLogic';
import { classifyBloomHit, getBloomTiming } from '../bloom/bloomLogic';
import { CompostController } from '../compost/compostLogic';
import { ProgressionState } from '../progression/ProgressionState';
import { PlayAnalytics } from '../analytics/PlayAnalytics';
import type { BloomOutcome } from '../../data/bloomConfig';
import type { GameSaveData } from '../save/SaveTypes';
import { createBoardItem } from '../items/types';
import {
  canFulfill,
  orderLabel,
  pickNextOrder,
  submitOrderItems,
  type ActiveOrder,
} from '../orders/WishJar';
import { accrueHopper, collectFromHopper, createHopperState, hopperCount, type HopperState } from '../offline/Hopper';
import { RestorationState } from '../restoration/RestorationState';

export type ToastKind = 'info' | 'warn' | 'success';

export interface GameEventMap {
  toast: { message: string; kind: ToastKind };
  spawned: { cell: CellIndex };
  moved: { from: CellIndex; to: CellIndex };
  mergeStarted: {
    from: CellIndex;
    to: CellIndex;
    needsBloom: boolean;
    nextItemId: string;
    fromTier: number;
  };
  bloomResolved: {
    cell: CellIndex;
    outcome: BloomOutcome;
    itemId: string;
    isPrismatic: boolean;
    xpGained: number;
    leveledUp: boolean;
    newLevel: number;
  };
  merged: {
    cell: CellIndex;
    itemId: string;
    isPrismatic: boolean;
    xpGained: number;
    leveledUp: boolean;
    newLevel: number;
  };
  composted: { cell: CellIndex };
  compostUndone: { cell: CellIndex };
  selectionChanged: { cell: CellIndex | null };
  boardFull: { hasMerges: boolean };
  highlightMerges: { pairs: Array<[CellIndex, CellIndex]> };
  xpChanged: { xp: number; level: number };
  orderChanged: { order: ActiveOrder | null };
  orderCompleted: { order: ActiveOrder; gold: number; xp: number };
  hopperChanged: { count: number };
  producerUnlocked: { producerId: string; name: string };
  restorationChanged: { stage: number; name?: string };
  stateChanged: undefined;
}

type Listener<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

export class GameController {
  board: BoardState;
  progression: ProgressionState;
  compost: CompostController;
  analytics: PlayAnalytics;
  muted: boolean;
  volume: number;
  bloomEncountered: boolean;
  unlockedProducers: Set<string>;
  activeOrder: ActiveOrder | null;
  completedOrderIds: string[];
  restoration: RestorationState;
  hopper: HopperState;
  selectedCell: CellIndex | null = null;
  inputLocked = false;

  private pendingBloom: {
    from: CellIndex;
    to: CellIndex;
    nextItemId: string;
    fromTier: number;
  } | null = null;

  private listeners: { [K in keyof GameEventMap]?: Listener<K>[] } = {};

  constructor(save?: GameSaveData) {
    this.board = save
      ? BoardState.fromJSON(save.board, save.boardCols, save.boardRows)
      : new BoardState();
    this.progression = new ProgressionState(save?.xp ?? 0, save?.gold ?? 0);
    this.compost = new CompostController();
    this.compost.compostCount = save?.compostCount ?? 0;
    this.analytics = new PlayAnalytics(save?.analytics);
    this.muted = save?.muted ?? false;
    this.volume = save?.volume ?? 1;
    this.bloomEncountered = save?.bloomEncountered ?? false;
    this.unlockedProducers = new Set(save?.unlockedProducers ?? ['seed_packet']);
    this.completedOrderIds = [...(save?.completedOrderIds ?? [])];
    this.restoration = new RestorationState(save?.restorationCompleted ?? []);
    this.hopper = save?.hopper ? { ...save.hopper, queue: [...save.hopper.queue] } : createHopperState();
    this.activeOrder = save?.activeOrder ?? null;

    this.syncProducerUnlocks(false);
    this.accrueOffline(Date.now());
    if (!this.activeOrder) {
      this.activeOrder = pickNextOrder(this.progression.level, this.completedOrderIds);
    }
  }

  on<K extends keyof GameEventMap>(event: K, fn: Listener<K>): () => void {
    const list = (this.listeners[event] ??= []) as Listener<K>[];
    list.push(fn);
    return () => {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  private emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const list = this.listeners[event] as Listener<K>[] | undefined;
    list?.forEach((fn) => fn(payload));
  }

  private toast(message: string, kind: ToastKind = 'info'): void {
    this.emit('toast', { message, kind });
  }

  isProducerUnlocked(id: string): boolean {
    return this.unlockedProducers.has(id);
  }

  private syncProducerUnlocks(announce: boolean): void {
    const level = this.progression.level;
    for (const p of PRODUCERS) {
      if (level >= p.unlockLevel && !this.unlockedProducers.has(p.id)) {
        this.unlockedProducers.add(p.id);
        if (announce) {
          this.emit('producerUnlocked', { producerId: p.id, name: p.name });
          this.toast(`Unlocked: ${p.name}!`, 'success');
        }
      }
    }
  }

  accrueOffline(now = Date.now()): void {
    const before = hopperCount(this.hopper);
    this.hopper = accrueHopper(this.hopper, [...this.unlockedProducers], now);
    const after = hopperCount(this.hopper);
    if (after !== before) {
      this.emit('hopperChanged', { count: after });
    }
  }

  collectHopper(): number {
    if (this.inputLocked) return 0;
    this.accrueOffline();
    const empty = this.board.emptyIndices().length;
    if (empty === 0) {
      this.toast('Board full — free space to collect Hopper.', 'warn');
      return 0;
    }
    const { collected, state } = collectFromHopper(this.hopper, empty);
    this.hopper = state;
    for (const itemId of collected) {
      this.board.spawnAtRandomEmpty(itemId);
    }
    this.emit('hopperChanged', { count: hopperCount(this.hopper) });
    this.emit('stateChanged', undefined);
    if (collected.length > 0) this.toast(`Collected ${collected.length} from Hopper`, 'success');
    return collected.length;
  }

  tapProducer(producerId: string): boolean {
    if (this.inputLocked) return false;
    const producer = getProducer(producerId);
    if (!producer || !this.isProducerUnlocked(producerId)) return false;
    if (this.board.isFull()) {
      this.analytics.recordBoardFull();
      const merges = hasAnyMerge(this.board);
      this.emit('boardFull', { hasMerges: merges });
      if (merges) {
        this.toast('Board full — merge or compost to make space.', 'warn');
        this.emit('highlightMerges', { pairs: findMergeablePairs(this.board) });
      } else {
        this.toast('No merges available — compost an item to make space.', 'warn');
      }
      this.emit('stateChanged', undefined);
      return false;
    }
    const cell = this.board.spawnAtRandomEmpty(producer.outputItemId);
    if (cell === null) return false;
    this.selectedCell = null;
    this.emit('selectionChanged', { cell: null });
    this.emit('spawned', { cell });
    this.emit('stateChanged', undefined);
    return true;
  }

  selectCell(cell: CellIndex): void {
    if (this.inputLocked) return;
    const item = this.board.get(cell);
    if (!item) {
      this.selectedCell = null;
      this.emit('selectionChanged', { cell: null });
      return;
    }
    if (this.selectedCell === null) {
      this.selectedCell = cell;
      this.emit('selectionChanged', { cell });
      return;
    }
    if (this.selectedCell === cell) {
      this.selectedCell = null;
      this.emit('selectionChanged', { cell: null });
      return;
    }
    const a = this.board.get(this.selectedCell);
    const b = item;
    if (a && canMergeItems(a, b).ok) {
      const from = this.selectedCell;
      this.selectedCell = null;
      this.emit('selectionChanged', { cell: null });
      this.tryMerge(from, cell);
      return;
    }
    this.selectedCell = cell;
    this.emit('selectionChanged', { cell });
  }

  moveItem(from: CellIndex, to: CellIndex): boolean {
    if (this.inputLocked) return false;
    if (!this.board.move(from, to)) return false;
    this.selectedCell = null;
    this.emit('selectionChanged', { cell: null });
    this.emit('moved', { from, to });
    this.emit('stateChanged', undefined);
    return true;
  }

  tryMerge(from: CellIndex, to: CellIndex): boolean {
    if (this.inputLocked) return false;
    const a = this.board.get(from);
    const b = this.board.get(to);
    if (!a || !b) return false;
    const check = canMergeItems(a, b);
    if (!check.ok || !check.nextItemId || check.fromTier === undefined) return false;

    if (check.bloomEligible) {
      this.inputLocked = true;
      this.pendingBloom = {
        from,
        to,
        nextItemId: check.nextItemId,
        fromTier: check.fromTier,
      };
      this.emit('mergeStarted', {
        from,
        to,
        needsBloom: true,
        nextItemId: check.nextItemId,
        fromTier: check.fromTier,
      });
      return true;
    }

    return this.finalizeMerge(from, to, false, undefined);
  }

  resolveBloom(position: number): void {
    if (!this.pendingBloom) return;
    const { from, to } = this.pendingBloom;
    const timing = getBloomTiming(!this.bloomEncountered);
    const outcome = classifyBloomHit(position, timing);
    this.bloomEncountered = true;
    this.analytics.recordBloom(outcome === 'perfect');
    const prismatic = outcome === 'perfect';
    this.pendingBloom = null;
    this.finalizeMerge(from, to, prismatic, outcome);
  }

  cancelBloomAsMiss(): void {
    if (!this.pendingBloom) return;
    const { from, to } = this.pendingBloom;
    this.bloomEncountered = true;
    this.analytics.recordBloom(false);
    this.pendingBloom = null;
    this.finalizeMerge(from, to, false, 'miss');
  }

  getBloomTimingForUi() {
    return getBloomTiming(!this.bloomEncountered);
  }

  private finalizeMerge(
    from: CellIndex,
    to: CellIndex,
    prismatic: boolean,
    bloom: BloomOutcome | undefined,
  ): boolean {
    const result = commitMerge(this.board, from, to, prismatic);
    if (!result.ok) {
      this.inputLocked = false;
      return false;
    }
    const def = getItemDef(result.resultItem.itemId);
    const tier = def?.tier ?? 1;
    const award = this.progression.awardMerge(tier, bloom);
    this.analytics.recordMerge();
    this.inputLocked = false;
    this.syncProducerUnlocks(true);

    if (bloom) {
      this.emit('bloomResolved', {
        cell: result.resultCell,
        outcome: bloom,
        itemId: result.resultItem.itemId,
        isPrismatic: result.resultItem.isPrismatic,
        xpGained: award.gained,
        leveledUp: award.leveledUp,
        newLevel: award.newLevel,
      });
    } else {
      this.emit('merged', {
        cell: result.resultCell,
        itemId: result.resultItem.itemId,
        isPrismatic: result.resultItem.isPrismatic,
        xpGained: award.gained,
        leveledUp: award.leveledUp,
        newLevel: award.newLevel,
      });
    }

    this.emit('xpChanged', { xp: this.progression.xp, level: this.progression.level });
    this.emit('stateChanged', undefined);
    return true;
  }

  requestCompost(cell: CellIndex, confirmedPrismatic = false): boolean {
    if (this.inputLocked) return false;
    const item = this.board.get(cell);
    if (!item) return false;
    if (item.isPrismatic && !confirmedPrismatic) return false;
    const now = Date.now();
    const entry = this.compost.compost(this.board, cell, now);
    if (!entry) return false;
    this.analytics.recordCompost();
    this.selectedCell = null;
    this.emit('selectionChanged', { cell: null });
    this.emit('composted', { cell });
    this.emit('stateChanged', undefined);
    return true;
  }

  undoCompost(): boolean {
    if (this.inputLocked) return false;
    const cell = this.compost.undo(this.board, Date.now());
    if (cell === null) return false;
    this.emit('compostUndone', { cell });
    this.emit('stateChanged', undefined);
    return true;
  }

  getOrderProgress(): { have: number; need: number; label: string } {
    if (!this.activeOrder) return { have: 0, need: 0, label: '—' };
    let have = 0;
    for (let i = 0; i < this.board.cells.length; i++) {
      const item = this.board.get(i);
      if (!item) continue;
      if (item.itemId !== this.activeOrder.itemId) continue;
      if (this.activeOrder.requirePrismatic && !item.isPrismatic) continue;
      have++;
    }
    return {
      have: Math.min(have, this.activeOrder.quantity),
      need: this.activeOrder.quantity,
      label: orderLabel(this.activeOrder),
    };
  }

  submitWishJar(): boolean {
    if (this.inputLocked || !this.activeOrder) return false;
    if (!canFulfill(this.board, this.activeOrder)) {
      this.toast('Not enough matching items on the board.', 'warn');
      return false;
    }
    const order = this.activeOrder;
    submitOrderItems(this.board, order);
    this.progression.addGold(order.goldReward);
    const lvl = this.progression.awardXp(order.xpReward);
    this.completedOrderIds.push(order.templateId);
    if (this.completedOrderIds.length > 20) this.completedOrderIds.shift();
    this.emit('orderCompleted', { order, gold: order.goldReward, xp: order.xpReward });
    this.activeOrder = pickNextOrder(this.progression.level, this.completedOrderIds);
    this.syncProducerUnlocks(true);
    this.emit('orderChanged', { order: this.activeOrder });
    this.emit('xpChanged', { xp: this.progression.xp, level: this.progression.level });
    this.toast(`Wish fulfilled! +${order.goldReward} gold`, 'success');
    if (lvl.leveledUp) this.toast(`Garden Level ${lvl.newLevel}!`, 'success');
    this.emit('stateChanged', undefined);
    return true;
  }

  purchaseRestoration(): boolean {
    if (this.inputLocked) return false;
    const result = this.restoration.purchase(this.progression.gold);
    if (!result) {
      const next = this.restoration.next();
      if (!next) this.toast('Garden fully restored!', 'info');
      else this.toast(`Need ${next.goldCost} gold for ${next.name}.`, 'warn');
      return false;
    }
    this.progression.gold = result.gold;
    this.emit('restorationChanged', { stage: this.restoration.stage, name: result.milestone.name });
    this.toast(`Restored: ${result.milestone.name}`, 'success');
    this.emit('stateChanged', undefined);
    return true;
  }

  tick(now = Date.now()): void {
    this.compost.tick(now);
  }

  toSaveData(): GameSaveData {
    return {
      schemaVersion: 1,
      xp: this.progression.xp,
      gold: this.progression.gold,
      board: this.board.toJSON(),
      boardCols: this.board.cols,
      boardRows: this.board.rows,
      muted: this.muted,
      volume: this.volume,
      bloomEncountered: this.bloomEncountered,
      compostCount: this.compost.compostCount,
      analytics: this.analytics.snapshot(),
      savedAt: Date.now(),
      unlockedProducers: [...this.unlockedProducers],
      activeOrder: this.activeOrder,
      completedOrderIds: [...this.completedOrderIds],
      restorationCompleted: [...this.restoration.completed],
      hopper: { ...this.hopper, queue: [...this.hopper.queue] },
    };
  }

  forcePlace(cell: CellIndex, itemId: string, isPrismatic = false): void {
    this.board.set(cell, createBoardItem(itemId, isPrismatic));
  }
}
