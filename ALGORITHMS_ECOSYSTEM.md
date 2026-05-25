# 🎮 Game Center - Algorithms Ecosystem

## 📊 Algorithms Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SHARED ALGORITHMS LAYER                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   RNG Module     │  │  Grid Module    │  │ Difficulty Module│
├──────────────────┤  ├─────────────────┤  ├──────────────────┤
│ • mkRng()        │  │ • bfs()         │  │ • waveDifficulty │
│ • nextInt()      │  │ • isConnected() │  │ • levelToDiffScore
│ • shuffle()      │  │ • floodFill()   │  │ • normalizeScore │
│ • seedFromLevel()│  │ • labelCompnts()│  │ • clamp()        │
│ • weightedRandom│  │ • getRegionIds()│  │ • lerp()         │
│ • sumWeights()   │  │ • manhattanDist │  │ • sampleWave()   │
│                  │  │ • chebyshevDist │  │                  │
└──────────────────┘  │ • makeGrid()    │  └──────────────────┘
                      │ • cloneGrid()   │
                      └─────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────┐
│  Backtracking Module         │  │  Formatting Module       │
├──────────────────────────────┤  ├──────────────────────────┤
│ • backtrack()                │  │ • formatTime()           │
│ • countSolutions()           │  │ • formatTimeLong()       │
│   (Generic constraint solver)│  │ • formatScore()          │
│                              │  │ • formatLargeNumber()    │
└──────────────────────────────┘  │ • formatPercent()        │
                                   └──────────────────────────┘

                        ↓ Used by all games ↓

┌─────────┐ ┌────────┐ ┌─────┐ ┌──────────┐ ┌─────────┐
│  Kings  │ │ Mambo  │ │ Set │ │ Shikaku  │ │ Tower   │
└─────────┘ └────────┘ └─────┘ └──────────┘ └─────────┘
```

---

## 🎯 Algorithm Flow Examples

### Example 1: Puzzle Generation Pipeline

```
Level Input
    ↓
seedFromLevel() → Deterministic Seed
    ↓
mkRng(seed) → Seeded Random Generator
    ↓
shuffle() → Randomize initial state
    ↓
backtrack() → Solve & validate puzzle
    ↓
getRegionBorders() → Prepare for rendering
    ↓
Puzzle Output ✓
```

### Example 2: Difficulty Calculation Pipeline

```
Level Input
    ↓
levelToDiffScore() → Calculate wave-based score (1-9)
    ↓
diffScoreToTierIdx() → Map to tier index (0-8)
    ↓
formatScore() → Format for display ("7.4")
    ↓
Display Output ✓
```

### Example 3: Puzzle Validation Pipeline

```
Generated Grid
    ↓
getRegionIds() → Find all regions
    ↓
for each region:
  ├─ getRegionCells() → Get all cells in region
  ├─ isConnected() → Check connectivity
  └─ bfs() → Verify reachability
    ↓
All valid? → Puzzle is valid ✓
```

---

## 📈 Algorithm Complexity

| Algorithm           | Time   | Space  | Use Case                         |
| ------------------- | ------ | ------ | -------------------------------- |
| `mkRng()`           | O(1)   | O(1)   | Generate random number           |
| `shuffle()`         | O(n)   | O(1)   | Randomize array                  |
| `bfs()`             | O(r×c) | O(r×c) | Find reachable cells             |
| `isConnected()`     | O(r×c) | O(r×c) | Check region connectivity        |
| `floodFill()`       | O(r×c) | O(r×c) | Fill connected region            |
| `labelComponents()` | O(r×c) | O(r×c) | Assign region IDs                |
| `backtrack()`       | O(b^d) | O(d)   | Solve puzzle (b=branch, d=depth) |
| `formatTime()`      | O(1)   | O(1)   | Format display                   |

---

## 🔐 Game-Specific Customization

Each game implements its own:

- **candidates()** - What choices available at each step
- **isValid()** - Constraint checking
- **apply()** / **undo()** - State mutations

But uses the same **backtrack()** algorithm!

Example:

```typescript
// Kings game
backtrack({
  totalSteps: numRegions,
  candidates: () => possibleRegionPlacements,
  isValid: () => checkKingsConstraints,
  // ...
});

// Sudoku
backtrack({
  totalSteps: 81, // 9×9 grid
  candidates: () => availableNumbers,
  isValid: () => checkSudokuConstraints,
  // ...
});

