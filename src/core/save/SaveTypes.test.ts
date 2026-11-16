import { describe, expect, it } from 'vitest';
import { createDefaultSave, validateSave } from './SaveTypes';

describe('save validation', () => {
  it('accepts default save', () => {
    const save = createDefaultSave();
    expect(validateSave(save)).not.toBeNull();
  });

  it('rejects wrong schema or board size', () => {
    expect(validateSave({ ...createDefaultSave(), schemaVersion: 99 })).toBeNull();
    expect(validateSave({ ...createDefaultSave(), board: [] })).toBeNull();
  });

  it('round-trips board items', () => {
    const save = createDefaultSave();
    save.board[0] = { uid: 'i1', itemId: 'sprout', isPrismatic: false };
    const v = validateSave(JSON.parse(JSON.stringify(save)));
    expect(v?.board[0]?.itemId).toBe('sprout');
  });
});
