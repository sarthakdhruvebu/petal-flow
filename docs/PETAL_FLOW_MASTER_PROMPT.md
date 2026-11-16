# PETAL FLOW — MASTER DEVELOPMENT PROMPT (REVISED)

> **Revision purpose:** Same game vision as the original master prompt, rewritten so an implementation agent can execute Phase A without inventing rules or hitting stack/platform contradictions. Game code is **not** started by this document alone — use this file as the source of truth when building.

### What changed vs the original prompt

1. **Pinned stack** — Phaser `^4.2.1` (4.x), Vite `base: './'`, Playgama Bridge v2 noted explicitly.
2. **Persistence contradiction fixed** — `SaveService` + Local/Playgama adapters; game never touches storage APIs directly; local fallback for standalone/dev; Bridge Storage for hosted builds.
3. **Ads vs “no monetization” resolved** — Platform pause/audio/`game_ready` allowed later; interstitial/rewarded **gated off** through Phase C; adapter-ready, not gameplay-wired.
4. **Closed merge/Bloom/Prismatic rules** — Normal↔Prismatic same-tier merges allowed; result is normal next tier unless Perfect Bloom; Bloom triggers when merging **from** tiers 3–5; first-encounter easier config once per save.
5. **Phase A currency scope** — Star XP live; Gold persisted as `0` without earn/spend UI until Phase C.
6. **Milestones A0–A5 with DoD** — Scaffold → board/spawn → merge → Bloom → compost → save/analytics; stop and report after A5.
7. **Architecture hard rule** — `src/core/**` must not import Phaser; logic unit-tested via Vitest.
8. **Design resolution** — 720×1280 portrait-first, `Scale.FIT`, scroll lock.
9. **Deferred systems listed explicitly** — Wish Jar, restoration, Hopper, extra producers cannot be built in Phase A.
10. **Deduplicated** — Monetization bans and soft-lock rules stated once with clear phase gates; agent reporting template added.
11. **Starter data snapshot** — Concrete XP, Bloom widths, undo window, board size for copy-paste into `src/data`.

---

## ROLE AND OBJECTIVE

You are a senior HTML5 game developer, gameplay engineer, technical architect, and casual-game designer.

Your task is to design and develop **Petal Flow**, a polished, production-quality-feeling Merge-2 browser game with a unique precision-based timing mechanic and a cozy magical garden theme.

Build a genuinely playable game with functional interactions and interconnected systems. Do not ship a static mockup or disconnected UI.

Follow this specification closely. Do not invent mechanics outside this document. Do not change the fundamental game vision.

**CRITICAL DESIGN PRINCIPLE:** Gameplay, fun, and retention come first. Monetization is out of scope for Phases A–C.

---

## 0. PROJECT STATUS AND AGENT PROTOCOL

### Current project state

- Workspace may be empty (greenfield) or partially scaffolded.
- Before writing code: inspect the directory, `package.json`, Phaser version, and existing source.
- Prefer extending working code over rewriting it.
- Use Phaser 4 APIs only. Verify against the installed Phaser docs / migration guide. Do not assume Phaser 3 APIs.

### Execution rules

1. Implement **one phase at a time**. Start with **Phase A**.
2. Within Phase A, complete milestones **A0 → A5** in order. Do not skip ahead to Wish Jar, Garden Restoration, Hopper, or extra producers.
3. After each milestone: run `npm run build` (or equivalent), run relevant Vitest suites, fix failures, then continue.
4. Do not claim tests pass unless they were actually run.
5. Do not claim the game is “complete” after Phase A — report completed features and remaining limitations honestly.
6. Do not introduce React, Next.js, or other UI frameworks.
7. Do not implement energy systems, ads, IAP, timers that gate spawning, or paywalls.
8. Do not put the entire game in one Phaser scene or one giant file.
9. Keep gameplay logic independently testable from rendering.

### Definition of success for this prompt

