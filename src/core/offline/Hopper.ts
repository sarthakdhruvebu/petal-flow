import { HOPPER_MAX_MS } from '../../data/hopper';
import { getProducer, type ProducerDef } from '../../data/producers';

export interface HopperState {
  /** Queued output item ids waiting to be collected */
  queue: string[];
  /** Last accumulation timestamp (ms) */
  lastAccruedAt: number;
}

export function createHopperState(now = Date.now()): HopperState {
  return { queue: [], lastAccruedAt: now };
}

/**
 * Accrue offline production for unlocked producers.
 * Clock rollback ⇒ grant zero additional items (lastAccruedAt clamped forward).
 */
export function accrueHopper(
  state: HopperState,
  unlockedProducerIds: string[],
  now: number,
): HopperState {
  if (now < state.lastAccruedAt) {
    return { ...state, lastAccruedAt: now };
  }

  const elapsed = Math.min(HOPPER_MAX_MS, now - state.lastAccruedAt);
  if (elapsed <= 0) return { ...state };

  const queue = [...state.queue];
  for (const id of unlockedProducerIds) {
    const producer = getProducer(id);
    if (!producer) continue;
    const ratePerMs = producer.offlinePerHour / (60 * 60 * 1000);
    const produced = Math.floor(elapsed * ratePerMs);
    if (produced <= 0) continue;
    const currentForProducer = queue.filter((q) => q === producer.outputItemId).length;
    const room = Math.max(0, producer.hopperCap - currentForProducer);
    const add = Math.min(produced, room);
    for (let i = 0; i < add; i++) queue.push(producer.outputItemId);
  }

  return { queue, lastAccruedAt: now };
}

/** Collect up to `limit` items (or all that fit). Returns collected item ids. */
export function collectFromHopper(state: HopperState, limit: number): {
  collected: string[];
  state: HopperState;
} {
  const n = Math.max(0, Math.min(limit, state.queue.length));
  const collected = state.queue.slice(0, n);
  return {
    collected,
    state: { queue: state.queue.slice(n), lastAccruedAt: state.lastAccruedAt },
  };
}

export function hopperCount(state: HopperState): number {
  return state.queue.length;
}

export function hopperBreakdown(state: HopperState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of state.queue) out[id] = (out[id] ?? 0) + 1;
  return out;
}

export function producerCapTotal(producers: ProducerDef[]): number {
  return producers.reduce((n, p) => n + p.hopperCap, 0);
}
