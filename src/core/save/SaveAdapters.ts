import { SAVE_KEY, validateSave, type GameSaveData } from './SaveTypes';

export interface SaveAdapter {
  load(): Promise<GameSaveData | null>;
  save(data: GameSaveData): Promise<void>;
}

export class LocalSaveAdapter implements SaveAdapter {
  constructor(private key = SAVE_KEY) {}

  loadSync(): GameSaveData | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      return validateSave(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }

  async load(): Promise<GameSaveData | null> {
    return this.loadSync();
  }

  async save(data: GameSaveData): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
}

interface BridgeStorage {
  get: (keys: string[] | string, tryParseJson?: boolean) => Promise<unknown>;
  set: (data: Record<string, unknown>) => Promise<unknown>;
}

function getBridgeStorage(): BridgeStorage | null {
  const bridge = (typeof window !== 'undefined' ? window.bridge : undefined) as
    | { storage?: BridgeStorage }
    | undefined;
  if (!bridge?.storage?.get || !bridge.storage?.set) return null;
  return bridge.storage;
}

/**
 * Playgama Bridge Storage. Falls back to LocalSaveAdapter when Bridge is absent.
 * Never writes invalid data over a good local save without validation.
 */
export class PlaygamaSaveAdapter implements SaveAdapter {
  private local = new LocalSaveAdapter();

  async load(): Promise<GameSaveData | null> {
    const storage = getBridgeStorage();
    if (!storage) return this.local.load();
    try {
      const raw = await storage.get([SAVE_KEY], true);
      let value: unknown = null;
      if (Array.isArray(raw)) value = raw[0];
      else if (raw && typeof raw === 'object' && SAVE_KEY in (raw as object)) {
        value = (raw as Record<string, unknown>)[SAVE_KEY];
      } else {
        value = raw;
      }
      if (value == null) {
        // Prefer local fallback if Bridge empty (dev hybrid)
        return this.local.load();
      }
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          return this.local.load();
        }
      }
      const validated = validateSave(value);
      return validated ?? this.local.load();
    } catch {
      return this.local.load();
    }
  }

  async save(data: GameSaveData): Promise<void> {
    const validated = validateSave(data);
    if (!validated) return; // never persist invalid
    // Always mirror locally for standalone recovery
    await this.local.save(validated);
    const storage = getBridgeStorage();
    if (!storage) return;
    try {
      await storage.set({ [SAVE_KEY]: validated });
    } catch {
      // local already saved
    }
  }
}

export function createSaveAdapter(preferBridge: boolean): SaveAdapter {
  if (preferBridge && getBridgeStorage()) return new PlaygamaSaveAdapter();
  return new LocalSaveAdapter();
}