// Same algorithm, different constraints!
```

---

## 🧩 Module Dependencies

```
┌─────────────────────┐
│ Shared Algorithms   │
└─────────────────────┘
          │
          ├── rng.ts (standalone)
          │
          ├── grid.ts
          │   └── types.ts (Coord, Grid2D)
          │
          ├── difficulty.ts
          │   └── rng.ts (for seeded noise)
          │
          ├── backtracking.ts
          │   └── types.ts (BacktrackResult)
          │
          └── formatting.ts (standalone)

All exported via index.ts
```

---

## 💡 Design Principles

### 1. **Decoupling**

- Algorithms don't know about specific games
- Games plug their logic into algorithms
- Zero cross-game dependencies

### 2. **Performance**

- Hot-path optimized (shuffle, BFS, backtrack)
- No unnecessary allocations
- Inline operations where possible

### 3. **Reproducibility**

- Seeded RNG ensures same level → same puzzle
- Deterministic wave function
- Great for testing & debugging

### 4. **Testability**

- Each function has independent unit tests
- No side effects (except mutating input grid)
- Clear input/output contracts

### 5. **Composability**

- Functions can be mixed & matched
- Natural building blocks
- Easy to extend for new games

---

## 🚀 Performance Tips

### Generate Fast

```typescript
// ✅ Good: Reuse RNG instance
const rng = mkRng(seed);
for (let i = 0; i < 1000; i++) {
  const val = rng(); // Fast
}

// ❌ Bad: Create new RNG each time
for (let i = 0; i < 1000; i++) {
  const val = mkRng(seed)(); // Slow
}
```

### Solve Fast

```typescript
// ✅ Good: Use maxStates to prevent timeout
backtrack({
  // ...
  maxStates: 50000, // Stop early if too slow
});

// ✅ Good: Prune candidates early
candidates: (step) => {
  return possibleChoices.filter(
    (c) => preliminaryCheck(c), // Fast pre-filter
  );
};
```

### Validate Fast

```typescript
// ✅ Good: Cache region cells
const regions = new Map();
getRegionIds(grid).forEach((rid) => {
  regions.set(rid, getRegionCells(grid, rid));
});

// ✅ Good: Stop on first failure
for (const [rid, cells] of regions) {
  if (!isConnected(cells, grid, rid)) {
    return false; // Fast fail
  }
}
```

---

## 📚 File Organization

```
shared/
├── algorithms/
│   ├── README.md                    # This folder overview
│   ├── ALGORITHMS_QUICK_GUIDE.md    # Quick reference
│   ├── rng.ts                       # RNG implementation
│   ├── rng.test.ts                  # RNG tests
│   ├── grid.ts                      # Grid algorithms
│   ├── grid.test.ts                 # Grid tests
│   ├── difficulty.ts                # Difficulty system
│   ├── difficulty.test.ts           # Difficulty tests
│   ├── backtracking.ts              # Backtracking solver
│   ├── backtracking.test.ts         # Backtracking tests
│   ├── formatting.ts                # Formatting utilities
│   ├── formatting.test.ts           # Formatting tests
│   └── index.ts                     # Export all
│
├── ALGORITHMS.md                    # Complete documentation
├── types/
│   └── index.ts                     # Shared type definitions
├── components/
├── utils/
└── ...
```

---

## 🎓 Learning Path

1. **Start:** Read `ALGORITHMS_QUICK_GUIDE.md` (5 min)
2. **Explore:** Check specific module in `ALGORITHMS.md` (10 min)
3. **Study:** Review corresponding test file (10 min)
4. **Practice:** Try using algorithm in small game (30 min)
5. **Master:** Build full game using combined algorithms (1-2 hours)

---

## 🔗 External Links

- **Source Code:** `shared/algorithms/*.ts`
- **Tests:** `shared/algorithms/*.test.ts`
- **Type Definitions:** `shared/types/index.ts`
- **Game Examples:** See individual game folders

---

## 📞 FAQ

**Q: Can I use these algorithms outside Game Center?**  
A: Yes! They're game-agnostic and have no dependencies.

**Q: How do I add a new algorithm?**  
A: Create new `.ts` file in `shared/algorithms/`, implement function, add tests, export from `index.ts`, document in `ALGORITHMS.md`.

**Q: What if backtracking is too slow?**  
A: Use `maxStates` parameter to abort early, or optimize `candidates()` to prune more aggressively.

**Q: Can I use Math.random instead of seeded RNG?**  
A: Yes, but you'll lose reproducibility. Great for final output, but use seeded RNG for generation.

---

_This ecosystem grows with each new game added to Game Center!_

Last Updated: 2026-05-25
