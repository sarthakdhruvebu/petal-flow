import { LocalSaveAdapter, createSaveAdapter, type SaveAdapter } from './SaveAdapters';
import { createDefaultSave, type GameSaveData } from './SaveTypes';
import { platformService } from '../../platform/PlatformService';

export class SaveService {
  private adapter: SaveAdapter;
  private local: LocalSaveAdapter | null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: GameSaveData | null = null;

  constructor(adapter?: SaveAdapter) {
    this.adapter = adapter ?? createSaveAdapter(platformService.hasBridge);
    this.local = this.adapter instanceof LocalSaveAdapter ? this.adapter : new LocalSaveAdapter();
  }

  loadOrDefaultSync(): GameSaveData {
    // Sync path always uses local for Phaser create(); async Bridge merge can happen later
    const loaded = this.local?.loadSync() ?? null;
    return loaded ?? createDefaultSave();
  }

  async loadOrDefault(): Promise<GameSaveData> {
    const loaded = await this.adapter.load();
    return loaded ?? createDefaultSave();
  }

  async saveNow(data: GameSaveData): Promise<void> {
    const stamped = { ...data, savedAt: Date.now() };
    this.pending = null;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this.adapter.save(stamped);
  }

  saveDebounced(data: GameSaveData, ms = 400): void {
    this.pending = data;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.pending) void this.saveNow(this.pending);
    }, ms);
  }

  async flush(): Promise<void> {
    if (this.pending) await this.saveNow(this.pending);
  }
}