Deliver a browser-playable Phase A vertical slice that a tester can open with `npm run dev` and play for 5–10 minutes with merges, Bloom, compost, XP, and save/load working.

---

## 1. GAME OVERVIEW

| Field | Value |
|---|---|
| Name | Petal Flow |
| Genre | Merge-2 / casual skill / cozy garden restoration |
| Platform | HTML5 browser |
| Audience | Adults 25–44, short-session casual play |
| Distribution path | Playgama Bridge (covers Poki, CrazyGames, GameDistribution, etc.) + standalone |

**Pitch:** Players cultivate a magical garden by spawning plants, merging identical items, and performing a brief precision Bloom challenge that can create rare Prismatic plants. The core loop must create the desire for “just one more merge.”

**Feel:** Relaxing, satisfying, rewarding, visually beautiful, easy to understand, hard to put down.

---

## 2. TECHNOLOGY STACK (PINNED)

| Component | Technology | Pin / notes |
|---|---|---|
| Engine | Phaser 4 | `phaser@^4.2.1` (or latest 4.x at install time; record exact version in README) |
| Language | TypeScript | strict mode |
| Build | Vite | ESM, `base: './'` for portal-friendly relative assets |
| Platform SDK | Playgama Bridge v2 | `@playgama/bridge` + Vite plugin when integrating |
| Tests | Vitest | unit-test pure logic modules |
| VCS | Git + GitHub | |
| Persistence | Adapter pattern | Bridge Storage on platforms; local fallback for standalone/dev |

### Technical requirements

1. Phaser 4 for rendering, animations, game objects, scenes, input, effects.
2. TypeScript throughout.
3. Vite for dev and production builds.
4. Vitest for merge / Bloom / board / save / progression logic.
5. Game must run locally without a live platform host.
6. Desktop + mobile browser support.
7. Minimal dependencies. No React/Next.js.
8. Consult Phaser 4 docs for the installed version (render nodes, filters, lighting). Treat Phaser 3 snippets as unverified.

### Recommended module layout

```text
src/
  main.ts
  game/
    scenes/          # Boot, Preload, Main, (Garden later)
    board/           # BoardView only — rendering + input wiring
    items/           # ItemView / sprites
    producers/       # ProducerView
    bloom/           # BloomOverlay view
    effects/         # particles, shake, floating text
  core/              # PURE LOGIC — no Phaser imports
    board/
    items/
    merge/
    bloom/
    producers/
    compost/
    progression/
    save/
    analytics/
  systems/           # orchestration / services used by scenes
  ui/
  data/              # JSON or TS config tables
  audio/
  platform/          # Bridge wrapper + no-op/local adapters
  config/
  tests/             # or co-located *.test.ts next to core/
```

**Hard rule:** `src/core/**` must not import Phaser. Scenes and views call core; core never calls views.

---

## 3. VISUAL IDENTITY

Cozy magical botanical garden. Soft natural lighting. Whimsical plants. Gentle particles.

**Palette:** sage green, soft mint, warm cream, pastel pink, gentle lavender, muted yellow, subtle gold.

**Avoid:** neon saturation, harsh contrast, dark/scary mood, childish UI chrome, generic mobile-game template look, purple-glow “AI default” UI.

**Item art:** Distinct silhouettes and clear tier progression (Sprout → … → Magical Flower). Prismatic variants are iridescent / rainbow-edged versions of the same silhouette — not separate chains.

**Placeholders:** Procedural colored shapes + short labels are allowed in Phase A. Asset keys must be data-driven so art can be swapped without rewriting gameplay.

**Design resolution:** Target logical size **720 × 1280** (portrait-first). Scale with Phaser `Scale.FIT` + center. Lock browser scroll/gesture interference during play (`touch-action: none` on the game container).

---

## 4. CORE GAMEPLAY — MERGE-2 (CLOSED RULES)

### 4.1 Board

