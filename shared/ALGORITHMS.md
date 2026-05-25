# 🎮 Game Center - Shared Algorithms Documentation

Dokumentasi lengkap semua algoritma yang digunakan di Game Center. Semua algoritma ini game-agnostic dan dapat digunakan oleh berbagai game (Kings, Mambo, Set, Shikaku, Tower, dll).

---

## 📦 Modules Overview

| Module           | Purpose                         | Use Case                                    |
| ---------------- | ------------------------------- | ------------------------------------------- |
| **rng**          | Pseudo-random number generation | Puzzle generation, seeding, shuffling       |
| **grid**         | 2D grid algorithms              | Pathfinding, connectivity, region detection |
| **difficulty**   | Wave-based difficulty scoring   | Level difficulty calculation                |
| **backtracking** | Generic constraint solver       | Puzzle solving, validation                  |
| **formatting**   | Display utilities               | UI rendering, stats display                 |

---

## 🎲 RNG Module (`rng.ts`)

Deterministic pseudo-random utilities untuk puzzle generation yang reproducible.

### Functions

#### `mkRng(seed: number): RngFn`

**Mulberry32 PRNG** - Create deterministic seeded random number generator.

```typescript
import { mkRng } from "@/shared/algorithms";

const rng = mkRng(12345);
const randomValue = rng(); // Returns [0, 1)
const randomValue2 = rng(); // Different value
```

**Why Mulberry32?**

- ✅ Small state (1 uint32)
- ✅ Fast (few multiplications per call)
- ✅ Good distribution for puzzle generation
- ✅ Deterministic (same seed = same sequence)

---

#### `nextInt(rng: RngFn, max: number): number`

**Random integer in [0, max)** - Faster than `Math.floor(rng() * max)` in hot loops.

```typescript
const rng = mkRng(42);
const die = nextInt(rng, 6); // Random 0-5
const col = nextInt(rng, 10); // Random 0-9
```

**Performance:** Avoids float→int conversion via bitwise OR.

---

#### `shuffle<T>(arr: T[], rng?: RngFn): T[]`

**Fisher-Yates shuffle** - In-place random shuffle with optional seeding.

```typescript
const items = [1, 2, 3, 4, 5];
shuffle(items, rng); // Seeded shuffle
shuffle(items); // Uses Math.random
```

**Algorithm:**

```
for i from n-1 down to 1:
  j = random integer 0 to i
  swap arr[i] and arr[j]
```

---

#### `seedFromLevel(level: number): number`

**Derive reproducible seed from level number** - Same level always generates same seed.

```typescript
const seed1 = seedFromLevel(5); // Level 5
const seed2 = seedFromLevel(5); // Same seed
const seed3 = seedFromLevel(10); // Different seed
```

**Hash Function:** Custom mixing using XOR and imul operations.

---

#### `seedFromDiff(tierIdx: number, entropy: number): number`

**Derive seed from difficulty tier + entropy** - Adds variation while keeping determinism.

```typescript
const tier = 3; // Difficulty tier 1-9
const entropy = Date.now();
const seed = seedFromDiff(tier, entropy); // Unique seed per session
```

**Use Case:** Generate different puzzles each session while maintaining difficulty.

---

#### `weightedRandom(weights: readonly number[], rng: RngFn, totalWeight?: number): number`

**Weighted random selection** - Pick index based on weight distribution.

```typescript
const rng = mkRng(42);
const weights = [10, 20, 30, 40]; // Distribution
const choice = weightedRandom(weights, rng);

// Returns index with probability:
// 0: 10% (10/100)
// 1: 20% (20/100)
// 2: 30% (30/100)
// 3: 40% (40/100)
```

**Algorithm:** Linear scan with cumulative weights.

---

#### `sumWeights(weights: readonly number[]): number`

**Sum weights efficiently** - Tight loop for performance.

```typescript
const total = sumWeights([5, 10, 15]); // 30
```

---

## 🗺️ Grid Module (`grid.ts`)

Generic 2D grid algorithms - works on `number[][]` with `[row, col]` coordinates.

### Core Algorithms

#### `bfs(opts: BfsOptions): Map<number, number>`

**Breadth-First Search** - Find all reachable cells from start.

