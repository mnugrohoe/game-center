# Quick Algorithms Reference

## 🎲 RNG - Random Number Generation

```typescript
import { mkRng, nextInt, shuffle, seedFromLevel } from "@/shared/algorithms";

// Create seeded RNG
const rng = mkRng(seedFromLevel(5)); // Same level = same seed

// Use RNG
const rand = rng(); // [0, 1)
const num = nextInt(rng, 10); // [0, 10)
shuffle(array, rng); // Shuffle in-place
```

---

## 🗺️ Grid - 2D Grid Algorithms

```typescript
import {
  bfs,
  isConnected,
  floodFill,
  getRegionBorders,
} from "@/shared/algorithms";

// Find reachable cells
const visited = bfs({
  grid,
  start: [r, c],
  canVisit: (r, c) => grid[r][c] !== OBSTACLE,
});

// Check if region is connected
if (isConnected(cellList, grid, regionId)) {
  /* valid */
}

// Flood fill
floodFill({ grid, start: [r, c], targetValue: -1, fillValue: 5 });

// Get region borders (for drawing)
const { top, bottom, left, right } = getRegionBorders(grid, r, c);
```

**Distance Functions:**

```typescript
import { manhattanDist, chebyshevDist } from "@/shared/algorithms";

manhattanDist([0, 0], [3, 4]); // 7 (grid distance)
chebyshevDist([0, 0], [3, 4]); // 4 (king distance)
```

---

## 📊 Difficulty - Wave-Based Scoring

```typescript
import { levelToDiffScore, levelToTierIdx } from "@/shared/algorithms";

// Get difficulty score for level
const score = levelToDiffScore(42); // 1-9 scale

// Get tier index
const tierIdx = levelToTierIdx(42, 9); // 0-8 index
```

---

## 🔄 Backtracking - Generic Solver

```typescript
import { backtrack } from "@/shared/algorithms";

const result = backtrack({
  totalSteps: 10,
  candidates: (step) => [...],           // Available choices
  isValid: (choice, step) => boolean,    // Check constraints
  apply: (choice, step) => {},           // Apply choice
  undo: (choice, step) => {},            // Reverse choice
  buildSolution: () => solution,         // Extract solution
  maxStates: 100000                      // Abort limit
});

if (result.found) {
  console.log(result.solution);
  console.log("Explored:", result.statesExplored);
}
```

---

## 📝 Formatting - Display Utilities

```typescript
import {
  formatTime,
  formatScore,
  formatLargeNumber,
  formatPercent,
} from "@/shared/algorithms";

formatTime(90); // "1:30"
formatScore(7.38); // "7.4"
formatLargeNumber(5500); // "5.5K"
formatPercent(0.756); // "75.6%"
```

---

## 🔗 Common Patterns

### Pattern 1: Generate reproducible puzzle

```typescript
const seed = seedFromLevel(level);
const rng = mkRng(seed);
// Same level always generates same puzzle
```

### Pattern 2: Validate puzzle is connected

```typescript
const regions = getRegionIds(grid);
for (const regionId of regions) {
  const cells = getRegionCells(grid, regionId);
  if (!isConnected(cells, grid, regionId)) {
    throw new Error(`Region ${regionId} disconnected`);
  }
}
```

### Pattern 3: Find shortest path

```typescript
const visited = bfs({
  grid,
  start: [startR, startC],
  canVisit: (r, c) => grid[r][c] !== WALL,
  onVisit: (r, c, dist) => {
    if (r === goalR && c === goalC) return true; // Stop early
  },
});
const distance = visited.get(goalR * cols + goalC);
```

### Pattern 4: Solve with backtracking

```typescript
const result = backtrack({
  totalSteps: puzzleSize,
  candidates: getPossibleChoices,
  isValid: checkConstraints,
  apply: placeChoice,
  undo: removeChoice,
  buildSolution: () => board,
  maxStates: 50000, // Prevent timeout
});
```

---

**For full documentation, see: `shared/ALGORITHMS.md`**
