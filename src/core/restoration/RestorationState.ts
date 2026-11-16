import { RESTORATION_MILESTONES, type RestorationMilestone } from '../../data/restoration';

export class RestorationState {
  /** Completed milestone ids in order */
  completed: string[];

  constructor(completed: string[] = []) {
    this.completed = [...completed];
  }

  get stage(): number {
    if (this.completed.length === 0) return 0;
    const last = this.completed[this.completed.length - 1];
    return RESTORATION_MILESTONES.find((m) => m.id === last)?.stage ?? this.completed.length;
  }

  next(): RestorationMilestone | null {
    return RESTORATION_MILESTONES.find((m) => !this.completed.includes(m.id)) ?? null;
  }

  isComplete(id: string): boolean {
    return this.completed.includes(id);
  }

  canPurchase(gold: number): { ok: boolean; milestone: RestorationMilestone | null; reason?: string } {
    const milestone = this.next();
    if (!milestone) return { ok: false, milestone: null, reason: 'all_done' };
    if (gold < milestone.goldCost) return { ok: false, milestone, reason: 'insufficient_gold' };
    return { ok: true, milestone };
  }

  purchase(gold: number): { gold: number; milestone: RestorationMilestone } | null {
    const check = this.canPurchase(gold);
    if (!check.ok || !check.milestone) return null;
    this.completed.push(check.milestone.id);
    return { gold: gold - check.milestone.goldCost, milestone: check.milestone };
  }
}