- Grid: **7 × 7** = 49 cells.
- Each cell holds at most one merge item.
- Producers live in a **separate Producer rail**, never on the 49 cells.
- Compost Bin is adjacent to the board, always available.

### 4.2 Player actions (Phase A)

| Action | Rule |
|---|---|
| Tap Producer | Spawn one output item into a random empty board cell. No energy. No cooldown. |
| Drag item | Move to empty cell. Dropping on occupied cell cancels move (or returns to origin). |
| Tap-to-merge | Tap item A (select), tap identical compatible item B → merge at B’s cell (or configured merge target). |
| Drag-merge | Drag item onto identical compatible item → merge at destination cell. |
| Compost | Drag item onto Compost Bin (or select + Compost action). |

Merges **always** require player input. Never auto-merge.

### 4.3 Compatibility (authoritative)

Two items can merge iff:

1. Same `chainId`
2. Same `tier`
3. Both are mergeable (not max tier)
4. Either both normal, both Prismatic, **or one normal + one Prismatic**

**Result base item:** next tier, **normal** variant — unless Bloom fires and outcome is Perfect (then Prismatic next tier).

Max-tier items cannot merge further.

### 4.4 Producer spawn

- Initial producer: **Seed Packet** → spawns `sprout` (tier 1, Seed chain).
- On tap: if empty cells exist, place one item in a uniformly random empty cell and play bounce/spawn VFX.
- If board full: do **not** spawn; show gentle toast; optionally highlight mergeable pairs; never discard board items.

### 4.5 Full board soft-lock prevention

When spawn is blocked:

- Message: “Board full — merge or compost to make space.”
- If board full **and** no legal merges exist: “No merges available — compost an item to make space.”

Compost Bin guarantees space can always be freed.

---

## 5. MERGE CHAINS (DATA-DRIVEN)

All chains live in `src/data/chains.ts` (or JSON). Do not hardcode tier tables inside scene code.

### Phase A — Seed Packet chain only

| tier | id | name | bloomEligible |
|---|---|---|---|
| 1 | sprout | Sprout | no |
| 2 | leaf | Leaf | no |
| 3 | bud | Bud | **yes** |
| 4 | flower | Flower | **yes** |
| 5 | blooming_flower | Blooming Flower | **yes** |
| 6 | magical_flower | Magical Flower | no (max) |

### Later phases (do not implement in Phase A)

- Mushroom Log: Tiny Mushroom → Mushroom → Mushroom Cluster → Glowing Mushroom
- Crystal Spring: Crystal Droplet → Crystal → Crystal Cluster → Prismatic Crystal

Each item record fields: `id`, `displayName`, `chainId`, `tier`, `producerId`, `spriteKey`, `bloomEligible`, `isPrismatic` (runtime flag / variant), optional `prismaticSpriteKey`.

---

## 6. BLOOM — SIGNATURE MECHANIC (CLOSED RULES)

Bloom runs **after** a valid merge is confirmed and **only** when the **resulting** tier’s source merge was from a `bloomEligible` tier (i.e. merging two buds → flower triggers Bloom before the result is finalized; same for flower→blooming, blooming→magical).

### 6.1 Flow

1. Player initiates legal merge at a Bloom-eligible tier.
2. Pause board input.
3. Show compact horizontal timing overlay (≤ ~2.2s active challenge).
4. Indicator sweeps; player taps/clicks once to stop.
5. Resolve Perfect / Good / Miss.
6. Create result item; play VFX/SFX; award XP; resume board.

### 6.2 Default `BloomConfig` (`src/data/bloomConfig.ts`)

```ts
export const BloomConfig = {
  sweepDurationMs: 2000,
  perfectWidth: 0.15,          // center 15% of bar
  goodWidthEachSide: 0.25,     // 25% left + 25% right of perfect → total good bands 50%
  // miss = remaining 35%
  easing: 'linear',            // configurable
  firstEncounter: {
    sweepDurationMs: 2400,
    perfectWidth: 0.22,
    goodWidthEachSide: 0.26,
  },
  triggerTiers: [3, 4, 5],     // merging FROM these tiers triggers Bloom
};
```

