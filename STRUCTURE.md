# Game Center — Refactored Structure

## Directory Tree

```
├── app/
│   ├── globals.css              ← ONLY file with color values & Tailwind @theme
│   ├── layout.tsx               ← injects font CSS vars, nothing else
│   ├── page.tsx                 ← home / game list
│   └── games/
│       ├── kings/page.tsx       ← tab state only; renders PageLayout + game views
│       └── mambo/page.tsx       ← same pattern
│
├── shared/
│   ├── types/
│   │   └── index.ts             ← Grid2D, Coord, DiffTier, TabItem, BacktrackResult
│   ├── algorithms/
│   │   ├── index.ts             ← barrel
│   │   ├── rng.ts               ← mkRng, shuffle, seedFromLevel, seedFromDiff
│   │   ├── grid.ts              ← bfs, isConnected, floodFill, getRegionBorders …
│   │   ├── backtracking.ts      ← backtrack(), countSolutions()
│   │   ├── difficulty.ts        ← waveDifficulty, levelToDiffScore, lerp, clamp
│   │   └── formatting.ts        ← formatTime, formatScore
│   ├── components/
│   │   ├── index.ts             ← barrel (import everything from here)
│   │   ├── ui/
│   │   │   ├── Button.tsx       ← ControlButton, ActionButton, GhostButton, LoadingSpinner
│   │   │   ├── StatusChip.tsx   ← variant="gold|ok|err|ghost"
│   │   │   ├── WinBanner.tsx    ← detail + actions slots
│   │   │   ├── GameTitle.tsx    ← display title + subtitle
│   │   │   └── DifficultyBadge.tsx ← works with any DiffTier
│   │   ├── layout/
│   │   │   ├── PageLayout.tsx   ← sticky GameTab + <main>
│   │   │   └── GameTab.tsx      ← tab nav bar
│   │   └── charts/
│   │       └── WavePreview.tsx  ← accepts custom scorer fn
│   └── utils/
│       ├── cn.ts                ← className merger
│       └── fonts.ts             ← ALL next/font declarations + fontVariables helper
│
└── games/
    ├── kings/
    │   ├── types/index.ts       ← CellState, SolState, HistoryEntry (Kings-only)
    │   ├── lib/
    │   │   ├── index.ts         ← barrel
    │   │   ├── constants.ts     ← REG_FILL, REGION_FILL_SOLVER … (colors only)
    │   │   ├── difficulty.ts    ← DIFF_TIERS (KingsDiffTier), diffScoreToParams
    │   │   ├── generator.ts     ← generateKingsRegions
    │   │   ├── solver.ts        ← solveKings, kingHasConflict
    │   │   └── metrics.ts       ← measureRegions, RegionMetrics
    │   ├── context/
    │   │   └── KingsBoardContext.tsx
    │   ├── hooks/
    │   │   ├── useKingsBoard.ts
    │   │   ├── useGenerator.ts
    │   │   ├── useSolver.ts
    │   │   └── useTimer.ts
    │   └── components/
    │       ├── KingsGame.tsx
    │       ├── KingsGenerator.tsx
    │       ├── KingsSolver.tsx
    │       ├── HowToPlay.tsx
    │       ├── shared/
    │       │   ├── KingsBoard.tsx
    │       │   ├── KingsTitle.tsx
    │       │   ├── BoardControls.tsx
    │       │   └── BoardStatusBar.tsx
    │       ├── generator/
    │       │   └── GeneratorPanel.tsx
    │       └── solver/
    │           ├── SolverGrid.tsx
    │           ├── SolverToolbar.tsx
    │           └── SolverControls.tsx
    │
    └── mambo/
        ├── types/index.ts       ← CellValue, Constraint, MamboPuzzle, GeneratorMode
        ├── lib/
        │   ├── index.ts
        │   ├── difficulty.ts    ← DIFF_TIERS (MamboDiffTier), levelToTierIdx
        │   └── puzzle.ts        ← generateMamboPuzzle, solveMambo, checkWin
        ├── hooks/
        │   ├── useMamboBoard.ts
        │   ├── useErrorCells.ts
        │   └── useGenerator.ts
        └── components/
            ├── game/
            │   └── MamboGame.tsx
            ├── generator/
            │   ├── MamboGenerator.tsx
            │   └── GeneratorPanel.tsx
            ├── solver/
            │   └── MamboSolver.tsx
            └── shared/
                ├── MamboBoard.tsx
                ├── MamboTitle.tsx
                ├── PlayableBoard.tsx
                └── DiffPicker.tsx
```

