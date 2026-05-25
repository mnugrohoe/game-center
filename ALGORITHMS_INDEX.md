# 📚 Algorithms Documentation Index

Dokumentasi lengkap semua algoritma yang digunakan di Game Center.

## 📖 Documentation Files

### 1. **[ALGORITHMS.md](./shared/ALGORITHMS.md)** - Complete Reference

- **Size:** 20 KB
- **Time to read:** 30-45 minutes
- **Contents:**
  - Detailed API documentation untuk semua 5 modules
  - Contoh penggunaan lengkap
  - Performance tips & best practices
  - Integration examples
  - Testing guide

**Best for:** Understanding complete algorithm ecosystem, detailed API reference

---

### 2. **[ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md)** - Architecture Overview

- **Size:** 10 KB
- **Time to read:** 10-15 minutes
- **Contents:**
  - Visual architecture diagrams
  - Algorithm flow examples
  - Complexity analysis
  - Design principles
  - Performance tips

**Best for:** Understanding how algorithms work together, system design

---

### 3. **[shared/algorithms/ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md)** - Quick Reference

- **Size:** 4 KB
- **Time to read:** 3-5 minutes
- **Contents:**
  - Quick usage examples
  - Common patterns
  - Copy-paste ready code snippets

**Best for:** Quick lookup, common patterns, rapid development

---

### 4. **[shared/algorithms/README.md](./shared/algorithms/README.md)** - Folder Overview

- **Size:** 2 KB
- **Time to read:** 2 minutes
- **Contents:**
  - Module list & purposes
  - Testing instructions
  - Quick start example

**Best for:** First-time orientation, testing guide

---

## 🎯 Quick Navigation

### By Algorithm

