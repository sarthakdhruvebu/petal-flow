import Phaser from 'phaser';
import { COLORS } from '../../config/gameConfig';

const RAINBOW = [0xff8a80, 0xffd54f, 0x81c784, 0x80deea, 0xce93d8, 0xffab91];

/**
 * Lightweight pooled particle bursts — avoids heavy ParticleEmitter setup
 * and keeps Phaser 4 compatibility simple.
 */
export class EffectsSystem {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Image[] = [];
  private illuminate: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private takeDot(color: number): Phaser.GameObjects.Image {
    let img = this.pool.pop();
    if (!img) {
      img = this.scene.add.image(0, 0, 'fx_dot').setDepth(900);
    }
    img.setActive(true).setVisible(true).setTint(color).setAlpha(1).setScale(1);
    return img;
  }

  private recycle(img: Phaser.GameObjects.Image): void {
    img.setActive(false).setVisible(false);
    this.pool.push(img);
  }

  burst(x: number, y: number, opts?: { count?: number; colors?: number[]; spread?: number; life?: number }): void {
    const count = opts?.count ?? 12;
    const colors = opts?.colors ?? [COLORS.sage, COLORS.pastelPink, COLORS.mutedYellow, COLORS.mint];
    const spread = opts?.spread ?? 70;
    const life = opts?.life ?? 420;

    for (let i = 0; i < count; i++) {
      const img = this.takeDot(colors[i % colors.length]);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = spread * (0.45 + Math.random() * 0.55);
      img.setPosition(x, y).setDisplaySize(10, 10);
      this.scene.tweens.add({
        targets: img,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: life + Math.random() * 120,
        ease: 'Cubic.easeOut',
        onComplete: () => this.recycle(img),
      });
    }
  }

  mergeBurst(x: number, y: number): void {
    this.burst(x, y, {
      count: 14,
      colors: [0x81c784, 0xa5d6a7, 0xfff59d, 0xf8bbd0],
      spread: 60,
      life: 380,
    });
    this.shake(0.004, 80);
  }

  perfectBloom(x: number, y: number): void {
    this.burst(x, y, { count: 28, colors: RAINBOW, spread: 110, life: 650 });
    this.burst(x, y, { count: 10, colors: [0xffffff, 0xfff59d], spread: 40, life: 300 });
    this.illuminateBackground(380);
    this.shake(0.01, 140);
  }

  goodBloom(x: number, y: number): void {
    this.burst(x, y, {
      count: 12,
      colors: [0xc8e6c9, 0xfff59d, 0xa5d6a7],
      spread: 55,
      life: 400,
    });
  }

  compostPoof(x: number, y: number): void {
    this.burst(x, y, {
      count: 10,
      colors: [0x8d6e63, 0x6b5344, 0xa1887f, 0xc8e6c9],
      spread: 45,
      life: 480,
    });
  }

  spawnPop(x: number, y: number): void {
    this.burst(x, y, {
      count: 6,
      colors: [0xa5d6a7, 0xdcede0],
      spread: 28,
      life: 280,
    });
  }

  shake(intensity = 0.006, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  illuminateBackground(durationMs = 350): void {
    const cam = this.scene.cameras.main;
    if (!this.illuminate) {
      this.illuminate = this.scene.add
        .rectangle(cam.centerX, cam.centerY, cam.width * 2, cam.height * 2, 0xfff8e1, 0)
        .setScrollFactor(0)
        .setDepth(850)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
    this.illuminate.setAlpha(0);
    this.scene.tweens.killTweensOf(this.illuminate);
    this.scene.tweens.add({
      targets: this.illuminate,
      alpha: 0.45,
      duration: durationMs * 0.35,
      yoyo: true,
      hold: durationMs * 0.15,
      ease: 'Sine.easeOut',
    });
  }
}
