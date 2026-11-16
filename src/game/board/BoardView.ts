import Phaser from 'phaser';
import { getItemDef } from '../../data/chains';
import type { BoardState, CellIndex } from '../../core/board/BoardState';
import { COLORS } from '../../config/gameConfig';

export interface BoardViewConfig {
  originX: number;
  originY: number;
  cellSize: number;
  gap: number;
}

interface CellVisual {
  bg: Phaser.GameObjects.Image;
  sprite: Phaser.GameObjects.Image | null;
  label: Phaser.GameObjects.Text | null;
  highlight: Phaser.GameObjects.Rectangle;
}

export class BoardView {
  readonly config: BoardViewConfig;
  private cells: CellVisual[] = [];
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private dragFrom: CellIndex | null = null;
  private dragGhost: Phaser.GameObjects.Image | null = null;
  private pointerDownAt = { x: 0, y: 0 };
  private dragging = false;
  /** Squared px before a press becomes a drag — higher helps fat-finger taps on mobile. */
  private readonly dragThresholdSq = 64; // 8px

  onCellTap?: (index: CellIndex) => void;
  /** Fired when a drag ends on another cell (occupied or empty). */
  onDragDrop?: (from: CellIndex, to: CellIndex) => void;
  onDragToCompost?: (from: CellIndex) => void;
  compostHitTest?: (x: number, y: number) => boolean;

  constructor(scene: Phaser.Scene, config: BoardViewConfig) {
    this.scene = scene;
    this.config = config;
    this.container = scene.add.container(0, 0);
  }