```typescript
import { bfs } from "@/shared/algorithms";

const visited = bfs({
  grid,
  start: [3, 4],
  canVisit: (r, c, fromR, fromC) => {
    // Check if cell is walkable
    return grid[r][c] !== OBSTACLE;
  },
  onVisit: (r, c, dist) => {
    console.log(`Visited [${r},${c}] at distance ${dist}`);
    // Return true to stop early
  },
  dirs: CARDINAL_DIRS, // [[-1,0], [1,0], [0,-1], [0,1]]
});

// visited is Map: key = r*cols+c, value = distance
for (const [cellKey, dist] of visited) {
  const r = Math.floor(cellKey / cols);
  const c = cellKey % cols;
  console.log(`[${r},${c}]: distance ${dist}`);
}
```

**Use Cases:**

- Finding shortest path distance
- Determining connected regions
- Flood fill validation
- Pathfinding in puzzle games

---

#### `isConnected(cells: Coord[], grid: Grid2D, regionId: number): boolean`

**Check if cells form connected component** - Validates region connectivity.

```typescript
const allCells = [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 1],
];
if (isConnected(allCells, grid, 5)) {
  console.log("All cells are connected!");
}
```

**Algorithm:** BFS from first cell, check if reaches all others.

---

#### `getRegionCells(grid: Grid2D, regionId: number): Coord[]`

**Get all cells of a region** - Collect all cells matching regionId.

```typescript
const kingsCells = getRegionCells(grid, 1); // All cells in region 1
```

---

#### `getRegionIds(grid: Grid2D, excludeNegative?: boolean): number[]`

**Get unique region IDs** - Returns sorted list of region identifiers.

```typescript
const regions = getRegionIds(grid); // [0, 1, 2, 3, 4, ...]
```

---

#### `floodFill(opts: FloodFillOptions): Coord[]`

**Paint bucket flood fill** - Fill connected cells with new value (mutates grid).

```typescript
const filled = floodFill({
  grid,
  start: [2, 3],
  targetValue: -1, // Fill empty cells
  fillValue: 5, // With region 5
  dirs: CARDINAL_DIRS,
});

console.log(`Filled ${filled.length} cells`);
for (const [r, c] of filled) {
  console.log(`Filled [${r},${c}]`);
}
```

---

#### `labelComponents(grid: Grid2D, unassignedValue?, startId?): number`

**Label connected components** - Assign unique IDs to unassigned cells.

```typescript
// Grid with -1 (unassigned), 0 (assigned)
const numRegions = labelComponents(grid, -1, 0);
console.log(`Found ${numRegions} regions`);
```

**Algorithm:** Iterate grid, flood-fill each unassigned cell with new ID.

**Use Cases:**

- Splitting grid into independent regions
- Region formation in puzzle generation
- Connectivity validation

---

### Region Borders

#### `getRegionBorders(grid: Grid2D, r: number, c: number): CellBorders`

**Detect cell edges at region boundary** - Returns which edges touch different region.

```typescript
const borders = getRegionBorders(grid, 3, 4);
// Returns:
// {
//   top: true,     // [2,4] has different region
//   bottom: false, // [4,4] same region
//   left: false,   // [3,3] same region
//   right: true    // [3,5] different region
// }

// Render cell borders in UI
if (borders.top) ctx.drawLine(...topLine);
if (borders.right) ctx.drawLine(...rightLine);
```

**Use Case:** Drawing region outlines in puzzle UI.

---

### Distance Metrics

#### `manhattanDist(coord1: Coord, coord2: Coord): number`

**Manhattan distance** - Grid distance (only horizontal/vertical moves).

```typescript
const dist = manhattanDist([0, 0], [3, 4]); // 7 (3 + 4)
```

**Formula:** `|r1 - r2| + |c1 - c2|`

---

#### `chebyshevDist(coord1: Coord, coord2: Coord): number`

**Chebyshev distance** - King-move distance (8-directional).

```typescript
const dist = chebyshevDist([0, 0], [3, 4]); // 4 (max of 3, 4)
```

**Formula:** `max(|r1 - r2|, |c1 - c2|)`

**Use Case:** Kings game (king can move 1 square in any direction).

---

#### `areAdjacent8(coord1: Coord, coord2: Coord): boolean`

**Check 8-directional adjacency** - True if cells touch (including diagonals).

```typescript
areAdjacent8([0, 0], [1, 1]); // true (diagonal)
areAdjacent8([0, 0], [2, 0]); // false (2 away)
```

---

#### `areAdjacent4(coord1: Coord, coord2: Coord): boolean`

