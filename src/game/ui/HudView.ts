import Phaser from 'phaser';
import { COLORS } from '../../config/gameConfig';
import type { ProgressionState } from '../../core/progression/ProgressionState';

export class HudView {
  private scene: Phaser.Scene;
  private levelText: Phaser.GameObjects.Text;
  private xpBarFill: Phaser.GameObjects.Rectangle;
  private xpText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private muteBtn: Phaser.GameObjects.Text;
  private toastText: Phaser.GameObjects.Text;
  private undoBtn: Phaser.GameObjects.Text;
  private debugText: Phaser.GameObjects.Text;
  private barWidth = 280;

  onMuteToggle?: () => void;
  onUndo?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;

    this.levelText = scene.add
      .text(24, 28, 'Garden Lv 1', {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: '#3d4a3a',
      })
      .setDepth(100);

    scene.add.rectangle(24, 68, this.barWidth, 16, 0xd7cfc0).setOrigin(0, 0.5).setDepth(100);
    this.xpBarFill = scene.add
      .rectangle(24, 68, 0, 16, COLORS.sage)
      .setOrigin(0, 0.5)
      .setDepth(101);
    this.xpText = scene.add
      .text(24 + this.barWidth + 12, 68, '0 XP', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        color: '#6b7c6b',
      })
      .setOrigin(0, 0.5)
      .setDepth(100);

    this.goldText = scene.add
      .text(w - 24, 28, '🪙 0', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '22px',
        color: '#3d4a3a',
      })
      .setOrigin(1, 0)
      .setDepth(100);

    this.muteBtn = scene.add
      .text(w - 24, 64, '🔊', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    this.muteBtn.on('pointerdown', () => this.onMuteToggle?.());

    this.undoBtn = scene.add
      .text(w / 2, scene.scale.height - 36, '', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#6b5344',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(150)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.undoBtn.on('pointerdown', () => this.onUndo?.());

    this.toastText = scene.add
      .text(w / 2, 110, '', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#4a5d4a',
        padding: { x: 12, y: 8 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(300)
      .setAlpha(0);

    this.debugText = scene.add
      .text(12, scene.scale.height - 120, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3d4a3a',
        backgroundColor: '#ffffffaa',
        padding: { x: 6, y: 4 },
      })
      .setDepth(400)
      .setVisible(false);
  }

  setMuted(muted: boolean): void {
    this.muteBtn.setText(muted ? '🔇' : '🔊');
  }

  syncProgress(p: ProgressionState): void {
    const prog = p.progress;
    this.levelText.setText(`Garden Lv ${prog.level}`);
    const ratio = prog.needed > 0 ? Math.min(1, prog.current / prog.needed) : 0;
    this.xpBarFill.width = this.barWidth * ratio;
    this.xpText.setText(`${p.xp} XP`);
    this.goldText.setText(`🪙 ${p.gold}`);
  }

  showToast(message: string): void {
    this.toastText.setText(message);
    this.scene.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1);
    this.scene.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1800,
      duration: 400,
    });
  }

  showFloatingXp(x: number, y: number, amount: number): void {
    const t = this.scene.add
      .text(x, y, `+${amount} XP`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        color: '#558b2f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  showBloomBanner(outcome: string): void {
    const { width, height } = this.scene.scale;
    const label =
      outcome === 'perfect' ? 'PERFECT BLOOM!' : outcome === 'good' ? 'Good Bloom' : 'Miss — still grew!';
    const color = outcome === 'perfect' ? '#c62828' : outcome === 'good' ? '#2e7d32' : '#6b7c6b';
    const t = this.scene.add
      .text(width / 2, height / 2 - 120, label, {
        fontFamily: 'Georgia, serif',
        fontSize: outcome === 'perfect' ? '36px' : '28px',
        color,
      })
      .setOrigin(0.5)
      .setDepth(2100);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 30,
      delay: 700,
      duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  setUndoVisible(visible: boolean, secondsLeft?: number): void {
    this.undoBtn.setVisible(visible);
    if (visible && secondsLeft !== undefined) {
      this.undoBtn.setText(`Undo compost (${Math.ceil(secondsLeft)}s)`);
    }
  }

  setDebug(visible: boolean, lines: string[]): void {
    this.debugText.setVisible(visible);
    if (visible) this.debugText.setText(lines.join('\n'));
  }
}