  build(cols: number, rows: number): void {
    const { originX, originY, cellSize, gap } = this.config;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const x = originX + c * (cellSize + gap) + cellSize / 2;
        const y = originY + r * (cellSize + gap) + cellSize / 2;
        const bg = this.scene.add.image(x, y, 'cell').setDisplaySize(cellSize, cellSize);
        bg.setInteractive({ useHandCursor: true });
        const highlight = this.scene.add
          .rectangle(x, y, cellSize - 4, cellSize - 4, COLORS.gold, 0)
          .setStrokeStyle(3, COLORS.gold, 0);
        bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.handlePointerDown(index, pointer);
        });
        this.container.add([bg, highlight]);
        this.cells[index] = { bg, sprite: null, label: null, highlight };
      }
    }

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragFrom === null || !this.dragGhost) return;
      const dx = pointer.worldX - this.pointerDownAt.x;
      const dy = pointer.worldY - this.pointerDownAt.y;
      if (!this.dragging && dx * dx + dy * dy > this.dragThresholdSq) this.dragging = true;
      this.dragGhost.setPosition(pointer.worldX, pointer.worldY);
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    });
  }

  private handlePointerDown(index: CellIndex, pointer: Phaser.Input.Pointer): void {
    const visual = this.cells[index];
    if (!visual?.sprite) {
      this.onCellTap?.(index);
      return;
    }
    this.dragFrom = index;
    this.dragging = false;
    this.pointerDownAt = { x: pointer.worldX, y: pointer.worldY };
    this.dragGhost = this.scene.add
      .image(pointer.worldX, pointer.worldY, visual.sprite.texture.key)
      .setDisplaySize(visual.sprite.displayWidth, visual.sprite.displayHeight)
      .setAlpha(0.85)
      .setDepth(1000);
    visual.sprite.setAlpha(0.35);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.dragFrom === null) return;
    const from = this.dragFrom;
    const wasDragging = this.dragging;
    const fromVisual = this.cells[from];
    if (fromVisual?.sprite) fromVisual.sprite.setAlpha(1);
    if (this.dragGhost) {
      this.dragGhost.destroy();
      this.dragGhost = null;
    }
    this.dragFrom = null;
    this.dragging = false;

    if (wasDragging && this.compostHitTest?.(pointer.worldX, pointer.worldY)) {
      this.onDragToCompost?.(from);
      return;
    }

    if (!wasDragging) {
      this.onCellTap?.(from);
      return;
    }

    const to = this.hitCell(pointer.worldX, pointer.worldY);
    if (to === null || to === from) return;
    this.onDragDrop?.(from, to);
  }

  hitCell(worldX: number, worldY: number): CellIndex | null {
    const { originX, originY, cellSize, gap } = this.config;
    const stride = cellSize + gap;
    const c = Math.floor((worldX - originX) / stride);
    const r = Math.floor((worldY - originY) / stride);
    if (c < 0 || r < 0 || c >= 7 || r >= 7) return null;
    const localX = worldX - originX - c * stride;
    const localY = worldY - originY - r * stride;
    if (localX > cellSize || localY > cellSize || localX < 0 || localY < 0) return null;
    return r * 7 + c;
  }

  sync(board: BoardState, selected: CellIndex | null): void {
    for (let i = 0; i < board.cells.length; i++) {
      this.renderCell(i, board, selected === i);
    }
  }

  private renderCell(index: CellIndex, board: BoardState, selected: boolean): void {
    const visual = this.cells[index];
    if (!visual) return;
    const item = board.get(index);
    const { originX, originY, cellSize, gap } = this.config;
    const { col, row } = board.colRow(index);
    const x = originX + col * (cellSize + gap) + cellSize / 2;
    const y = originY + row * (cellSize + gap) + cellSize / 2;

    visual.highlight.setStrokeStyle(3, COLORS.gold, selected ? 1 : 0);
    visual.highlight.setFillStyle(COLORS.gold, selected ? 0.12 : 0);

    if (!item) {
      visual.sprite?.destroy();
      visual.label?.destroy();
      visual.sprite = null;
      visual.label = null;
      return;
    }

    const def = getItemDef(item.itemId);
    const key = def
      ? item.isPrismatic
        ? `${def.spriteKey}_prism`
        : def.spriteKey
      : 'item_sprout';
    const size = cellSize * 0.78;

    if (!visual.sprite) {
      visual.sprite = this.scene.add.image(x, y, key).setDisplaySize(size, size);
      this.container.add(visual.sprite);
    } else {
      visual.sprite.setTexture(key).setPosition(x, y).setDisplaySize(size, size).setAlpha(1);
    }

    const text = def ? (item.isPrismatic ? `★${def.label}` : def.label) : '?';
    if (!visual.label) {
      visual.label = this.scene.add
        .text(x, y + cellSize * 0.28, text, {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '12px',
          color: '#3d4a3a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.container.add(visual.label);
    } else {
      visual.label.setText(text).setPosition(x, y + cellSize * 0.28);
    }
  }

  pulseCell(index: CellIndex): void {
    const visual = this.cells[index];
    if (!visual?.sprite) return;
    this.scene.tweens.add({
      targets: visual.sprite,
      displayWidth: visual.sprite.displayWidth * 1.12,
      displayHeight: visual.sprite.displayHeight * 1.12,
      duration: 120,
      yoyo: true,
    });
  }

  highlightPairs(pairs: Array<[CellIndex, CellIndex]>): void {
    const set = new Set<number>();
    pairs.forEach(([a, b]) => {
      set.add(a);
      set.add(b);
    });
    this.cells.forEach((v, i) => {
      if (!set.has(i)) return;
      v.highlight.setStrokeStyle(3, 0x81c784, 1);
      this.scene.tweens.add({
        targets: v.highlight,
        alpha: { from: 1, to: 0.35 },
        duration: 400,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          v.highlight.setStrokeStyle(3, COLORS.gold, 0);
          v.highlight.setAlpha(1);
        },
      });
    });
  }

  cellWorldPos(index: CellIndex, cols = 7): { x: number; y: number } {
    const { originX, originY, cellSize, gap } = this.config;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: originX + col * (cellSize + gap) + cellSize / 2,
      y: originY + row * (cellSize + gap) + cellSize / 2,
    };
  }
}
