# 🎮 Panduan Navigasi Dokumentasi Algoritma

Dokumentasi lengkap algoritma Game Center telah dikumpulkan dan diorganisir.

## 🗺️ Peta Dokumentasi

```
┌──────────────────────────────────────────────────────────────────────┐
│                   ALGORITHMS DOCUMENTATION MAP                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  START HERE → ALGORITHMS_INDEX.md (This is your main hub!)          │
│       ↓                                                              │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Need what?              │ Go to which file?             │        │
│  ├─────────────────────────┼───────────────────────────────┤        │
│  │ Quick example           │ ALGORITHMS_QUICK_GUIDE.md     │        │
│  │ Full API docs           │ shared/ALGORITHMS.md          │        │
│  │ Architecture overview   │ ALGORITHMS_ECOSYSTEM.md       │        │
│  │ Module folder info      │ shared/algorithms/README.md   │        │
│  └─────────────────────────┴───────────────────────────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Organization

### 📍 Location: Root Project Directory

```
game-center/
├── 🔵 ALGORITHMS_INDEX.md ⭐ START HERE
│   └─ Navigation hub, finding what you need
│
├── 🟢 ALGORITHMS_ECOSYSTEM.md
│   └─ System architecture, design principles, flow diagrams
│
└── shared/
    ├── 🟡 ALGORITHMS.md (20 KB)
    │   └─ Complete API reference with 100+ examples
    │
    └── algorithms/
        ├── 🟣 README.md
        │   └─ Module overview, quick start, testing
        │
        └── 🟠 ALGORITHMS_QUICK_GUIDE.md
            └─ Quick copy-paste patterns
```

---

## 🎯 Recommended Reading Paths

### Path 1: I'm New to Game Center (15 minutes)

```
1. ALGORITHMS_INDEX.md
   ↓
2. shared/algorithms/README.md
   ↓
3. ALGORITHMS_QUICK_GUIDE.md
```

### Path 2: I Need to Build Something Fast (10 minutes)

```
1. ALGORITHMS_QUICK_GUIDE.md (find your pattern)
   ↓
