# 🧩 Puzzle Game Collection

A collection of simple but popular online puzzle games built with Next.js.

This project focuses on three main components for every game:

- 🎮 Game implementation
- 🧠 Solver algorithm
- ⚙️ Puzzle generator

The purpose of this project is to explore game logic, algorithms, procedural generation, and optimization techniques through classic puzzle games.

---

# ✨ Features

- Multiple puzzle games in one platform
- Playable web-based games
- Automatic puzzle solvers
- Random level generators
- Shared reusable algorithms
- Responsive UI
- Built with Next.js + TypeScript

---

# 🎮 Games

## Water Sort Puzzle

Sort colored liquids into separate bottles until every bottle contains only one color.

### Includes

- Interactive gameplay
- BFS / DFS / A\* solver
- Random solvable level generator
- Difficulty scaling

---

## Connect Pipe

Connect all pipes correctly so water can flow from source to destination.

### Includes

- Rotatable pipe system
- Graph/pathfinding solver
- Procedural map generator
- Connectivity validation

---

## Planned Games

- Sudoku
- Flow Free
- Sliding Puzzle
- Nonogram
- Sokoban
- Maze Generator
- Unblock Me
- Shikaku (create area within number)
- Mambo
- Pipe

---

# 🏗️ Project Structure

```bash
src/
│
├── games/
│   ├── water-sort/
│   │   ├── components/
│   │   ├── game/
│   │   ├── solver/
│   │   ├── generator/
│   │   └── types/
│   │
│   ├── connect-pipe/
│   │   ├── components/
│   │   ├── game/
│   │   ├── solver/
│   │   ├── generator/
│   │   └── types/
│
├── shared/
│   ├── algorithms/
│   ├── utils/
│   ├── hooks/
│   └── components/
│
├── app/
│
└── README.md
```

---

# 🧠 Architecture

Every game contains 3 core modules:

## 1. Game

Responsible for:

- Game rules
- State management
- Rendering
- User interaction

---

## 2. Solver

Responsible for solving puzzles automatically using algorithms such as:

- BFS
- DFS
- A\*
- Backtracking
- Graph traversal
- Constraint solving

---

## 3. Generator

Responsible for creating valid and solvable puzzles.

Features:

- Random generation
- Difficulty balancing
- Solvability validation
- Puzzle randomization

---

# 🚀 Getting Started

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

# 📚 Shared Algorithms Documentation

All puzzle games in this project use **game-agnostic algorithms** documented in shared modules.

## 🎯 Quick Start

**[→ START HERE: Algorithms Documentation](./START_HERE_ALGORITHMS.md)** ⭐

### Documentation Files

| File                                                                                         | Purpose                     | Size  |
| -------------------------------------------------------------------------------------------- | --------------------------- | ----- |
| [START_HERE_ALGORITHMS.md](./START_HERE_ALGORITHMS.md)                                       | Entry point & reading paths | 9 KB  |
| [ALGORITHMS_INDEX.md](./ALGORITHMS_INDEX.md)                                                 | Navigation hub & lookup     | 11 KB |
| [ALGORITHMS_ECOSYSTEM.md](./ALGORITHMS_ECOSYSTEM.md)                                         | Architecture & design       | 10 KB |
| [shared/ALGORITHMS.md](./shared/ALGORITHMS.md)                                               | Complete API reference      | 20 KB |
| [shared/algorithms/ALGORITHMS_QUICK_GUIDE.md](./shared/algorithms/ALGORITHMS_QUICK_GUIDE.md) | Quick patterns & examples   | 4 KB  |

### 5 Core Modules

1. **RNG** - Deterministic pseudo-random generation (Mulberry32)
2. **Grid** - 2D grid algorithms (BFS, flood fill, regions)
3. **Difficulty** - Wave-based difficulty scoring
4. **Backtracking** - Generic constraint solver
5. **Formatting** - Display text utilities

### 50+ Functions Documented

- 100+ code examples
- 15+ common patterns
- 10+ visual diagrams
- Complete test coverage

### Used By All Games

- **Kings** → Grid, Difficulty, Backtracking
- **Mambo** → Grid, Difficulty, RNG, Backtracking
- **Set** → RNG, Backtracking, Formatting
- **Shikaku** → Grid, RNG, Backtracking
- **Tower** → Grid, RNG, Difficulty

---

# 🛠️ Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Canvas / SVG
- Zustand or Redux
- Web Workers

---

# 🎯 Goals

- Learn puzzle-solving algorithms
- Explore procedural generation
- Build reusable game frameworks
- Optimize solving performance
- Create interactive browser games

---

# 📌 Future Improvements

- Multiplayer mode
- AI-generated puzzles
- Daily challenges
- Replay system
- Leaderboards
- Mobile support
- Benchmark visualization

---

# 📄 License

MIT License

---
