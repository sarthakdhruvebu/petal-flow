import Phaser from 'phaser';
import { ALL_ITEMS } from '../../data/chains';
import { PRODUCERS } from '../../data/producers';
import { COLORS } from '../../config/gameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.cream);
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Petal Flow', {
        fontFamily: 'Georgia, serif',
        fontSize: '42px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 48, 'Growing the garden…', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#6b7c6b',
      })
      .setOrigin(0.5);

    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('Main');
  }

  private createPlaceholderTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.clear();
    g.fillStyle(COLORS.boardCell, 1);
    g.lineStyle(2, COLORS.boardStroke, 1);
    g.fillRoundedRect(0, 0, 64, 64, 12);
    g.strokeRoundedRect(0, 0, 64, 64, 12);
    g.generateTexture('cell', 64, 64);

    for (const p of PRODUCERS) {
      g.clear();
      g.fillStyle(p.color, 1);
      g.lineStyle(3, 0x6b7c6b, 1);
      g.fillRoundedRect(0, 0, 96, 96, 16);
      g.strokeRoundedRect(0, 0, 96, 96, 16);
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(48, 42, 20);
      g.generateTexture(p.spriteKey, 96, 96);
    }

    g.clear();
    g.fillStyle(COLORS.soil, 1);
    g.lineStyle(3, 0x4e3b31, 1);
    g.fillRoundedRect(0, 0, 88, 88, 14);
    g.strokeRoundedRect(0, 0, 88, 88, 14);
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(44, 50, 50, 28);
    g.generateTexture('compost', 88, 88);

    for (const def of ALL_ITEMS) {
      this.drawItemTexture(g, def.spriteKey, def.color, false);
      this.drawItemTexture(g, `${def.spriteKey}_prism`, def.color, true);
    }

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('fx_dot', 16, 16);

    g.destroy();
  }

  private drawItemTexture(
    g: Phaser.GameObjects.Graphics,
    key: string,
    color: number,
    prismatic: boolean,
  ): void {
    g.clear();
    const size = 72;
    if (prismatic) {
      g.lineStyle(4, 0xffd54f, 1);
      g.strokeCircle(size / 2, size / 2, 30);
      g.lineStyle(2, 0x80deea, 1);
      g.strokeCircle(size / 2, size / 2, 26);
    }
    g.fillStyle(color, 1);
    g.fillCircle(size / 2, size / 2, 24);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(size / 2 - 8, size / 2 - 8, 8);
    g.generateTexture(key, size, size);
  }
}