---

## Rules (enforce these in every PR)

### 1. Design tokens — ONE place only
All color values live in `app/globals.css` `:root {}`.
The `@theme inline {}` block maps them to Tailwind utilities.
**Never write a hardcoded hex color outside `globals.css` or a game's `lib/constants.ts`.**

```tsx
// ✅ correct
<div className="bg-surface border border-gold-600 text-primary">

// ❌ wrong
<div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", color: "#e8dcc8" }}>
```

### 2. Inline styles — only for dynamic values
Use `style={{}}` only when the value changes at runtime (region fill index, tier accent color, cell pixel size).
Static structure → always Tailwind.

```tsx
// ✅ dynamic region color — must be inline
style={{ background: REG_FILL[reg % 12] }}

// ✅ dynamic tier accent — must be inline
style={{ color: tier.color, borderColor: tier.dim }}

// ❌ static layout — should be className
style={{ display: "flex", flexDirection: "column", gap: 16 }}
// should be: className="flex flex-col gap-4"
```

### 3. Fonts — import from shared only
```tsx
// ✅
import { cinzel } from "@/shared/utils/fonts";

// ❌ — never call next/font inside a game file
import { Cinzel } from "next/font/google";
```

### 4. Shared components — use them
```tsx
// ✅
import { ControlButton, WinBanner, StatusChip } from "@/shared/components";

// ❌ — don't redefine locally
function MyButton() { return <button style={{ fontFamily: "Cinzel" ... }}> }
```

### 5. Import direction — never game → shared → game
```
shared/  →  (no game imports)
games/kings/  →  shared/   ✅
games/mambo/  →  shared/   ✅
games/kings/  →  games/mambo/   ❌  (never cross-game)
shared/       →  games/kings/   ❌  (never shared imports game)
```

### 6. DiffTier — defined once per game
- Base interface `DiffTier` lives in `shared/types/index.ts`
- Each game extends it (`KingsDiffTier`, `MamboDiffTier`) in its own `lib/difficulty.ts`
- **Delete** `games/kings/core/` entirely — it's fully superseded by `games/kings/lib/`

### 7. Routing — all pages under `app/games/`
```
app/games/kings/page.tsx   ← /games/kings
app/games/mambo/page.tsx   ← /games/mambo
```
Delete `app/kings/page.tsx` and `games/mambo/page.tsx` (old orphaned files).

---

## What to delete

| File | Reason |
|------|--------|
| `games/kings/core/` (whole dir) | Superseded by `games/kings/lib/` |
| `games/kings/lib/utils.ts` | Logic split into generator/solver/metrics/difficulty |
| `games/kings/components/context.tsx` | Replaced by `context/KingsBoardContext.tsx` |
| `games/kings/components/Button.tsx` | Use `shared/components/ui/Button.tsx` |
| `games/kings/components/DifficultyBadge.tsx` | Use `shared/components/ui/DifficultyBadge.tsx` |
| `games/kings/components/HowToPlay.tsx` (old) | Replaced by refactored version |
| `games/mambo/const.ts` | Superseded by `games/mambo/lib/difficulty.ts` |
| `games/mambo/global.css` | All styles moved to `app/globals.css` |
| `games/mambo/page.tsx` | Moved to `app/games/mambo/page.tsx` |
| `app/kings/page.tsx` | Moved to `app/games/kings/page.tsx` |
| `shared/component/` (old dir) | Replaced by `shared/components/` |
| `shared/types/index.ts` (old) | Replace with new version |