Zones must sum to 100% of bar width. Keep values data-driven.

### 6.3 Outcomes

| Outcome | Item | Feedback | XP |
|---|---|---|---|
| Perfect | Prismatic variant of next tier | Rainbow particles, BG flash, “PERFECT BLOOM!”, success SFX | merge XP + bonus |
| Good | Normal next tier | Subtle positive VFX | merge XP |
| Miss | Normal next tier | Soft miss cue; **no punishment** | merge XP |

Bloom is never mandatory for progression. Missing never deletes items, blocks unlocks, or costs currency.

### 6.4 Prismatic rules

- Same `tier` and `chainId` as normal counterpart.
- Can merge with normal or Prismatic of same tier (see §4.3).
- Do **not** create separate Prismatic-only chains.
- Prismatic is optional flair / future Wish Jar spice — not required for Phase A progression.
- Composting a Prismatic item requires an extra confirmation dialog.

---

## 7. COMPOST BIN

- Free, no cooldown, no currency cost.
- Drag/drop unwanted item → play compost VFX → remove after undo window.
- **Undo window:** 5 seconds. Restore item to original cell if still empty; else first available empty cell; if none, keep in undo buffer until space exists (do not hard-delete during undo).
- Prismatic: confirm before compost.
- Track `compostCount` in analytics for playtests.

---

## 8. PROGRESSION (PHASE A SCOPE)

### Currencies

| Currency | Phase A | Use |
|---|---|---|
| Star XP | Yes | Levels / unlocks |
| Gold Coins | Track in save as `0`; no earn/spend UI required in Phase A | Used in Phase C restoration / orders |

### XP sources (configurable in `src/data/progression.ts`)

| Action | Default XP |
|---|---|
| Merge to tier N | `5 * N` |
| Perfect Bloom bonus | `+15` |
| Good / Miss | `0` bonus |

### Levels (fast playtest curve)

| Level | XP cumulative | Unlock |
|---|---|---|
| 1 | 0 | Seed Packet |
| 2 | 40 | — (toast: “Garden growing”) |
| 3 | 100 | — |
| 4 | 180 | Placeholder unlock toast (future producer) |
| 5+ | +100 each | Extend via data |

UI: Garden Level, XP bar, floating “+XP” text. Unlock toasts for level-ups.

**Out of Phase A:** Wish Jar orders, Gold earn, Garden Restoration spend, Hopper offline production, extra producers/chains.

---

## 9. SYSTEMS DEFERRED TO LATER PHASES

Documented so agents do **not** build them early.

### Phase C — Wish Jar

Spirit requests items (qty, rewards). Manual submit removes items from board. Prismatic orders optional. Data-driven generation.

### Phase C — Garden Restoration

Spend Gold on visible environment upgrades (debris → gazebo → flowers → fountain → Koi Pond). Dedicated garden view.

### Phase C — Hopper (offline)

Timestamp-based accumulation, max 4 hours, store concrete item outputs, batch collect when space exists, clock-rollback ⇒ grant 0 extra. Never discard silently. Never paywall.

### Phase C — Extra producers/chains

Mushroom Log, Crystal Spring + their chains.

---

## 10. PLATFORM + SAVE ARCHITECTURE

### Persistence adapter (required)

```text
SaveService
  ├── LocalSaveAdapter      # localStorage / IndexedDB for standalone + vitest
  └── PlaygamaSaveAdapter   # bridge.storage.get/set only
```

Rules:

1. Game code talks only to `SaveService`, never to `localStorage` or `bridge.storage` directly.
2. On Playgama-hosted builds, `PlaygamaSaveAdapter` is active (Bridge picks cloud vs local internally).
3. On standalone / local Vite, `LocalSaveAdapter` is active.
4. Schema versioning + validation on load. Invalid/corrupt ⇒ safe defaults; **never** overwrite a valid save with invalid data.
5. Autosave after meaningful actions (merge, spawn, compost confirm, level-up, settings). Debounce rapid actions (~250–500ms). Also save on `visibilitychange` / `pagehide`.