| Algorithm                      | Module            | Location                                                                                    | Use For                   |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------- | ------------------------- |
| **Mulberry32 RNG**             | `rng.ts`          | [Details](./shared/ALGORITHMS.md#-rng-module-rngts)                                         | Seeded randomness         |
| **Fisher-Yates Shuffle**       | `rng.ts`          | [Details](./shared/ALGORITHMS.md#shufflet-arrt-rng-rngfn-t)                                 | Randomize arrays          |
| **BFS (Breadth-First Search)** | `grid.ts`         | [Details](./shared/ALGORITHMS.md#bfsopts-bfsoptions-mapnumber-number)                       | Pathfinding, connectivity |
| **Flood Fill**                 | `grid.ts`         | [Details](./shared/ALGORITHMS.md#floodfillopts-floodfilloptions-coord)                      | Region filling            |
| **Component Labeling**         | `grid.ts`         | [Details](./shared/ALGORITHMS.md#labelcomponentsgrid-grid2d-unassignedvalue-startid-number) | Region assignment         |
| **Wave Difficulty**            | `difficulty.ts`   | [Details](./shared/ALGORITHMS.md#wavedifficultyopts-wavedifficultyoptions-number)           | Level scoring             |
| **Generic Backtracking**       | `backtracking.ts` | [Details](./shared/ALGORITHMS.md#-backtracking-module-backtrackingts)                       | Puzzle solving            |
| **Text Formatting**            | `formatting.ts`   | [Details](./shared/ALGORITHMS.md#-formatting-module-formattingts)                           | Display strings           |

---

### By Use Case

**Puzzle Generation**

- Seeded RNG → `seedFromLevel()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#seedfromlevel)
- Shuffle → `shuffle()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#shufflet-arrt-rng-rngfn-t)
- Backtracking → `backtrack()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#-backtracking-module-backtrackingts)

**Puzzle Validation**

- Region connectivity → `isConnected()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#isconnectedcells-coord-grid-grid2d-regionid-number-boolean)
- Reachability → `bfs()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#bfsopts-bfsoptions-mapnumber-number)
- Component count → `labelComponents()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#labelcomponentsgrid-grid2d-unassignedvalue-startid-number)

**Difficulty Calculation**

- Score calculation → `levelToDiffScore()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#leveltodifficultyscores-leveltodifficultyscores)
- Tier assignment → `levelToTierIdx()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#leveltotieridxlevel-number-numtiers-number-number)
- Wave visualization → `sampleWave()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#samplewaveccenterlevel-number-halfwindow-number-opts-omitwavedifficultyoptions-level)

**UI Display**

- Timers → `formatTime()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#formattimeseconds-number-string)
- Scores → `formatScore()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#formatscorescore-number-decimals-string)
- Large numbers → `formatLargeNumber()` → [ALGORITHMS.md](./shared/ALGORITHMS.md#formatlargernumbern-number-string)

---

## 🔍 Finding What You Need

**I want to...**

→ **Create a new game**

1. Read [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md) (understand architecture)
2. Review [ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md) (common patterns)
3. Reference [ALGORITHMS.md](./shared/ALGORITHMS.md) (detailed API)

→ **Add seeded randomness**

1. Go to [RNG Module](./shared/ALGORITHMS.md#-rng-module-rngts)
2. Copy example from [Quick Guide](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md#-rng---random-number-generation)
3. See `seedFromLevel()` in [ALGORITHMS.md](./shared/ALGORITHMS.md#seedfromlevel)

→ **Validate a puzzle**

1. Check validation example in [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md#example-3-puzzle-validation-pipeline)
2. Read `isConnected()` and `bfs()` docs in [ALGORITHMS.md](./shared/ALGORITHMS.md)
3. Use pattern from [Quick Guide](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md#pattern-2-validate-puzzle-is-connected)

→ **Solve a puzzle**

1. Read [Backtracking section](./shared/ALGORITHMS.md#-backtracking-module-backtrackingts)
2. See implementation example in [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md#example-1-puzzle-generation-pipeline)
3. Copy pattern from [Quick Guide](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md#pattern-4-solve-with-backtracking)

→ **Calculate difficulty**

1. Read [Difficulty Module](./shared/ALGORITHMS.md#-difficulty-module-difficultyts)
2. See example in [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md#example-2-difficulty-calculation-pipeline)
3. Check [Quick Guide](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md#-difficulty---wave-based-scoring)

→ **Format display text**

1. Go to [Formatting Module](./shared/ALGORITHMS.md#-formatting-module-formattingts)
2. Pick your function: `formatTime`, `formatScore`, `formatLargeNumber`, `formatPercent`
3. Copy from [Quick Guide](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md#-formatting---display-utilities)

---

## 📊 Module Comparison Table

| Aspect            | RNG  | Grid         | Difficulty | Backtrack | Formatting |
| ----------------- | ---- | ------------ | ---------- | --------- | ---------- |
| **Functions**     | 6    | 18+          | 9          | 2         | 5          |
| **Complexity**    | O(1) | O(n) - O(n²) | O(1)       | O(b^d)    | O(1)       |
| **Game-Agnostic** | ✅   | ✅           | ✅         | ✅        | ✅         |
| **Documented**    | ✅   | ✅           | ✅         | ✅        | ✅         |
| **Tested**        | ✅   | ✅           | ✅         | ✅        | ✅         |

---

## 🧪 Testing

All algorithms have comprehensive test coverage:

```bash
# Run all tests
npm run test -- shared/algorithms

# Or specific module
npm run test -- shared/algorithms/rng.test.ts
npm run test -- shared/algorithms/grid.test.ts
npm run test -- shared/algorithms/difficulty.test.ts
npm run test -- shared/algorithms/backtracking.test.ts
npm run test -- shared/algorithms/formatting.test.ts
```

---

## 📦 Imports

Import from shared algorithms:

```typescript
import {
  // RNG functions
  mkRng,
  nextInt,
  shuffle,
  seedFromLevel,
  seedFromDiff,
  weightedRandom,
  sumWeights,

  // Grid functions
  bfs,
  isConnected,
  floodFill,
  labelComponents,
  getRegionCells,
  getRegionIds,
  getRegionBorders,
  manhattanDist,
  chebyshevDist,
  areAdjacent8,
  areAdjacent4,
  makeGrid,
  cloneGrid,
  neighbors4,

  // Difficulty functions
  waveDifficulty,
  levelToDiffScore,
  normalizeScore,
  lerp,
  clamp,
  diffScoreToTierIdx,
  levelToTierIdx,
  sampleWave,

  // Backtracking functions
  backtrack,
  countSolutions,

  // Formatting functions
  formatTime,
  formatTimeLong,
  formatScore,
  formatLargeNumber,
  formatPercent,
} from "@/shared/algorithms";
```

---

## 🎯 Reading Recommendations

**For Different Roles:**

👨‍💼 **Project Manager/Designer**

- [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md) - Understand capabilities
- [ALGORITHMS.md](./shared/ALGORITHMS.md) - Performance & complexity

👨‍💻 **Game Developer (New)**

- [shared/algorithms/README.md](./shared/algorithms/README.md) - Overview
- [ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md) - Common patterns
- [ALGORITHMS.md](./shared/ALGORITHMS.md) - Detailed reference

🧪 **QA/Tester**

- [ALGORITHMS.md](./shared/ALGORITHMS.md#-testing) - Testing guide
- [shared/algorithms/README.md](./shared/algorithms/README.md#-testing) - Test commands

📚 **Documenter/Maintainer**

- [ALGORITHMS.md](./shared/ALGORITHMS.md) - Complete reference
- Individual test files - Implementation details

---

## 🚀 Getting Started

1. **First time?** Start with [ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md)
2. **Need specific info?** Use index above or search [ALGORITHMS.md](./shared/ALGORITHMS.md)
3. **Building something?** Follow patterns in [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md)
4. **Stuck?** Check test files in `shared/algorithms/*.test.ts`

---

## 📈 Documentation Statistics

| Metric                   | Value         |
| ------------------------ | ------------- |
| **Total Documentation**  | ~36 KB        |
| **Modules Documented**   | 5             |
| **Functions Documented** | 50+           |
| **Code Examples**        | 100+          |
| **Usage Patterns**       | 15+           |
| **Test Files**           | 5             |
| **Test Coverage**        | Comprehensive |

---

## 🔗 Related Resources

- **Source Code:** `shared/algorithms/*.ts`
- **Tests:** `shared/algorithms/*.test.ts`
- **Types:** `shared/types/index.ts`
- **Games Using:** `games/{kings,mambo,set,shikaku,tower}`

---

**Last Updated:** 2026-05-25  
**Version:** 1.0  
**Status:** ✅ Complete & Ready to Use

---

## 💡 Pro Tips

1. 📌 **Bookmark this file** - It's your index to everything
2. 🔍 **Use browser search** - Ctrl+F in ALGORITHMS.md to find functions
3. 📋 **Copy patterns** - Most use cases have examples in Quick Guide
4. 🧪 **Look at tests** - Best way to understand each function
5. 🎮 **Study game code** - See real implementations in game folders

---

**Navigation:**

- [ALGORITHMS.md](./shared/ALGORITHMS.md) - Complete API Reference
- [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md) - Architecture & Design
- [ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md) - Quick Patterns
- [shared/algorithms/README.md](./shared/algorithms/README.md) - Module Overview