**Check 4-directional adjacency** - True if cells are cardinal neighbors.

```typescript
areAdjacent4([0, 0], [0, 1]); // true (right)
areAdjacent4([0, 0], [1, 1]); // false (diagonal)
```

---

### Grid Utilities

#### `makeGrid(rows: number, cols: number, value: number): Grid2D`

**Create new grid** - Fill with initial value.

```typescript
const grid = makeGrid(5, 5, -1); // 5x5 grid filled with -1
```

---

#### `cloneGrid(grid: Grid2D): Grid2D`

**Deep clone grid** - Prevent mutations from affecting original.

```typescript
const original = [
  [1, 2],
  [3, 4],
];
const copy = cloneGrid(original);
copy[0][0] = 99;
console.log(original[0][0]); // 1 (unchanged)
```

---

#### `neighbors4(r: number, c: number, rows: number, cols: number): Coord[]`

**Get cardinal neighbors** - Returns in-bounds neighbors.

```typescript
const neighs = neighbors4(2, 2, 5, 5);
// [[1,2], [3,2], [2,1], [2,3]] or subset if on edge
```

---

## 📊 Difficulty Module (`difficulty.ts`)

Wave-based difficulty system - maps level → difficulty score (1-9).

### Core Algorithm

#### `waveDifficulty(opts: WaveDifficultyOptions): number`

**Calculate difficulty score using waves** - Combines log curve + sine waves + noise.

```typescript
import { waveDifficulty } from "@/shared/algorithms";

const score = waveDifficulty({
  level: 42,
  minScore: 1,
  maxScore: 9,
  logBase: 1000,
  waveAmplitudes: [0.9, 0.5, 0.3],
  waveFreqs: [0.31, 0.07, 0.013],
  noiseAmp: 0.6,
});
// Returns value between 1 and 9
```

**Algorithm Composition:**

```
score = base + wave + noise

base = minScore + (maxScore - minScore) * log(level) / log(logBase)
       ↓ Logarithmic growth - overall upward trend

wave = 0.9 * sin(level * 0.31 + 1.1)
     + 0.5 * sin(level * 0.07 + 2.3)
     + 0.3 * sin(level * 0.013 + 0.7)
       ↓ Three sine waves - oscillating pattern

noise = (rng() - 0.5) * 2 * 0.6
        ↓ Seeded random - same level = same noise
```

**Why This Design?**

- 📈 **Log base**: Slows growth rate (smooth progression)
- 🌊 **Three waves**: Different frequencies create natural variation
- 🎲 **Noise**: Breaks monotony, adds organic feel
- 🔄 **Seeded**: Same level always same score (reproducible)

---

#### `levelToDiffScore(level: number): number`

**Quick difficulty lookup** - Uses default wave parameters.

```typescript
const score = levelToDiffScore(5); // Quick: returns ~1.5
const score2 = levelToDiffScore(42); // Quick: returns ~5.2
```

---

#### `normalizeScore(score: number, min?, max?): number`

**Normalize score to [0, 1]** - Linear mapping.

```typescript
const norm = normalizeScore(5, 1, 9); // (5-1)/(9-1) = 0.5
```

---

#### `lerp(a: number, b: number, t: number): number`

**Linear interpolation** - Smoothly blend between two values.

```typescript
const value = lerp(10, 20, 0.5); // 15
const value2 = lerp(10, 20, 0.75); // 17.5
```

---

#### `clamp(value: number, min: number, max: number): number`

**Constrain to range** - Clamp value between min/max.

```typescript
clamp(5, 1, 10); // 5 (in range)
clamp(-5, 1, 10); // 1 (too low)
clamp(15, 1, 10); // 10 (too high)
```

---

#### `diffScoreToTierIdx(score: number, numTiers: number): number`

**Convert difficulty score → tier index** - Map 1-9 score to tier (0-based).

```typescript
const tierIdx = diffScoreToTierIdx(7.5, 9); // Returns 7 (tier index)
```

---

#### `levelToTierIdx(level: number, numTiers: number): number`

**Direct level → tier conversion** - Combines levelToDiffScore + diffScoreToTierIdx.

```typescript
const tierIdx = levelToTierIdx(100, 9); // Which tier for level 100?
```

---

#### `sampleWave(centerLevel: number, halfWindow?: number, opts?): Array<{level, score}>`

