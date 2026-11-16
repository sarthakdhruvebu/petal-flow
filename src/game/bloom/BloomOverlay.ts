import Phaser from 'phaser';
import type { BloomTimingConfig } from '../../data/bloomConfig';
import { COLORS } from '../../config/gameConfig';

export class BloomOverlay {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container | null = null;
  private indicator: Phaser.GameObjects.Rectangle | null = null;
  private barX = 0;
  private barWidth = 0;
  private startTime = 0;
  private duration = 2000;
  private active = false;
  private onResolve?: (position: number) => void;
  private endTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(timing: BloomTimingConfig, onResolve: (position: number) => void): void {
    this.hide();
    this.onResolve = onResolve;
    this.duration = timing.sweepDurationMs;
    this.active = true;
    this.startTime = this.scene.time.now;

    const { width, height } = this.scene.scale;
    const panelW = Math.min(560, width - 48);
    const panelH = 168;
    const cx = width / 2;
    const cy = height / 2;

    const dim = this.scene.add.rectangle(cx, cy, width * 2, height * 2, 0x000000, 0.35).setInteractive();
    const panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, COLORS.cream, 0.98)
      .setStrokeStyle(3, COLORS.sage)
      .setInteractive();
    const title = this.scene.add
      .text(cx, cy - 56, 'BLOOM', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5);
    const hint = this.scene.add
      .text(cx, cy - 28, 'Tap to stop in the center!', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '16px',
        color: '#6b7c6b',
      })
      .setOrigin(0.5);

    this.barWidth = panelW - 64;
    this.barX = cx - this.barWidth / 2;
    const barY = cy + 24;

    const zones: Phaser.GameObjects.GameObject[] = [];
    const perfect = timing.perfectWidth;
    const good = timing.goodWidthEachSide;
    const segments: Array<{ start: number; end: number; color: number }> = [
      { start: 0, end: 0.5 - perfect / 2 - good, color: 0xe8c4c4 },
      { start: 0.5 - perfect / 2 - good, end: 0.5 - perfect / 2, color: 0xc8e6c9 },
      { start: 0.5 - perfect / 2, end: 0.5 + perfect / 2, color: 0xfff59d },
      { start: 0.5 + perfect / 2, end: 0.5 + perfect / 2 + good, color: 0xc8e6c9 },
      { start: 0.5 + perfect / 2 + good, end: 1, color: 0xe8c4c4 },
    ];
    for (const seg of segments) {
      const w = Math.max(0, (seg.end - seg.start) * this.barWidth);
      if (w <= 0) continue;
      zones.push(
        this.scene.add
          .rectangle(this.barX + seg.start * this.barWidth, barY, w, 28, seg.color)
          .setOrigin(0, 0.5),
      );
    }

    const barStroke = this.scene.add
      .rectangle(cx, barY, this.barWidth, 28, 0x000000, 0)
      .setStrokeStyle(2, 0xb0a898);

    this.indicator = this.scene.add.rectangle(this.barX, barY, 6, 40, 0x3d4a3a).setOrigin(0.5);

    this.root = this.scene.add.container(0, 0, [
      dim,
      panel,
      title,
      hint,
      ...zones,
      barStroke,
      this.indicator,
    ]);
    this.root.setDepth(2000);

    const stop = () => this.stop();
    dim.on('pointerdown', stop);
    panel.on('pointerdown', stop);

    this.endTimer = this.scene.time.delayedCall(this.duration + 30, () => {
      if (this.active) this.resolveAt(1);
    });
  }

  update(time: number): void {
    if (!this.active || !this.indicator) return;
    const t = Math.min(1, (time - this.startTime) / this.duration);
    this.indicator.setX(this.barX + t * this.barWidth);
  }

  private stop(): void {
    if (!this.active || !this.indicator) return;
    const pos = (this.indicator.x - this.barX) / this.barWidth;
    this.resolveAt(pos);
  }

  private resolveAt(position: number): void {
    if (!this.active) return;
    this.active = false;
    const cb = this.onResolve;
    this.onResolve = undefined;
    this.hide();
    cb?.(Math.min(1, Math.max(0, position)));
  }

  hide(): void {
    this.active = false;
    this.endTimer?.remove(false);
    this.endTimer = undefined;
    this.root?.destroy(true);
    this.root = null;
    this.indicator = null;
  }
}
