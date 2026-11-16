import { describe, expect, it } from 'vitest';
import { RestorationState } from './RestorationState';

describe('RestorationState', () => {
  it('purchases milestones in order when gold sufficient', () => {
    const r = new RestorationState();
    const first = r.purchase(100);
    expect(first?.milestone.id).toBe('clear_debris');
    expect(r.stage).toBe(1);
    expect(first?.gold).toBe(80);
  });

  it('rejects insufficient gold', () => {
    const r = new RestorationState();
    expect(r.purchase(5)).toBeNull();
    expect(r.completed).toHaveLength(0);
  });
});