**Sample difficulty wave for charting** - Get range of scores around center.

```typescript
import { sampleWave } from "@/shared/algorithms";

const samples = sampleWave(50, 20);
// Returns 41 points: level 30-70, showing wave pattern

// Render chart
samples.forEach(({ level, score }) => {
  chart.drawPoint(level, score);
});
```

**Use Case:** Rendering difficulty curve visualization.

---

## 🔄 Backtracking Module (`backtracking.ts`)

Generic constraint-satisfaction solver - decoupled from any specific game.

### The Challenge

Many puzzle games require solving with backtracking:

- Kings: Find valid placements for regions
- Sudoku: Fill cells with constraints
- Set: Find valid card combinations
- Shikaku: Partition grid into rectangles

Instead of duplicating backtracking logic, **provide an interface** and let caller implement game-specific logic.

---

#### `backtrack<TChoice, TSolution>(opts: BacktrackOptions): BacktrackResult`

**Generic depth-first backtracking solver** - Find one solution.

```typescript
import { backtrack } from "@/shared/algorithms";

const result = backtrack({
  totalSteps: 10, // 10 regions to fill
  candidates: (step) => {
    // What choices are available at step N?
    return possiblePlacements[step];
  },
  isValid: (choice, step) => {
    // Is this choice valid (respects constraints)?
    return validatePlacement(choice, step);
  },
  apply: (choice, step) => {
    // Apply choice to internal state
    board[choice.region] = choice.placement;
  },
  undo: (choice, step) => {
    // Reverse the apply
    board[choice.region] = undefined;
  },
  buildSolution: () => {
    // Extract solution once all steps filled
    return { board: cloneGrid(board), regions: [...regions] };
  },
  maxStates: 100000, // Optional: abort if explores too many states
});

if (result.found) {
  console.log("Solution found!");
  console.log("Explored:", result.statesExplored, "states");
  console.log("Solution:", result.solution);
} else {
  console.log("No solution found.");
}
```

**BacktrackResult Type:**

```typescript
interface BacktrackResult<TSolution> {
  found: boolean; // Did we find a solution?
  solution: TSolution | null;
  statesExplored: number; // How many states tried?
}
```

**Algorithm:**

```
DFS(step):
  if step == totalSteps:
    return true (found solution)

  for each candidate at this step:
    if isValid(candidate):
      apply(candidate)
      if DFS(step + 1):
        return true
      undo(candidate)

  return false (backtrack)
```

**Performance Notes:**

- Uses `maxStates` to prevent exponential explosion
- Returns early on first solution found
- Tracks exploration count for diagnostics

---

#### `countSolutions<TChoice, TSolution>(opts: BacktrackOptions, limit?): number`

**Count solutions (up to limit)** - Verify puzzle has unique solution.

```typescript
const count = countSolutions(
  {
    // ... same options as backtrack ...
  },
  2,
); // Stop after finding 2

if (count === 0) {
  console.log("❌ No solution exists");
} else if (count === 1) {
  console.log("✅ Unique solution");
} else {
  console.log("⚠️ Multiple solutions exist");
}
```

**Use Case:**

- Puzzle generation validation
- Ensuring difficulty/uniqueness
- Diagnostics

---

## 📝 Formatting Module (`formatting.ts`)

Display utilities - convert raw values to user-friendly strings.

#### `formatTime(seconds: number): string`

**Format elapsed time as M:SS** - Common for game timers.

```typescript
formatTime(90); // "1:30"
formatTime(5); // "0:05"
formatTime(125); // "2:05"
```

---

#### `formatTimeLong(seconds: number): string`

**Format elapsed time as HH:MM:SS** - For long sessions.

```typescript
formatTimeLong(3661); // "1:01:01"
formatTimeLong(90); // "1:30"
formatTimeLong(3599); // "59:59"
```

---

#### `formatScore(score: number, decimals?): string`

**Format difficulty score for display** - Fixed decimals.

```typescript
formatScore(7.38); // "7.4" (1 decimal)
formatScore(7.38, 2); // "7.38" (2 decimals)
```

---

#### `formatLargeNumber(n: number): string`

**Format large numbers with suffixes** - Compact display.

```typescript
formatLargeNumber(500); // "500"
formatLargeNumber(5500); // "5.5K"
formatLargeNumber(1200000); // "1.2M"
```

---

#### `formatPercent(ratio: number, decimals?): string`

