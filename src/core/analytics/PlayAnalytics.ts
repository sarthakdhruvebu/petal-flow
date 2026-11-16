import { createDefaultAnalytics, type AnalyticsSnapshot } from '../save/SaveTypes';

export class PlayAnalytics {
  data: AnalyticsSnapshot;

  constructor(snapshot?: AnalyticsSnapshot) {
    this.data = snapshot ? { ...snapshot } : createDefaultAnalytics();
  }

  recordMerge(now = Date.now()): void {
    this.data.mergeCount += 1;
    if (this.data.timeToFirstMergeMs === null) {
      this.data.timeToFirstMergeMs = now - this.data.sessionStartedAt;
    }
  }

  recordBloom(perfect: boolean, now = Date.now()): void {
    this.data.bloomCount += 1;
    if (perfect) this.data.perfectCount += 1;
    if (this.data.timeToFirstBloomMs === null) {
      this.data.timeToFirstBloomMs = now - this.data.sessionStartedAt;
    }
  }

  recordCompost(): void {
    this.data.compostCount += 1;
  }

  recordBoardFull(): void {
    this.data.boardFullCount += 1;
  }

  perfectRate(): number {
    if (this.data.bloomCount === 0) return 0;
    return this.data.perfectCount / this.data.bloomCount;
  }

  snapshot(): AnalyticsSnapshot {
    return { ...this.data };
  }
}
