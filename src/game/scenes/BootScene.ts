import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // nothing yet
  }

  create(): void {
    this.scene.start('Preload');
  }
}
