/**
 * Playgama Bridge–aware platform wrapper.
 * Works without Bridge (local/standalone). Ads stay gated off through Phase C.
 */

export type PlatformPauseHandler = (paused: boolean) => void;
export type PlatformAudioHandler = (enabled: boolean) => void;

interface BridgeLike {
  initialize?: () => Promise<unknown>;
  platform?: {
    sendMessage?: (msg: string) => void;
    isAudioEnabled?: boolean;
    on?: (event: string, cb: (...args: unknown[]) => void) => void;
  };
}

declare global {
  interface Window {
    bridge?: BridgeLike;
  }
}

export class PlatformService {
  private bridge: BridgeLike | null = null;
  private ready = false;
  private pauseHandlers: PlatformPauseHandler[] = [];
  private audioHandlers: PlatformAudioHandler[] = [];

  async init(): Promise<void> {
    const b = typeof window !== 'undefined' ? window.bridge : undefined;
    if (!b?.initialize) {
      this.bridge = null;
      this.ready = true;
      this.wireDocumentVisibility();
      return;
    }
    try {
      await b.initialize();
      this.bridge = b;
      this.ready = true;
      this.wireBridgeEvents();
      this.wireDocumentVisibility();
      const enabled = b.platform?.isAudioEnabled !== false;
      this.audioHandlers.forEach((h) => h(enabled));
    } catch {
      this.bridge = null;
      this.ready = true;
      this.wireDocumentVisibility();
    }
  }

  private wireBridgeEvents(): void {
    const platform = this.bridge?.platform;
    if (!platform?.on) return;
    platform.on('pause', () => this.emitPause(true));
    platform.on('resume', () => this.emitPause(false));
    platform.on('audio_state_changed', (...args: unknown[]) => {
      const enabled = args[0] !== false;
      this.emitAudio(!!enabled);
    });
  }

  private wireDocumentVisibility(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      const hidden = document.visibilityState === 'hidden';
      this.emitPause(hidden);
    });
  }

  onPause(handler: PlatformPauseHandler): () => void {
    this.pauseHandlers.push(handler);
    return () => {
      this.pauseHandlers = this.pauseHandlers.filter((h) => h !== handler);
    };
  }

  onAudioEnabled(handler: PlatformAudioHandler): () => void {
    this.audioHandlers.push(handler);
    return () => {
      this.audioHandlers = this.audioHandlers.filter((h) => h !== handler);
    };
  }

  private emitPause(paused: boolean): void {
    this.pauseHandlers.forEach((h) => h(paused));
  }

  private emitAudio(enabled: boolean): void {
    this.audioHandlers.forEach((h) => h(enabled));
  }

  sendGameReady(): void {
    try {
      this.bridge?.platform?.sendMessage?.('game_ready');
    } catch {
      // ignore
    }
  }

  get isAudioEnabled(): boolean {
    if (!this.bridge?.platform) return true;
    return this.bridge.platform.isAudioEnabled !== false;
  }

  get isReady(): boolean {
    return this.ready;
  }

  get hasBridge(): boolean {
    return !!this.bridge;
  }
}

export const platformService = new PlatformService();