### Persist fields

Garden Level, XP, Gold, board grid (item ids + prismatic flags), producer unlocks, settings (mute/volume), compost analytics counters, save schema version. (Later: orders, restoration, hopper.)

### Playgama integration policy

- **Phase A:** Optional thin `platform/` bootstrap. Prefer mock-safe Bridge init if easy; otherwise stub `PlatformService` with no-ops and local saves. Game must run without Bridge.
- **Phase B:** Pause/audio hooks (`isAudioEnabled`, pause events), `game_ready` message when first interactive frame is up.
- **Phase C:** Full Bridge Storage path + `playgama-bridge-config.json` in build output.
- **Ads / IAP / rewarded:** Forbidden in Phases A–C. Do not call `showInterstitial` or rewarded APIs until a later monetization phase after playtest validation. Keep a single commented/gated `PlatformAds` stub if needed for future compliance — do not wire into gameplay.

This resolves the conflict between “no monetization while validating” and portal SDK checklists: architecture is adapter-ready; ad calls stay disabled.

---

## 11. UI LAYOUT

**Top:** Garden Level · Star XP bar · Gold (may show `0` in Phase A)  
**Center:** 7×7 board  
**Side / adjacent:** Compost Bin · Producer rail  
**Bottom:** (Phase A) Settings/mute · light status toasts. Wish Jar / Garden / Hopper slots appear as disabled or hidden until their phases.  
**Bloom:** Compact centered overlay  
**Mobile:** Large touch targets (≥44px), no accidental page scroll, usable portrait; landscape best-effort.  
**Desktop:** Mouse drag + click.

---

## 12. GAME FEEL (PHASE A MINIMUM → PHASE B POLISH)

**Phase A minimum:** merge scale/converge, spawn pop, compost fade, Bloom bar + outcome text, basic SFX placeholders (or WebAudio beeps), mute toggle.

**Phase B:** particles, screen shake, Perfect Bloom rainbow burst + BG illuminate, richer audio, mobile control polish.

Animation durations must stay snappy (merge ≤ ~350ms active motion; Bloom challenge ≈ 2s; UI never feels sluggish).

---

## 13. PERFORMANCE

- Avoid heavy allocations in `update()`.
- Pool particles / floating text where useful.
- Compress assets; keep initial bundle lean.
- Stable resize; target smooth 60fps on mid-range mobile for Phase A content.

---

## 14. TESTING REQUIREMENTS

Vitest coverage for `src/core/**`:

- Valid / invalid merges
- Chain transitions + max tier
- Normal+Prismatic merge compatibility
- Bloom zone classification (Perfect/Good/Miss) from indicator position
- Prismatic creation on Perfect only
- Board capacity / spawn refusal
- Compost remove + undo restore
- XP + level thresholds
- Save serialize/validate/load round-trip
- Clock-rollback helper (Hopper tests in Phase C)

Manual browser checks after Phase A:

- Drag move, drag merge, tap-to-merge
- Touch on mobile viewport
- Resize
- Refresh persistence
- Full board + compost soft-lock escape

---

## 15. ROADMAP AND MILESTONE DoD

### PHASE A — Core vertical slice

#### A0 — Project scaffold

- Vite + TypeScript + Phaser 4 + Vitest
- README with `npm install`, `npm run dev`, `npm test`, `npm run build`
- Empty Main scene renders pastel background + title “Petal Flow”
- **DoD:** `npm run build` and `npm test` succeed (even if zero tests yet, harness works)

#### A1 — Board + producers + movement

- 7×7 grid, Seed Packet rail, spawn into random empty cell, drag to empty cells, full-board message
- **DoD:** Can fill board with sprouts and rearrange; cannot spawn when full