2. ALGORITHMS.md (read that function's docs)
   ↓
3. Run the test file to verify
```

### Path 3: I Want to Understand the Architecture (20 minutes)

```
1. ALGORITHMS_ECOSYSTEM.md (read full file)
   ↓
2. ALGORITHMS.md (review each module section)
   ↓
3. Look at game code (games/{kings,mambo,set}/...)
```

### Path 4: I'm a Deep Learner (1+ hours)

```
1. Start with ALGORITHMS_INDEX.md
   ↓
2. Read ALGORITHMS_ECOSYSTEM.md fully
   ↓
3. Study ALGORITHMS.md thoroughly
   ↓
4. Review all test files (*.test.ts)
   ↓
5. Explore game implementations
```

---

## 🔍 Finding Information

### By Algorithm Name

→ Use browser search (Ctrl+F) in **ALGORITHMS.md**

Example: `mkRng` → Found in RNG Module section

### By Use Case

→ Check **ALGORITHMS_INDEX.md** section "By Use Case"

Example: "I want to validate a puzzle" → See connected pattern

### By Module

→ Go to **ALGORITHMS_ECOSYSTEM.md** section "Module Dependencies"

Example: Grid algorithms → All documented in Grid Module

### By Example

→ See **ALGORITHMS_QUICK_GUIDE.md** for common patterns

Example: "How do I shuffle?" → See RNG section

---

## 📊 Documentation Statistics

| Metric                   | Value                                               |
| ------------------------ | --------------------------------------------------- |
| **Total Size**           | ~56 KB                                              |
| **Total Lines**          | 1,268 lines                                         |
| **Modules**              | 5 (RNG, Grid, Difficulty, Backtracking, Formatting) |
| **Functions Documented** | 50+                                                 |
| **Code Examples**        | 100+                                                |
| **Common Patterns**      | 15+                                                 |
| **Diagrams**             | 10+                                                 |

---

## 🚀 Quick Links

### 📚 Complete Reference

[shared/ALGORITHMS.md](./shared/ALGORITHMS.md) - 20 KB, comprehensive

### 🏗️ Architecture Guide

[ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md) - 10 KB, system design

### 📌 Navigation Index

[ALGORITHMS_INDEX.md](./ALGORITHMS_INDEX.md) - 11.5 KB, finding what you need

### ⚡ Quick Patterns

[shared/algorithms/ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md) - 3.6 KB, copy-paste

### 📂 Folder Overview

[shared/algorithms/README.md](./shared/algorithms/README.md) - 2 KB, folder info

---

## 🎓 Key Sections by File

### ALGORITHMS.md

```
1. RNG Module
   - mkRng()
   - nextInt()
   - shuffle()
   - seedFromLevel()
   - seedFromDiff()
   - weightedRandom()

2. Grid Module
   - bfs()
   - isConnected()
   - floodFill()
   - labelComponents()
   - Distance metrics
   - Grid utilities

3. Difficulty Module
   - waveDifficulty()
   - levelToDiffScore()
   - Normalization functions
   - Tier mapping

4. Backtracking Module
   - backtrack()
   - countSolutions()

5. Formatting Module
   - formatTime()
   - formatScore()
   - formatLargeNumber()
   - formatPercent()
```

### ALGORITHMS_ECOSYSTEM.md

```
1. Architecture diagram
2. Algorithm flow examples (3)
3. Complexity analysis
4. Game-specific customization
5. Performance tips
6. Module dependencies
7. Design principles
```

### ALGORITHMS_INDEX.md

```
1. Documentation files overview
2. Quick navigation table
3. Use-case lookup
4. Role-based recommendations
5. Module comparison
6. Import reference
7. Testing instructions
```

### ALGORITHMS_QUICK_GUIDE.md

```
1. RNG usage
2. Grid usage
3. Difficulty usage
4. Backtracking usage
5. Formatting usage
6. Common patterns (4)
```

---

## 💡 Usage Examples

### Example 1: Create Random Puzzle

```
Read: ALGORITHMS_QUICK_GUIDE.md (RNG section)
Then: ALGORITHMS.md (seedFromLevel, mkRng, shuffle)
Code: See pattern in ALGORITHMS_ECOSYSTEM.md
```

### Example 2: Solve a Puzzle

```
Read: ALGORITHMS_INDEX.md (By Use Case: "I want to solve...")
Then: ALGORITHMS.md (Backtracking Module)
Code: See pattern in ALGORITHMS_QUICK_GUIDE.md (Pattern 4)
```

### Example 3: Calculate Difficulty

```
Read: ALGORITHMS_QUICK_GUIDE.md (Difficulty section)
Then: ALGORITHMS.md (Difficulty Module)
Code: See flow in ALGORITHMS_ECOSYSTEM.md
```

### Example 4: Validate Puzzle

```
Read: ALGORITHMS_INDEX.md (By Use Case: "I want to validate...")
Then: ALGORITHMS.md (Grid Module sections)
Code: See pattern in ALGORITHMS_QUICK_GUIDE.md (Pattern 2)
```

---

## 🧪 Testing

All algorithms have tests:

```bash
npm run test -- shared/algorithms
```

Individual tests:

- `rng.test.ts` → RNG functions
- `grid.test.ts` → Grid functions
- `difficulty.test.ts` → Difficulty functions
- `backtracking.test.ts` → Backtracking functions
- `formatting.test.ts` → Formatting functions

---

## 📞 Common Questions

**Q: Where do I start?**
A: Read ALGORITHMS_INDEX.md first, then pick your learning path.

**Q: How do I find a specific function?**
A: Use Ctrl+F in ALGORITHMS.md or check ALGORITHMS_INDEX.md table.

**Q: Can I copy-paste examples?**
A: Yes! Check ALGORITHMS_QUICK_GUIDE.md for ready-to-use patterns.

**Q: How do I learn the architecture?**
A: Read ALGORITHMS_ECOSYSTEM.md for complete system design.

**Q: What if I need more examples?**
A: Check test files in shared/algorithms/\*.test.ts

**Q: Can these algorithms work with my game?**
A: Yes! They're game-agnostic. See ALGORITHMS_ECOSYSTEM.md for details.

---

## 🎯 Quick Reference

### Import All Algorithms

```typescript
import {
  // RNG
  mkRng,
  nextInt,
  shuffle,
  seedFromLevel,
  // Grid
  bfs,
  isConnected,
  floodFill,
  makeGrid,
  // Difficulty
  levelToDiffScore,
  levelToTierIdx,
  // Backtracking
  backtrack,
  // Formatting
  formatTime,
  formatScore,
} from "@/shared/algorithms";
```

### Common Patterns

- **Random with seed:** `mkRng(seedFromLevel(level))`
- **Shuffle array:** `shuffle(array, rng)`
- **Find connected:** `isConnected(cells, grid, regionId)`
- **Solve puzzle:** `backtrack({ totalSteps, candidates, ... })`
- **Format display:** `formatTime(seconds)`

---

## 📈 Next Steps

1. ✅ **Read** → Pick your learning path above
2. ✅ **Explore** → Look at source code (shared/algorithms/\*.ts)
3. ✅ **Understand** → Study test files
4. ✅ **Practice** → Use in your game code
5. ✅ **Master** → Build complete game with algorithms

---

## 🔗 All Documentation Files

1. **ALGORITHMS.md** → Complete API reference
2. **ALGORITHMS_ECOSYSTEM.md** → System architecture
3. **ALGORITHMS_INDEX.md** → Navigation hub ⭐
4. **ALGORITHMS_QUICK_GUIDE.md** → Quick patterns
5. **README.md** (in algorithms/) → Folder overview

---

**Start with:** [ALGORITHMS_INDEX.md](./ALGORITHMS_INDEX.md) ⭐

**Last Updated:** 2026-05-25

---

## 🎮 For Game Developers

Each game uses these shared algorithms:

- **Kings** → Grid, Difficulty, Backtracking
- **Mambo** → Grid, Difficulty, RNG, Backtracking
- **Set** → RNG, Backtracking, Formatting
- **Shikaku** → Grid, RNG, Backtracking
- **Tower** → Grid, RNG, Difficulty

See how they're used in game code for real-world examples!
