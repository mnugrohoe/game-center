# 📦 Shared Algorithms

Game-agnostic algorithms used across all puzzle games in Game Center.

## 📚 Documentation

- **[ALGORITHMS.md](../ALGORITHMS.md)** - Complete detailed documentation (20K+)
- **[ALGORITHMS_QUICK_GUIDE.md](./ALGORITHMS_QUICK_GUIDE.md)** - Quick reference for common patterns

## 🎯 Modules

| Module            | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `rng.ts`          | Deterministic pseudo-random generation (Mulberry32)      |
| `grid.ts`         | 2D grid algorithms (BFS, flood fill, regions, distances) |
| `difficulty.ts`   | Wave-based difficulty scoring system                     |
| `backtracking.ts` | Generic constraint-satisfaction solver                   |
| `formatting.ts`   | Display formatting utilities                             |

## 🚀 Quick Start

```typescript
// Import from shared algorithms
import {
  mkRng,
  bfs,
  levelToDiffScore,
  backtrack,
  formatTime,
} from "@/shared/algorithms";

// Use in your code
const rng = mkRng(seedFromLevel(5));
const score = levelToDiffScore(42);
const result = backtrack({
  /* ... */
});
```

## 🧪 Testing

```bash
npm run test -- shared/algorithms
```

All modules have comprehensive test coverage:

- `rng.test.ts`
- `grid.test.ts`
- `difficulty.test.ts`
- `backtracking.test.ts`
- `formatting.test.ts`

## 📖 Key Features

✅ **Game-Agnostic** - Works with any puzzle game (Kings, Sudoku, etc.)  
✅ **Deterministic** - Seeded randomness for reproducible puzzles  
✅ **Performant** - Optimized for puzzle generation  
✅ **Composable** - Mix & match algorithms as needed  
✅ **Well-Tested** - Comprehensive unit tests included

## 🎮 Used By

All games in the Game Center use these algorithms:

- **Kings** - Grid generation, solving, difficulty
- **Mambo** - Puzzle generation, validation
- **Set** - Card generation, solving
- **Shikaku** - Region generation, solving
- **Tower** - Puzzle generation

---

See [ALGORITHMS.md](../ALGORITHMS.md) for complete API documentation.
