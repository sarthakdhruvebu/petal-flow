import Phaser from 'phaser';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from '../../config/gameConfig';
import { GameController } from '../../core/game/GameController';
import { SaveService } from '../../core/save/SaveService';
import { canMergeItems } from '../../core/merge/mergeLogic';
import { PRODUCERS } from '../../data/producers';
import { BoardView } from '../board/BoardView';
import { BloomOverlay } from '../bloom/BloomOverlay';
import { HudView } from '../ui/HudView';
import { EffectsSystem } from '../effects/EffectsSystem';
import { SoundService } from '../../audio/SoundService';
import { platformService } from '../../platform/PlatformService';
import { hopperCount } from '../../core/offline/Hopper';
import type { CellIndex } from '../../core/board/BoardState';

export class MainScene extends Phaser.Scene {
  private gameCtrl!: GameController;
  private saveService = new SaveService();
  private boardView!: BoardView;
  private bloom!: BloomOverlay;
  private hud!: HudView;
  private fx!: EffectsSystem;
  private audio = new SoundService();
  private producerImages: Phaser.GameObjects.Image[] = [];
  private producerLabels: Phaser.GameObjects.Text[] = [];
  private compostImage!: Phaser.GameObjects.Image;
  private compostHitPad!: Phaser.GameObjects.Zone;
  private confirmRoot: Phaser.GameObjects.Container | null = null;
  private wishText!: Phaser.GameObjects.Text;
  private wishSubmit!: Phaser.GameObjects.Text;
  private hopperBtn!: Phaser.GameObjects.Text;
  private gardenBtn!: Phaser.GameObjects.Text;
  private debugMode = false;
  private pendingCompostCell: CellIndex | null = null;
  private gameReadySent = false;
  private unsubPause?: () => void;
  private unsubAudio?: () => void;
  private producerY = 0;

  constructor() {
    super('Main');
  }

  create(): void {
    this.debugMode = new URLSearchParams(window.location.search).get('debug') === '1';
    this.cameras.main.setBackgroundColor(COLORS.cream);

    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, COLORS.cream);
    this.add.ellipse(DESIGN_WIDTH / 2, 180, 700, 220, COLORS.mint, 0.35);
    this.add.ellipse(120, DESIGN_HEIGHT - 80, 280, 160, COLORS.sage, 0.2);
    this.add.ellipse(DESIGN_WIDTH - 100, DESIGN_HEIGHT - 140, 260, 180, COLORS.lavender, 0.18);
    this.add.ellipse(DESIGN_WIDTH / 2, 420, 520, 40, 0xdfe8d8, 0.45);

    const save = this.saveService.loadOrDefaultSync();
    this.gameCtrl = new GameController(save);
    this.registry.set('gameCtrl', this.gameCtrl);
    this.registry.set('persist', () => this.persist());

    this.audio.muted = this.gameCtrl.muted;
    this.audio.volume = this.gameCtrl.volume;
    this.audio.platformMuted = !platformService.isAudioEnabled;

    const cellSize = 78;
    const gap = 6;
    const boardW = 7 * cellSize + 6 * gap;
    const originX = (DESIGN_WIDTH - boardW) / 2;
    const originY = 190;

    this.fx = new EffectsSystem(this);
    this.boardView = new BoardView(this, { originX, originY, cellSize, gap });
    this.boardView.build(7, 7);
    this.bloom = new BloomOverlay(this);
    this.hud = new HudView(this);
    this.hud.setMuted(this.gameCtrl.muted);
    this.hud.syncProgress(this.gameCtrl.progression);
    this.hud.onMuteToggle = () => {
      void this.audio.unlock();
      this.gameCtrl.muted = !this.gameCtrl.muted;
      this.audio.muted = this.gameCtrl.muted;
      this.hud.setMuted(this.gameCtrl.muted);
      this.persist();
    };
    this.hud.onUndo = () => {
      if (this.gameCtrl.undoCompost()) {
        this.audio.playUndo();
        this.fx.spawnPop(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 80);
      }
    };

    this.producerY = originY + 7 * (cellSize + gap) + 50;
    this.buildProducers(originX);
    this.buildCompost(DESIGN_WIDTH - originX - 48);
    this.buildBottomPanel();

