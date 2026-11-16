# Petal Flow

Cozy Merge-2 browser game with a precision **Bloom** timing mechanic. Phase A vertical slice.

## Stack

- Phaser **4.2.1**
- TypeScript + Vite + Vitest

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

Debug analytics overlay:

```text
http://localhost:5173/?debug=1
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm test` | Vitest unit tests (pure `src/core` logic) |
| `npm run preview` | Preview production build |

## How to play (Phase A)

1. Tap **Seed Packet** to spawn Sprouts (no energy/timers).
2. Drag items to empty cells to organize.
3. Drag one item onto a matching item, or tap two matching items, to merge.
4. At Bud / Flower / Blooming Flower merges, play the **Bloom** timing bar — Perfect creates a Prismatic variant.
5. Drag unwanted items to **Compost** (5s undo). Prismatic compost needs confirm.
6. Progress autosaves locally; refresh keeps your board and XP.

## Phase status

**Phase A:** 7×7 board, Seed Packet chain, merge, Bloom, Prismatic, XP/levels, compost+undo, mute, local save, playtest counters.

**Phase B:** particle bursts, screen shake, Perfect Bloom illuminate, richer procedural audio, larger touch targets, platform pause/audio/`game_ready` hooks.

**Phase C (current):** Wish Jar orders, Garden restoration view, Mushroom Log + Crystal Spring chains, offline Hopper (4h cap), Playgama Bridge storage adapter + `playgama-bridge-config.json`. Ads intentionally out of scope.

## Spec

See [docs/PETAL_FLOW_MASTER_PROMPT.md](docs/PETAL_FLOW_MASTER_PROMPT.md).
