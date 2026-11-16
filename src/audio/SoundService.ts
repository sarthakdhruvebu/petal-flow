/** Procedural SFX via Web Audio — no binary assets required. */
export class SoundService {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  muted = false;
  volume = 1;
  /** Platform can force mute (tab hidden / Bridge audio disabled). */
  platformMuted = false;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  /** Call on first user gesture so mobile browsers allow audio. */
  async unlock(): Promise<void> {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
    this.unlocked = ctx.state === 'running';
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  private get silenced(): boolean {
    return this.muted || this.platformMuted;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.045,
    delayMs = 0,
  ): void {
    if (this.silenced) return;
    const run = () => {
      const ctx = this.ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainLevel * this.volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gainLevel * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    };
    if (delayMs > 0) setTimeout(run, delayMs);
    else run();
  }

  playMerge(): void {
    this.tone(440, 0.06, 'triangle', 0.035);
    this.tone(554, 0.07, 'sine', 0.04, 40);
    this.tone(659, 0.09, 'sine', 0.035, 90);
  }

  playSpawn(): void {
    this.tone(392, 0.05, 'triangle', 0.03);
    this.tone(523, 0.07, 'sine', 0.028, 45);
  }

  playPerfect(): void {
    this.tone(523, 0.08, 'sine', 0.04);
    this.tone(659, 0.09, 'sine', 0.045, 55);
    this.tone(784, 0.1, 'sine', 0.05, 110);
    this.tone(1046, 0.14, 'triangle', 0.035, 180);
  }

  playGood(): void {
    this.tone(523, 0.07, 'sine', 0.035);
    this.tone(659, 0.1, 'triangle', 0.03, 60);
  }

  playMiss(): void {
    this.tone(330, 0.08, 'triangle', 0.028);
    this.tone(247, 0.12, 'sine', 0.022, 70);
  }

  playCompost(): void {
    this.tone(180, 0.1, 'sawtooth', 0.02);
    this.tone(140, 0.14, 'triangle', 0.018, 60);
  }

  playUndo(): void {
    this.tone(349, 0.06, 'triangle', 0.03);
    this.tone(440, 0.08, 'sine', 0.028, 50);
  }

  playSelect(): void {
    this.tone(480, 0.035, 'sine', 0.02);
  }

  playLevelUp(): void {
    this.tone(523, 0.07, 'sine', 0.04);
    this.tone(659, 0.08, 'sine', 0.04, 70);
    this.tone(784, 0.1, 'sine', 0.045, 140);
    this.tone(988, 0.16, 'triangle', 0.035, 220);
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }
}
