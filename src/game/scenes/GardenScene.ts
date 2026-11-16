import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../../config/gameConfig';
import { RESTORATION_MILESTONES } from '../../data/restoration';
import type { GameController } from '../../core/game/GameController';

/**
 * Garden restoration view — visual stages driven by GameController.restoration.
 * Expects registry key `gameCtrl`.
 */
export class GardenScene extends Phaser.Scene {
  private gameCtrl!: GameController;
  private stageVisuals: Phaser.GameObjects.GameObject[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private buyBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('Garden');
  }

  create(): void {
    this.gameCtrl = this.registry.get('gameCtrl') as GameController;
    this.cameras.main.setBackgroundColor(0xdde8d4);

    this.add
      .text(DESIGN_WIDTH / 2, 36, 'Magical Garden', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(24, 28, '← Board', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        color: '#3d4a3a',
        backgroundColor: '#e8f0e4',
        padding: { x: 10, y: 6 },
      })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Main'));

    this.infoText = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 120, '', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '16px',
        color: '#3d4a3a',
        align: 'center',
        wordWrap: { width: DESIGN_WIDTH - 80 },
      })
      .setOrigin(0.5);

    this.buyBtn = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 60, 'Restore', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#558b2f',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.buyBtn.on('pointerdown', () => {
      if (this.gameCtrl.purchaseRestoration()) {
        this.redraw();
        const save = this.registry.get('persist') as (() => void) | undefined;
        save?.();
      } else {
        this.refreshCopy();
      }
    });

    this.redraw();
  }

  private clearVisuals(): void {
    this.stageVisuals.forEach((g) => g.destroy());
    this.stageVisuals = [];
  }

  private redraw(): void {
    this.clearVisuals();
    const stage = this.gameCtrl.restoration.stage;
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2 - 40;

    // Base overgrown ground
    this.stageVisuals.push(
      this.add.ellipse(cx, cy + 120, 560, 180, 0x8fbc8f, 0.55),
      this.add.rectangle(cx, cy + 40, 520, 280, 0xc5d5b5, 0.9),
    );

    if (stage < 1) {
      // Debris
      for (let i = 0; i < 8; i++) {
        this.stageVisuals.push(
          this.add.rectangle(cx - 180 + i * 50, cy + 80 + (i % 3) * 20, 36, 18, 0x6b5344, 0.85).setAngle(i * 12),
        );
      }
      this.stageVisuals.push(
        this.add.text(cx, cy - 80, 'Overgrown & cluttered', {
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: '#5d4037',
        }).setOrigin(0.5),
      );
    }

    if (stage >= 1) {
      // Cleared lawn
      this.stageVisuals.push(this.add.ellipse(cx, cy + 100, 480, 140, 0xa5d6a7, 0.7));
    }
    if (stage >= 2) {
      // Gazebo
      this.stageVisuals.push(
        this.add.rectangle(cx, cy - 20, 160, 100, 0xffecb3).setStrokeStyle(3, 0xd4a373),
        this.add.triangle(cx, cy - 90, 0, 40, -100, 40, 100, 40, 0xffcc80),
        this.add.text(cx, cy - 10, 'Gazebo', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', color: '#5d4037' }).setOrigin(0.5),
      );
    }
    if (stage >= 3) {
      // Decorative flowers
      const cols = [0xf48fb1, 0xfff59d, 0xce93d8, 0x80cbc4];
      for (let i = 0; i < 10; i++) {
        this.stageVisuals.push(
          this.add.circle(cx - 200 + i * 44, cy + 70 + (i % 2) * 16, 10, cols[i % cols.length]),
        );
      }
    }
    if (stage >= 4) {
      // Fountain
      this.stageVisuals.push(
        this.add.circle(cx + 160, cy - 30, 36, 0x81d4fa, 0.9),
        this.add.circle(cx + 160, cy - 30, 18, 0xe1f5fe),
        this.add.text(cx + 160, cy + 20, 'Fountain', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px', color: '#37474f' }).setOrigin(0.5),
      );
    }
    if (stage >= 5) {
      // Koi pond biome
      this.stageVisuals.push(
        this.add.ellipse(cx - 150, cy - 40, 160, 90, 0x4fc3f7, 0.75),
        this.add.ellipse(cx - 150, cy - 40, 120, 60, 0x29b6f6, 0.5),
        this.add.circle(cx - 170, cy - 45, 6, 0xff8a65),
        this.add.circle(cx - 130, cy - 35, 5, 0xffcc80),
        this.add
          .text(cx - 150, cy + 30, 'Koi Pond', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#01579b',
          })
          .setOrigin(0.5),
      );
    }

    this.refreshCopy();
  }

  private refreshCopy(): void {
    const next = this.gameCtrl.restoration.next();
    const gold = this.gameCtrl.progression.gold;
    if (!next) {
      this.infoText.setText('The garden flourishes. All restorations complete.');
      this.buyBtn.setText('Complete').disableInteractive().setAlpha(0.6);
      return;
    }
    const done = this.gameCtrl.restoration.completed.length;
    this.infoText.setText(
      `Stage ${done}/${RESTORATION_MILESTONES.length}\nNext: ${next.name} — ${next.goldCost} gold\n${next.description}\nYou have ${gold} gold`,
    );
    this.buyBtn.setText(`Restore (${next.goldCost}g)`).setInteractive({ useHandCursor: true }).setAlpha(1);
  }
}