#### A2 — Merge + chain

- Drag-merge + tap-to-merge; Sprout→…→Magical Flower data-driven
- Merge VFX stub + XP grant
- **DoD:** Can create a Magical Flower from scratch; invalid merges rejected; Vitest merge tests pass

#### A3 — Bloom + Prismatic

- Bloom overlay + config; Perfect/Good/Miss; Prismatic on Perfect; first-encounter easier config once per save
- **DoD:** Merging buds triggers Bloom; Perfect yields Prismatic Flower; Miss still yields normal Flower; Bloom tests pass

#### A4 — Compost + undo

- Compost, 5s undo, Prismatic confirm, soft-lock copy when no merges
- **DoD:** Can clear a full board via compost; undo restores item; analytics counter increments

#### A5 — Save/load + Phase A wrap

- Local save adapter, autosave, reload restores board/XP/level/settings
- Mute toggle persisted
- Minimal playtest analytics log (in-memory + optional `?debug=1` overlay): time to first merge, Bloom counts, Perfect rate, merges, composts, board-full events
- **DoD:** Refresh browser keeps progress; play 5–10 minutes without soft-lock; Phase A README section lists known limitations (no Wish Jar / garden / hopper / extra producers)

**Phase A goal:** Genuinely playable 5–10 minute tester build. No garden restoration. No complex orders.

### PHASE B — Polish

Visual quality, merge/Bloom VFX, particles, audio, mobile controls, UI pass, soft-lock + save reliability hardening. Platform pause/audio + `game_ready` if Bridge present.

### PHASE C — Full systems

Wish Jar, Garden Restoration, extra producers/chains, Hopper, Playgama cloud save path, additional biomes.

### After validation only

Optional rewarded ads, cosmetics, seasonal themes — **not** before 10–15 playtester directional validation.

---

## 16. PLAYTEST METRICS (INSTRUMENT IN PHASE A)

Track locally (debug overlay / exported counters):

1. Time to first merge  
2. Time to first Bloom  
3. Perfect Bloom success rate  
4. Merges per minute  
5. Compost usage  
6. Board-full frequency  
7. Session duration  

Validation questions (human observation, not code): understand merge without tutorial? understand Bloom in ≤3 encounters? chase Perfect? continue after 5 minutes? feel relaxing? want to return?

---

## 17. STRICT RESTRICTIONS

**Do not implement in Phases A–C:**

- Energy / regen / refills  
- Ads (interstitial or rewarded) wired into gameplay  
- IAP / paid currency / paywalls  
- Artificial waiting periods on producers  
- Auto-merge  
- Punishments for Bloom Miss  
- Unrelated genres/systems (combat, social feed, etc.)  

**Do not:**

- Replace working systems unnecessarily  
- Skip soft-lock prevention  
- Use placeholder buttons that do nothing in the active Phase A UI  
- Claim Phaser 3 code is correct for Phaser 4 without verification  

---

## 18. STARTER DATA SNAPSHOT (COPY INTO `src/data`)

Agents should create these tables first and code against them.

**Producers**

```ts
{ id: 'seed_packet', name: 'Seed Packet', outputItemId: 'sprout', unlocked: true }
```

**Merge XP:** `5 * resultTier`  
**Perfect bonus:** `15`  
**Compost undoMs:** `5000`  
**Board:** `{ cols: 7, rows: 7 }`

---

## 19. AGENT REPORTING FORMAT (END OF EACH MILESTONE)

```text
## Completed
- …

## Verified
- build: pass/fail
- tests: pass/fail (names)
- manual: …

## Limitations
- …

## Next milestone
- …
```

---

## 20. FINAL OBJECTIVE

Deliver **Petal Flow** as a genuinely playable, responsive HTML5 game. Begin with Phase A (A0–A5). When Phase A DoD is met, stop and report — wait for explicit instruction before Phase B or C.

**Monetization remains out of scope until the core loop is validated as fun and retentive.**