    this.boardView.compostHitTest = (x, y) => {
      const b = this.compostHitPad.getBounds();
      return Phaser.Geom.Rectangle.Contains(b, x, y);
    };
    this.boardView.onCellTap = (index) => {
      void this.audio.unlock();
      const before = this.gameCtrl.selectedCell;
      this.gameCtrl.selectCell(index);
      if (this.gameCtrl.selectedCell !== null && this.gameCtrl.selectedCell !== before) {
        this.audio.playSelect();
      }
    };
    this.boardView.onDragDrop = (from, to) => {
      void this.audio.unlock();
      this.handleDrop(from, to);
    };
    this.boardView.onDragToCompost = (from) => {
      void this.audio.unlock();
      this.handleCompost(from);
    };

    this.wireEvents();
    this.wirePlatform();
    this.boardView.sync(this.gameCtrl.board, this.gameCtrl.selectedCell);
    this.refreshWish();
    this.refreshHopper(true);
    this.refreshProducers();

    this.add
      .text(DESIGN_WIDTH / 2, 145, 'Petal Flow', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5);

    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
    this.time.delayedCall(100, () => this.sendGameReadyOnce());

    // Pull Bridge save async if available (non-blocking)
    void this.saveService.loadOrDefault().then((cloud) => {
      if (cloud.savedAt > save.savedAt) {
        // Prefer newer cloud without wiping mid-session; only on fresh board empty
        if (this.gameCtrl.board.countItems() === 0 && cloud.board.some(Boolean)) {
          this.scene.restart();
        }
      }
    });
  }

  unlockAudio(): void {
    void this.audio.unlock();
  }

  private buildProducers(originX: number): void {
    PRODUCERS.forEach((p, i) => {
      const x = originX + 48 + i * 100;
      const img = this.add.image(x, this.producerY, p.spriteKey).setDisplaySize(72, 72);
      img.setInteractive(new Phaser.Geom.Rectangle(-6, -6, 84, 84), Phaser.Geom.Rectangle.Contains);
      img.on('pointerdown', () => {
        void this.audio.unlock();
        if (this.gameCtrl.inputLocked) return;
        if (!this.gameCtrl.isProducerUnlocked(p.id)) {
          this.hud.showToast(`Unlock at Garden Lv ${p.unlockLevel}`);
          return;
        }
        this.tweens.add({
          targets: img,
          displayWidth: 80,
          displayHeight: 80,
          duration: 90,
          yoyo: true,
        });
        const ok = this.gameCtrl.tapProducer(p.id);
        if (ok) this.audio.playSpawn();
        else this.fx.shake(0.003, 60);
      });
      const label = this.add
        .text(x, this.producerY + 48, p.name.split(' ')[0], {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '12px',
          color: '#3d4a3a',
        })
        .setOrigin(0.5);
      this.producerImages.push(img);
      this.producerLabels.push(label);
    });
  }

  private buildCompost(x: number): void {
    this.compostImage = this.add.image(x, this.producerY, 'compost').setDisplaySize(76, 76);
    this.add
      .text(x, this.producerY + 48, 'Compost', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5);
    this.compostHitPad = this.add.zone(x, this.producerY, 110, 110);
  }

  private buildBottomPanel(): void {
    const y = DESIGN_HEIGHT - 150;
    this.add.rectangle(DESIGN_WIDTH / 2, y + 40, DESIGN_WIDTH - 24, 130, 0xeef5ea, 0.95).setStrokeStyle(2, 0xc5d5c0);

    this.wishText = this.add
      .text(24, y, 'Wish Jar', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#3d4a3a',
        wordWrap: { width: 360 },
      })
      .setDepth(120);

    this.wishSubmit = this.add
      .text(DESIGN_WIDTH - 24, y + 8, 'Submit', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '16px',
        color: '#fff',
        backgroundColor: '#6a9b6a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(120);
    this.wishSubmit.on('pointerdown', () => {
      void this.audio.unlock();
      if (this.gameCtrl.submitWishJar()) {
        this.audio.playLevelUp();
        this.fx.illuminateBackground(220);
        this.refreshWish();
      }
    });

    this.hopperBtn = this.add
      .text(24, y + 70, 'Hopper (0)', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#fff',
        backgroundColor: '#5d7a8c',
        padding: { x: 12, y: 8 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(120);
    this.hopperBtn.on('pointerdown', () => {
      void this.audio.unlock();
      const n = this.gameCtrl.collectHopper();
      if (n > 0) {
        this.audio.playSpawn();
        this.fx.spawnPop(80, y + 70);
      }
      this.refreshHopper(false);
    });

    this.gardenBtn = this.add
      .text(DESIGN_WIDTH - 24, y + 70, 'Garden', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#fff',
        backgroundColor: '#7a9e6a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(120);
    this.gardenBtn.on('pointerdown', () => {
      this.persist();
      this.scene.start('Garden');
    });
  }

  private refreshProducers(): void {
    PRODUCERS.forEach((p, i) => {
      const unlocked = this.gameCtrl.isProducerUnlocked(p.id);
      this.producerImages[i]?.setAlpha(unlocked ? 1 : 0.35);
      this.producerLabels[i]?.setText(unlocked ? p.name.split(' ')[0] : `Lv${p.unlockLevel}`);
    });
  }

  private refreshWish(): void {
    const order = this.gameCtrl.activeOrder;
    const prog = this.gameCtrl.getOrderProgress();
    if (!order) {
      this.wishText.setText('Wish Jar — none');
      return;
    }
    const opt = order.optional ? ' (optional)' : '';
    this.wishText.setText(
      `Wish Jar${opt}\n${prog.label}  ${prog.have}/${prog.need}\nReward: ${order.goldReward}g · ${order.xpReward} XP`,
    );
  }

  private refreshHopper(accrue = false): void {
    if (accrue) this.gameCtrl.accrueOffline();
    const n = hopperCount(this.gameCtrl.hopper);
    this.hopperBtn.setText(`Hopper (${n})`);
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      this.gameCtrl.accrueOffline();
      void this.saveService.flush();
      this.audio.suspend();
    } else {
      this.refreshHopper(true);
      void this.audio.unlock();
    }
  };

  private onPageHide = (): void => {
    void this.saveService.flush();
  };

  private wirePlatform(): void {
    this.unsubPause = platformService.onPause((paused) => {
      if (paused) {
        void this.saveService.flush();
        this.audio.suspend();
        if (this.scene.isActive()) this.scene.pause();
      } else {
        if (this.scene.isPaused()) this.scene.resume();
        this.refreshHopper(true);
        void this.audio.unlock();
      }
    });
    this.unsubAudio = platformService.onAudioEnabled((enabled) => {
      this.audio.platformMuted = !enabled;
    });
  }

  private sendGameReadyOnce(): void {
    if (this.gameReadySent) return;
    this.gameReadySent = true;
    platformService.sendGameReady();
  }

  private handleDrop(from: CellIndex, to: CellIndex): void {
    if (this.gameCtrl.inputLocked) return;
    const a = this.gameCtrl.board.get(from);
    const b = this.gameCtrl.board.get(to);
    if (a && b && canMergeItems(a, b).ok) {
      this.gameCtrl.tryMerge(from, to);
      return;
    }
    if (a && !b) this.gameCtrl.moveItem(from, to);
  }

  private handleCompost(cell: CellIndex): void {
    if (this.gameCtrl.inputLocked) return;
    if (this.gameCtrl.compost.needsPrismaticConfirm(this.gameCtrl.board, cell)) {
      this.pendingCompostCell = cell;
      this.showPrismaticConfirm();
      return;
    }
    this.doCompost(cell);
  }

  private doCompost(cell: CellIndex): void {
    const pos = this.boardView.cellWorldPos(cell);
    if (this.gameCtrl.requestCompost(cell, true)) {
      this.audio.playCompost();
      this.fx.compostPoof(pos.x, pos.y);
      this.tweens.add({
        targets: this.compostImage,
        displayWidth: 84,
        displayHeight: 84,
        duration: 100,
        yoyo: true,
      });
    }
  }

  private showPrismaticConfirm(): void {
    this.confirmRoot?.destroy(true);
    const { width, height } = this.scale;
    const dim = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.4)
      .setInteractive()
      .setDepth(3000);
    const panel = this.add
      .rectangle(width / 2, height / 2, 420, 180, COLORS.cream)
      .setStrokeStyle(3, COLORS.gold)
      .setDepth(3001);
    const msg = this.add
      .text(width / 2, height / 2 - 40, 'Compost this Prismatic plant?', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#3d4a3a',
      })
      .setOrigin(0.5)
      .setDepth(3002);
    const yes = this.add
      .text(width / 2 - 70, height / 2 + 40, 'Compost', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#fff',
        backgroundColor: '#6b5344',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(3002);
    const no = this.add
      .text(width / 2 + 80, height / 2 + 40, 'Keep', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#fff',
        backgroundColor: '#558b2f',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(3002);
    const close = () => {
      this.confirmRoot?.destroy(true);
      this.confirmRoot = null;
      this.pendingCompostCell = null;
    };
    yes.on('pointerdown', () => {
      const cell = this.pendingCompostCell;
      close();
      if (cell !== null) this.doCompost(cell);
    });
    no.on('pointerdown', close);
    dim.on('pointerdown', close);
    this.confirmRoot = this.add.container(0, 0, [dim, panel, msg, yes, no]);
  }

  private wireEvents(): void {
    const g = this.gameCtrl;
    g.on('stateChanged', () => {
      this.boardView.sync(g.board, g.selectedCell);
      this.hud.syncProgress(g.progression);
      this.refreshWish();
      this.refreshHopper(false);
      this.refreshProducers();
      this.persist();
      this.refreshUndo();
      this.refreshDebug();
    });
    g.on('selectionChanged', () => this.boardView.sync(g.board, g.selectedCell));
    g.on('toast', ({ message }) => this.hud.showToast(message));
    g.on('spawned', ({ cell }) => {
      const p = this.boardView.cellWorldPos(cell);
      this.boardView.pulseCell(cell);
      this.fx.spawnPop(p.x, p.y);
    });
    g.on('highlightMerges', ({ pairs }) => this.boardView.highlightPairs(pairs));
    g.on('mergeStarted', ({ needsBloom, from, to }) => {
      if (!needsBloom) return;
      const a = this.boardView.cellWorldPos(from);
      const b = this.boardView.cellWorldPos(to);
      this.fx.burst((a.x + b.x) / 2, (a.y + b.y) / 2, { count: 6, spread: 36, life: 220 });
      this.bloom.show(g.getBloomTimingForUi(), (pos) => g.resolveBloom(pos));
    });
    g.on('merged', (p) => {
      const pos = this.boardView.cellWorldPos(p.cell);
      this.audio.playMerge();
      this.fx.mergeBurst(pos.x, pos.y);
      this.hud.showFloatingXp(pos.x, pos.y - 30, p.xpGained);
      this.boardView.pulseCell(p.cell);
      if (p.leveledUp) {
        this.audio.playLevelUp();
        this.hud.showToast(`Garden Level ${p.newLevel}!`);
        this.fx.illuminateBackground(280);
        this.refreshProducers();
      }
    });
    g.on('bloomResolved', (p) => {
      const pos = this.boardView.cellWorldPos(p.cell);
      if (p.outcome === 'perfect') {
        this.audio.playPerfect();
        this.fx.perfectBloom(pos.x, pos.y);
      } else if (p.outcome === 'good') {
        this.audio.playGood();
        this.fx.goodBloom(pos.x, pos.y);
      } else {
        this.audio.playMiss();
        this.fx.burst(pos.x, pos.y, { count: 6, colors: [0xb0bec5], spread: 30, life: 280 });
      }
      this.hud.showBloomBanner(p.outcome);
      this.hud.showFloatingXp(pos.x, pos.y - 36, p.xpGained);
      this.boardView.pulseCell(p.cell);
      if (p.leveledUp) {
        this.audio.playLevelUp();
        this.hud.showToast(`Garden Level ${p.newLevel}!`);
        this.refreshProducers();
      }
    });
    g.on('composted', () => this.refreshUndo());
    g.on('compostUndone', () => this.hud.showToast('Compost undone'));
    g.on('orderCompleted', () => this.refreshWish());
    g.on('hopperChanged', () => this.refreshHopper(false));
    g.on('producerUnlocked', ({ name }) => this.hud.showToast(`Unlocked: ${name}`));
  }

  private persist(): void {
    this.saveService.saveDebounced(this.gameCtrl.toSaveData());
  }

  private refreshUndo(): void {
    const pending = this.gameCtrl.compost.pending;
    if (!pending) {
      this.hud.setUndoVisible(false);
      return;
    }
    const left = (pending.expiresAt - Date.now()) / 1000;
    this.hud.setUndoVisible(left > 0, left);
  }

  private refreshDebug(): void {
    if (!this.debugMode) return;
    const a = this.gameCtrl.analytics.data;
    this.hud.setDebug(true, [
      `merges: ${a.mergeCount}`,
      `blooms: ${a.bloomCount} (perfect ${a.perfectCount})`,
      `compost: ${a.compostCount}`,
      `hopper: ${hopperCount(this.gameCtrl.hopper)}`,
      `gold: ${this.gameCtrl.progression.gold}`,
      `restage: ${this.gameCtrl.restoration.stage}`,
      `bridge: ${platformService.hasBridge ? 'yes' : 'local'}`,
    ]);
  }

  update(time: number): void {
    this.bloom?.update(time);
    this.gameCtrl?.tick(Date.now());
    this.refreshUndo();
  }

  shutdown(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
    this.unsubPause?.();
    this.unsubAudio?.();
  }
}
