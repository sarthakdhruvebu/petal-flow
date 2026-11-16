import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, COLORS } from '../config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainScene } from './scenes/MainScene';
import { GardenScene } from './scenes/GardenScene';

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: COLORS.cream,
    scene: [BootScene, PreloadScene, MainScene, GardenScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
  });
}