**Format 0-1 ratio as percentage** - Show as %.

```typescript
formatPercent(0.756); // "75.6%"
formatPercent(0.5, 0); // "50%"
formatPercent(0.3333); // "33.3%"
```

---

## 🔗 Integration Examples

### Example 1: Puzzle Generation with Backtracking + RNG

```typescript
import { mkRng, shuffle, backtrack } from "@/shared/algorithms";

// Generate a puzzle with seeded randomness
function generatePuzzle(level: number) {
  const seed = seedFromLevel(level);
  const rng = mkRng(seed);

  // Generate initial state
  const regions = Array.from({ length: 9 }, (_, i) => i);
  shuffle(regions, rng);

  // Solve to verify validity
  const result = backtrack({
    totalSteps: 9,
    candidates: (step) => getPossiblePlacements(step, regions, rng),
    isValid: (choice, step) => checkConstraints(choice),
    apply: (choice, step) => applyState(choice),
    undo: (choice, step) => undoState(choice),
    buildSolution: () => ({ puzzle: boardState }),
    maxStates: 50000,
  });

  return result.found ? result.solution : null;
}
```

### Example 2: Difficulty Calculation + Scoring

```typescript
import { levelToTierIdx, formatScore, waveDifficulty } from "@/shared/algorithms";

function calculateDifficulty(level: number) {
  const score = waveDifficulty({ level });
  const tierIdx = levelToTierIdx(level, 9);

  return {
    rawScore: score,
    displayScore: formatScore(score),
    tierIndex: tierIdx,
    tierName: ["Easy", "Normal", "Hard", ...][tierIdx]
  };
}
```

### Example 3: Grid Validation

```typescript
import { isConnected, getRegionCells, bfs } from "@/shared/algorithms";

function validatePuzzle(grid) {
  const regionIds = getRegionIds(grid);

  for (const regionId of regionIds) {
    const cells = getRegionCells(grid, regionId);

    // Check connectivity
    if (!isConnected(cells, grid, regionId)) {
      return { valid: false, error: `Region ${regionId} disconnected` };
    }

    // Check reachability
    const visited = bfs({
      grid,
      start: cells[0],
      canVisit: (r, c) => grid[r][c] === regionId,
    });

    if (visited.size !== cells.length) {
      return { valid: false, error: `Region ${regionId} unreachable` };
    }
  }

  return { valid: true };
}
```

---

## 🧪 Testing

All algorithms include comprehensive tests:

```bash
# Run all algorithm tests
npm run test -- shared/algorithms

# Test specific module
npm run test -- shared/algorithms/rng.test.ts
npm run test -- shared/algorithms/grid.test.ts
npm run test -- shared/algorithms/backtracking.test.ts
```

---

## 📚 Quick Reference

### Import Everything

```typescript
import {
  // RNG
  mkRng,
  nextInt,
  shuffle,
  seedFromLevel,
  seedFromDiff,
  weightedRandom,

  // Grid
  bfs,
  isConnected,
  floodFill,
  labelComponents,
  getRegionBorders,
  manhattanDist,
  chebyshevDist,
  makeGrid,
  cloneGrid,

  // Difficulty
  waveDifficulty,
  levelToDiffScore,
  normalizeScore,
  lerp,
  clamp,
  diffScoreToTierIdx,
  levelToTierIdx,
  sampleWave,

  // Backtracking
  backtrack,
  countSolutions,

  // Formatting
  formatTime,
  formatTimeLong,
  formatScore,
  formatLargeNumber,
  formatPercent,
} from "@/shared/algorithms";
```

---

## 🎯 Design Principles

1. **Game-Agnostic** - Algorithms work for ANY puzzle game
2. **Composable** - Mix & match algorithms as needed
3. **Performant** - Optimized for puzzle generation (tight loops)
4. **Testable** - Comprehensive unit tests included
5. **Documented** - Clear examples and use cases
6. **Reproducible** - Seeded randomness, deterministic output

---

## 🚀 Performance Tips

- Use **seeded RNG** for reproducible puzzle generation
- Use **maxStates** in backtracking to prevent long hangs
- **Clone grids** when mutations might affect originals
- Use **BFS** for shortest-path (not DFS)
- **Pre-compute** region cells if checking many times
- Use **labelComponents** for fast region assignment

---

_Last updated: 2026-05-25_
_For questions or suggestions, refer to individual test files._
