"use client";

/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";

const SUN = "☀";
const MOON = "◑";

// ─── Named difficulty tiers ───────────────────────────────────────────────────
// Same 9-level curve, but named for flavor
const DIFFICULTIES = [
  {
    id: 0,
    name: "Dusk",
    sub: "4×4 · intro",
    gridSize: 4,
    initRatio: 0.56,
    constraintRatio: 0.18,
  },
  {
    id: 1,
    name: "Ember",
    sub: "4×4 · warm up",
    gridSize: 4,
    initRatio: 0.44,
    constraintRatio: 0.15,
  },
  {
    id: 2,
    name: "Fog",
    sub: "6×6 · mild",
    gridSize: 6,
    initRatio: 0.48,
    constraintRatio: 0.17,
  },
  {
    id: 3,
    name: "Tide",
    sub: "6×6 · steady",
    gridSize: 6,
    initRatio: 0.38,
    constraintRatio: 0.15,
  },
  {
    id: 4,
    name: "Storm",
    sub: "6×6 · tricky",
    gridSize: 6,
    initRatio: 0.27,
    constraintRatio: 0.13,
  },
  {
    id: 5,
    name: "Abyss",
    sub: "8×8 · hard",
    gridSize: 8,
    initRatio: 0.37,
    constraintRatio: 0.15,
  },
  {
    id: 6,
    name: "Void",
    sub: "8×8 · brutal",
    gridSize: 8,
    initRatio: 0.26,
    constraintRatio: 0.12,
  },
  {
    id: 7,
    name: "Eclipse",
    sub: "8×8 · extreme",
    gridSize: 8,
    initRatio: 0.19,
    constraintRatio: 0.1,
  },
  {
    id: 8,
    name: "Zenith",
    sub: "10×10 · master",
    gridSize: 10,
    initRatio: 0.19,
    constraintRatio: 0.09,
  },
];

// Accent color per tier (low → high)
const TIER_COLORS = [
  "#7dd3fc", // Dusk   – sky blue
  "#86efac", // Ember  – mint
  "#fde68a", // Fog    – pale yellow
  "#fbbf24", // Tide   – amber
  "#fb923c", // Storm  – orange
  "#f87171", // Abyss  – red
  "#e879f9", // Void   – fuchsia
  "#a78bfa", // Eclipse– violet
  "#fff", // Zenith – white
];

// ─── Level → diffId curve (non-linear, infinite) ─────────────────────────────
// The curve maps any level number to one of the 9 diff tiers.
// Pattern: early levels stay easy longer, then ramp up with occasional "breather"
// dips — so level 6 can feel easier than level 5 (different grid size = fresh start).
// Cycle pattern repeats every 20 levels, shifting up by 1 tier each full cycle.
const LEVEL_CURVE = [
  0, 0, 1, 2, 2, 1, 3, 3, 4, 2, 4, 5, 5, 3, 6, 6, 4, 7, 7, 8,
]; // 20-entry base cycle
function diffIdForLevel(level) {
  const l = level - 1; // 0-indexed
  const cycle = Math.floor(l / LEVEL_CURVE.length);
  const pos = l % LEVEL_CURVE.length;
  const base = LEVEL_CURVE[pos];
  // Each full cycle shifts base tier up by 1, capped at 8
  return Math.min(base + cycle, 8);
}

function isValidPlacement(grid, r, c, val, size) {
  const half = size / 2;
  if (grid[r].filter((v) => v === val).length >= half) return false;
  let cc = 0;
  for (let i = 0; i < size; i++) if (grid[i][c] === val) cc++;
  if (cc >= half) return false;
  const row = [...grid[r]];
  row[c] = val;
  for (let i = 0; i <= size - 3; i++)
    if (row[i] && row[i] === row[i + 1] && row[i + 1] === row[i + 2])
      return false;
  const col = grid.map((rw) => rw[c]);
  col[r] = val;
  for (let i = 0; i <= size - 3; i++)
    if (col[i] && col[i] === col[i + 1] && col[i + 1] === col[i + 2])
      return false;
  return true;
}

function solvePuzzle(grid, constraints, size) {
  const g = grid.map((r) => [...r]);
  function bt(pos) {
    if (pos === size * size) {
      for (const cn of constraints) {
        const a = g[cn.r1][cn.c1],
          b = g[cn.r2][cn.c2];
        if (cn.type === "=" && a !== b) return false;
        if (cn.type === "x" && a === b) return false;
      }
      return true;
    }
    const r = Math.floor(pos / size),
      c = pos % size;
    if (g[r][c] !== 0) return bt(pos + 1);
    for (const val of [1, 2]) {
      if (!isValidPlacement(g, r, c, val, size)) continue;
      g[r][c] = val;
      let ok = true;
      for (const cn of constraints) {
        if ((cn.r1 === r && cn.c1 === c) || (cn.r2 === r && cn.c2 === c)) {
          const a = g[cn.r1][cn.c1],
            b = g[cn.r2][cn.c2];
          if (a && b) {
            if (cn.type === "=" && a !== b) {
              ok = false;
              break;
            }
            if (cn.type === "x" && a === b) {
              ok = false;
              break;
            }
          }
        }
      }
      if (ok && bt(pos + 1)) return true;
      g[r][c] = 0;
    }
    return false;
  }
  return bt(0) ? g : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSolution(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  function bt(pos) {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size),
      c = pos % size;
    for (const val of shuffle([1, 2])) {
      if (isValidPlacement(grid, r, c, val, size)) {
        grid[r][c] = val;
        if (bt(pos + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }
  bt(0);
  return grid;
}

function generatePuzzle(diffId) {
  const d = DIFFICULTIES[diffId];
  const { gridSize: size, initRatio, constraintRatio } = d;
  const solution = generateSolution(size);

  const allEdges = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) allEdges.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      if (r + 1 < size) allEdges.push({ r1: r, c1: c, r2: r + 1, c2: c });
    }

  const maxCn = Math.min(
    Math.floor(allEdges.length * constraintRatio),
    Math.floor(allEdges.length * 0.2),
  );
  const constraints = shuffle(allEdges)
    .slice(0, maxCn)
    .map((e) => ({
      ...e,
      type: solution[e.r1][e.c1] === solution[e.r2][e.c2] ? "=" : "x",
    }));

  const allCells = shuffle(Array.from({ length: size * size }, (_, i) => i));
  const initSet = new Set(
    allCells.slice(0, Math.floor(size * size * initRatio)),
  );
  const puzzle = solution.map((row, r) =>
    row.map((val, c) => (initSet.has(r * size + c) ? val : 0)),
  );

  return { puzzle, solution, constraints, size, diffId };
}

// ─── Debounced error detection ────────────────────────────────────────────────
function useErrorCells(userGrid, gameData, active) {
  const [errorCells, setErrorCells] = useState(new Set());
  const [completedRows, setCompletedRows] = useState(new Set());
  const [completedCols, setCompletedCols] = useState(new Set());
  const timer = useRef(null);

  useEffect(() => {
    if (!active || !gameData || !userGrid) {
      setErrorCells(new Set());
      setCompletedRows(new Set());
      setCompletedCols(new Set());
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { size, constraints } = gameData;
      const half = size / 2;
      const errs = new Set(),
        doneR = new Set(),
        doneC = new Set();

      for (let r = 0; r < size; r++) {
        const row = userGrid[r];
        const suns = row.filter((v) => v === 1).length,
          moons = row.filter((v) => v === 2).length;
        if (row.every((v) => v !== 0) && suns === half && moons === half)
          doneR.add(r);
        if (suns > half)
          row.forEach((v, c) => {
            if (v === 1) errs.add(r * size + c);
          });
        if (moons > half)
          row.forEach((v, c) => {
            if (v === 2) errs.add(r * size + c);
          });
        for (let c = 0; c <= size - 3; c++)
          if (row[c] && row[c] === row[c + 1] && row[c + 1] === row[c + 2]) {
            errs.add(r * size + c);
            errs.add(r * size + c + 1);
            errs.add(r * size + c + 2);
          }
      }
      for (let c = 0; c < size; c++) {
        const col = userGrid.map((row) => row[c]);
        const suns = col.filter((v) => v === 1).length,
          moons = col.filter((v) => v === 2).length;
        if (col.every((v) => v !== 0) && suns === half && moons === half)
          doneC.add(c);
        if (suns > half)
          col.forEach((v, r) => {
            if (v === 1) errs.add(r * size + c);
          });
        if (moons > half)
          col.forEach((v, r) => {
            if (v === 2) errs.add(r * size + c);
          });
        for (let r = 0; r <= size - 3; r++)
          if (col[r] && col[r] === col[r + 1] && col[r + 1] === col[r + 2]) {
            errs.add(r * size + c);
            errs.add((r + 1) * size + c);
            errs.add((r + 2) * size + c);
          }
      }
      for (const cn of constraints) {
        const a = userGrid[cn.r1][cn.c1],
          b = userGrid[cn.r2][cn.c2];
        if (a && b) {
          if (cn.type === "=" && a !== b) {
            errs.add(cn.r1 * size + cn.c1);
            errs.add(cn.r2 * size + cn.c2);
          }
          if (cn.type === "x" && a === b) {
            errs.add(cn.r1 * size + cn.c1);
            errs.add(cn.r2 * size + cn.c2);
          }
        }
      }
      setErrorCells(errs);
      setCompletedRows(doneR);
      setCompletedCols(doneC);
    }, 1200);
    return () => clearTimeout(timer.current);
  }, [userGrid, gameData, active]);

  return { errorCells, completedRows, completedCols };
}

// ─── Win validation (independent — no solution compare) ──────────────────────
// A grid is won when:
//  1. All cells filled
//  2. Every row/col has exactly half SUN, half MOON
//  3. No 3 identical adjacent in any row/col
//  4. All constraints satisfied
function checkWin(grid, gameData) {
  const { size, constraints } = gameData;
  const half = size / 2;
  // 1. All filled
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (!grid[r][c]) return false;
  // 2. Row/col balance
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (row.filter((v) => v === 1).length !== half) return false;
    if (row.filter((v) => v === 2).length !== half) return false;
    for (let c = 0; c <= size - 3; c++)
      if (row[c] === row[c + 1] && row[c + 1] === row[c + 2]) return false;
  }
  for (let c = 0; c < size; c++) {
    const col = grid.map((row) => row[c]);
    if (col.filter((v) => v === 1).length !== half) return false;
    if (col.filter((v) => v === 2).length !== half) return false;
    for (let r = 0; r <= size - 3; r++)
      if (col[r] === col[r + 1] && col[r + 1] === col[r + 2]) return false;
  }
  // 3. Constraints
  for (const cn of constraints) {
    const a = grid[cn.r1][cn.c1],
      b = grid[cn.r2][cn.c2];
    if (cn.type === "=" && a !== b) return false;
    if (cn.type === "x" && a === b) return false;
  }
  return true;
}

function DiffPicker({ selected, onSelect, actionLabel, onAction, counters }) {
  return (
    <div className="diff-picker">
      <div className="diff-grid">
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.id}
            className={`diff-card ${selected === i ? "diff-card-active" : ""}`}
            style={{ "--tier-color": TIER_COLORS[i] }}
            onClick={() => onSelect(i)}
          >
            <div className="diff-card-top">
              <span className="diff-name">{d.name}</span>
              {counters?.[i] > 0 && (
                <span className="diff-badge">#{counters[i]}</span>
              )}
            </div>
            <span className="diff-sub">{d.sub}</span>
          </button>
        ))}
      </div>
      <button className="action-btn" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Shared playable board ────────────────────────────────────────────────────
function PlayableBoard({ gameData, onBack, sourceLabel, onNext }) {
  const [userGrid, setUserGrid] = useState(() =>
    gameData.puzzle.map((r) => [...r]),
  );
  const [status, setStatus] = useState("playing");
  const [elapsed, setElapsed] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const timerRef = useRef(null);

  const { errorCells, completedRows, completedCols } = useErrorCells(
    userGrid,
    gameData,
    status === "playing",
  );

  useEffect(() => {
    const t = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - t) / 1000)),
      1000,
    );
    return () => clearInterval(timerRef.current);
  }, []);

  // Reset board when gameData changes (next puzzle)
  useEffect(() => {
    setUserGrid(gameData.puzzle.map((r) => [...r]));
    setStatus("playing");
    setElapsed(0);
    setShowSol(false);
    clearInterval(timerRef.current);
    const t = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - t) / 1000)),
      1000,
    );
    return () => clearInterval(timerRef.current);
  }, [gameData]);

  function handleCellClick(r, c) {
    if (status !== "playing" || showSol) return;
    const ng = userGrid.map((row) => [...row]);
    ng[r][c] = (ng[r][c] + 1) % 3;
    setUserGrid(ng);
    if (checkWin(ng, gameData)) {
      clearInterval(timerRef.current);
      setStatus("won");
    }
  }

  const lockedCells = new Set(
    gameData.puzzle.flatMap((row, r) =>
      row.map((v, c) => (v ? r * gameData.size + c : -1)).filter((i) => i >= 0),
    ),
  );

  const diff = DIFFICULTIES[gameData.diffId];
  const color = TIER_COLORS[gameData.diffId];
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const blankTotal = gameData.puzzle.flat().filter((v) => !v).length;
  const filled = userGrid
    .flat()
    .filter((v, i) => v && !gameData.puzzle.flat()[i]).length;
  const levelNum = gameData.levelNum ?? 1;

  const displayGrid = showSol ? gameData.solution : userGrid;

  return (
    <div className="play-board">
      {/* Top bar */}
      <div className="board-topbar">
        <button className="ghost-btn" onClick={onBack}>
          ← {sourceLabel}
        </button>
        <div className="board-meta">
          <span className="board-diff" style={{ color }}>
            {diff.name}
          </span>
          <span className="board-lvl">#{levelNum}</span>
          <span className="board-size">
            {gameData.size}×{gameData.size}
          </span>
        </div>
        {status === "playing" && <span className="timer">{fmt(elapsed)}</span>}
        {status === "won" && (
          <span className="timer won-time">✓ {fmt(elapsed)}</span>
        )}
      </div>

      {/* Progress bar */}
      {status === "playing" && (
        <div className="prog-wrap">
          <div
            className="prog-bar"
            style={{
              width: blankTotal
                ? `${Math.round((filled / blankTotal) * 100)}%`
                : "0%",
              background: color,
            }}
          />
        </div>
      )}

      {status === "won" && (
        <div className="win-banner">
          🎉 Solved in {fmt(elapsed)}!
          {onNext && (
            <button className="action-btn small" onClick={onNext}>
              Next →
            </button>
          )}
          <button
            className="action-btn small"
            style={{ marginLeft: 4 }}
            onClick={onBack}
          >
            Menu
          </button>
        </div>
      )}

      {/* Tools */}
      {status === "playing" && (
        <div className="board-tools">
          <button
            className={`ghost-btn ${showSol ? "ghost-btn-on" : ""}`}
            onClick={() => setShowSol((s) => !s)}
          >
            {showSol ? "▶ Resume" : "👁 Peek"}
          </button>
        </div>
      )}

      <p className="hint">
        {filled}/{blankTotal} filled · tap blank cells to cycle {SUN} {MOON}
      </p>

      <MamboGrid
        grid={displayGrid}
        constraints={gameData.constraints}
        size={gameData.size}
        onCellClick={status === "playing" && !showSol ? handleCellClick : null}
        onEdgeClick={null}
        lockedCells={lockedCells}
        errorCells={showSol ? new Set() : errorCells}
        completedRows={showSol ? new Set() : completedRows}
        completedCols={showSol ? new Set() : completedCols}
      />
    </div>
  );
}

// ─── MamboGrid ────────────────────────────────────────────────────────────────
function MamboGrid({
  grid,
  constraints,
  size,
  onCellClick,
  onEdgeClick,
  lockedCells,
  errorCells,
  completedRows,
  completedCols,
}) {
  const CELL = 50,
    GAP = 5,
    EH = 14;
  const total = size * (CELL + GAP) - GAP;

  function getCn(r1, c1, r2, c2) {
    return constraints?.find(
      (cn) => cn.r1 === r1 && cn.c1 === c1 && cn.r2 === r2 && cn.c2 === c2,
    );
  }
  function cellCls(r, c) {
    const val = grid[r]?.[c] ?? 0,
      lock = lockedCells?.has(r * size + c);
    const err = errorCells?.has(r * size + c);
    const done =
      (completedRows?.has(r) || completedCols?.has(c)) && !err && val;
    let cls = "mambo-cell";
    if (val === 1) cls += " cell-sun";
    if (val === 2) cls += " cell-moon";
    if (lock) cls += " cell-locked";
    if (err) cls += " cell-error";
    if (done) cls += " cell-done";
    return cls;
  }

  return (
    <div className="grid-wrapper">
      <div style={{ width: total, height: total, position: "relative" }}>
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className={cellCls(r, c)}
              style={{
                left: c * (CELL + GAP),
                top: r * (CELL + GAP),
                width: CELL,
                height: CELL,
              }}
              onClick={() =>
                onCellClick &&
                !lockedCells?.has(r * size + c) &&
                onCellClick(r, c)
              }
            >
              <span className="cell-sym">
                {(grid[r]?.[c] ?? 0) === 1
                  ? SUN
                  : (grid[r]?.[c] ?? 0) === 2
                    ? MOON
                    : ""}
              </span>
            </div>
          )),
        )}

        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size - 1 }, (_, c) => {
            const cn = getCn(r, c, r, c + 1);
            return (
              <div
                key={`h${r}-${c}`}
                className={`edge-zone ${cn ? "edge-" + cn.type : "edge-empty"}`}
                style={{
                  left: c * (CELL + GAP) + CELL,
                  top: r * (CELL + GAP) + CELL / 2 - EH / 2,
                  width: GAP,
                  height: EH,
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r, c + 1)}
              >
                {cn && (
                  <span className="edge-sym">
                    {cn.type === "=" ? "=" : "×"}
                  </span>
                )}
              </div>
            );
          }),
        )}

        {Array.from({ length: size - 1 }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const cn = getCn(r, c, r + 1, c);
            return (
              <div
                key={`v${r}-${c}`}
                className={`edge-zone ${cn ? "edge-" + cn.type : "edge-empty"}`}
                style={{
                  left: c * (CELL + GAP) + CELL / 2 - EH / 2,
                  top: r * (CELL + GAP) + CELL,
                  width: EH,
                  height: GAP,
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r + 1, c)}
              >
                {cn && (
                  <span className="edge-sym">
                    {cn.type === "=" ? "=" : "×"}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

// ─── Game Tab ─────────────────────────────────────────────────────────────────
// Infinite levels: each difficulty has its own level counter stored in state
// Level number shown as "Comet #1", "Comet #2" etc — infinite
function GameTab() {
  const [diffId, setDiffId] = useState(0);
  const [gameData, setGameData] = useState(null);
  // track per-diff level counters
  const levelCounters = useRef(Array(DIFFICULTIES.length).fill(0));

  function startGame(id) {
    levelCounters.current[id] += 1;
    const data = generatePuzzle(id);
    data.levelNum = levelCounters.current[id];
    setGameData(data);
  }

  if (gameData) {
    return (
      <PlayableBoard
        gameData={gameData}
        onBack={() => setGameData(null)}
        sourceLabel="Game"
        onNext={() => startGame(gameData.diffId)}
      />
    );
  }

  return (
    <div className="game-tab">
      <div className="idle-msg">
        <div className="idle-glyph">⊙</div>
        <p className="idle-title">Choose your challenge</p>
        <ul className="rules-list">
          <li>
            Equal {SUN} and {MOON} in every row &amp; column
          </li>
          <li>No 3 identical symbols adjacent in a row or col</li>
          <li>
            <b className="eq-tag">=</b> neighbors must match ·{" "}
            <b className="x-tag">×</b> must differ
          </li>
          <li>Errors appear after a brief pause</li>
        </ul>
      </div>
      <DiffPicker
        selected={diffId}
        onSelect={setDiffId}
        actionLabel="▶ Play"
        onAction={() => startGame(diffId)}
        counters={levelCounters.current}
      />
    </div>
  );
}

// ─── Generator Tab ─────────────────────────────────────────────────────────────
function GeneratorTab() {
  const [mode, setMode] = useState("level"); // "level" | "diff"
  const [level, setLevel] = useState(1);
  const [levelInput, setLevelInput] = useState("1");
  const [diffId, setDiffId] = useState(2);
  const [gameData, setGameData] = useState(null);
  const genCounters = useRef({}); // key: "level-N" or "diff-D", val: count

  function launchGame(data, key) {
    genCounters.current[key] = (genCounters.current[key] ?? 0) + 1;
    data.levelNum = genCounters.current[key];
    setGameData(data);
  }

  function handleGenerateByLevel() {
    const lv = Math.max(1, parseInt(levelInput) || 1);
    setLevel(lv);
    setLevelInput(String(lv));
    const did = diffIdForLevel(lv);
    const data = generatePuzzle(did);
    data.gameLevel = lv; // store original level number
    launchGame(data, `level-${lv}`);
  }

  function handleGenerateByDiff() {
    const data = generatePuzzle(diffId);
    launchGame(data, `diff-${diffId}`);
  }

  function handleNext() {
    if (!gameData) return;
    if (gameData.gameLevel !== undefined) {
      // came from level mode — advance level
      const nextLv = gameData.gameLevel + 1;
      setLevel(nextLv);
      setLevelInput(String(nextLv));
      const did = diffIdForLevel(nextLv);
      const data = generatePuzzle(did);
      data.gameLevel = nextLv;
      launchGame(data, `level-${nextLv}`);
    } else {
      // came from diff mode — same diff
      const data = generatePuzzle(gameData.diffId);
      launchGame(data, `diff-${gameData.diffId}`);
    }
  }

  if (gameData) {
    return (
      <PlayableBoard
        gameData={gameData}
        onBack={() => setGameData(null)}
        sourceLabel="Generator"
        onNext={handleNext}
      />
    );
  }

  // preview for level mode
  const previewDiffId = diffIdForLevel(Math.max(1, parseInt(levelInput) || 1));
  const previewDiff = DIFFICULTIES[previewDiffId];
  const previewColor = TIER_COLORS[previewDiffId];

  return (
    <div className="gen-tab">
      {/* Mode toggle */}
      <div className="gen-mode-bar">
        <button
          className={`gen-mode-btn ${mode === "level" ? "active" : ""}`}
          onClick={() => setMode("level")}
        >
          <span className="gen-mode-icon">🔢</span>
          <span>By Level</span>
        </button>
        <button
          className={`gen-mode-btn ${mode === "diff" ? "active" : ""}`}
          onClick={() => setMode("diff")}
        >
          <span className="gen-mode-icon">🎯</span>
          <span>By Difficulty</span>
        </button>
      </div>

      {/* ── By Level ── */}
      {mode === "level" && (
        <div className="gen-level-panel">
          <p className="hint" style={{ marginBottom: 4 }}>
            Enter any level number — difficulty is calculated automatically
          </p>

          <div className="level-input-row">
            <button
              className="lv-step"
              onClick={() => {
                const v = Math.max(1, (parseInt(levelInput) || 1) - 1);
                setLevelInput(String(v));
              }}
            >
              −
            </button>
            <input
              className="level-input"
              type="number"
              min="1"
              value={levelInput}
              onChange={(e) => setLevelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateByLevel()}
            />
            <button
              className="lv-step"
              onClick={() => {
                const v = (parseInt(levelInput) || 1) + 1;
                setLevelInput(String(v));
              }}
            >
              +
            </button>
          </div>

          {/* Preview what diff this level maps to */}
          <div
            className="level-preview"
            style={{ "--prev-color": previewColor }}
          >
            <span className="prev-label">
              Level {Math.max(1, parseInt(levelInput) || 1)} →
            </span>
            <span className="prev-diff-name" style={{ color: previewColor }}>
              {previewDiff.name}
            </span>
            <span className="prev-diff-sub">{previewDiff.sub}</span>
          </div>

          {/* Curve mini-map: show next 9 levels */}
          <div className="curve-preview">
            {Array.from({ length: 9 }, (_, i) => {
              const lv = Math.max(1, parseInt(levelInput) || 1) + i;
              const did = diffIdForLevel(lv);
              const col = TIER_COLORS[did];
              const isCurrent = i === 0;
              return (
                <div
                  key={i}
                  className={`curve-pip ${isCurrent ? "curve-pip-active" : ""}`}
                  style={{ "--col": col }}
                  title={`Lv ${lv}: ${DIFFICULTIES[did].name}`}
                  onClick={() => setLevelInput(String(lv))}
                >
                  <span className="curve-lv">{lv}</span>
                  <div className="curve-bar-wrap">
                    <div
                      className="curve-bar"
                      style={{ height: `${((did + 1) / 9) * 32 + 4}px` }}
                    />
                  </div>
                  <span className="curve-name">{DIFFICULTIES[did].name}</span>
                </div>
              );
            })}
          </div>

          <button className="action-btn" onClick={handleGenerateByLevel}>
            🎲 Generate Level {Math.max(1, parseInt(levelInput) || 1)}
          </button>
        </div>
      )}

      {/* ── By Difficulty ── */}
      {mode === "diff" && (
        <div className="gen-diff-panel">
          <p className="hint" style={{ marginBottom: 4 }}>
            Pick a fixed difficulty — generate as many as you want
          </p>
          <DiffPicker
            selected={diffId}
            onSelect={setDiffId}
            actionLabel="🎲 Generate & Play"
            onAction={handleGenerateByDiff}
            counters={Object.fromEntries(
              DIFFICULTIES.map((_, i) => [
                i,
                genCounters.current[`diff-${i}`] ?? 0,
              ]),
            )}
          />
        </div>
      )}
    </div>
  );
}

// ─── Solver Tab ───────────────────────────────────────────────────────────────
function SolverTab() {
  const [size, setSize] = useState(6);
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 6 }, () => Array(6).fill(0)),
  );
  const [constr, setConstr] = useState([]);
  const [solved, setSolved] = useState(null);

  function resizeGrid(s) {
    setSize(s);
    setGrid(Array.from({ length: s }, () => Array(s).fill(0)));
    setConstr([]);
    setSolved(null);
  }
  function cycleCell(r, c) {
    const ng = grid.map((row) => [...row]);
    ng[r][c] = (ng[r][c] + 1) % 3;
    setGrid(ng);
    setSolved(null);
  }
  function handleEdgeClick(r1, c1, r2, c2) {
    const idx = constr.findIndex(
      (cn) => cn.r1 === r1 && cn.c1 === c1 && cn.r2 === r2 && cn.c2 === c2,
    );
    if (idx === -1) setConstr([...constr, { r1, c1, r2, c2, type: "=" }]);
    else if (constr[idx].type === "=") {
      const nc = [...constr];
      nc[idx] = { ...nc[idx], type: "x" };
      setConstr(nc);
    } else setConstr(constr.filter((_, i) => i !== idx));
    setSolved(null);
  }

  return (
    <div className="solver-tab">
      <div className="ctrl-row">
        <span className="ctrl-label">Size</span>
        {[4, 6, 8, 10].map((s) => (
          <button
            key={s}
            className={`sz-btn ${size === s ? "active" : ""}`}
            onClick={() => resizeGrid(s)}
          >
            {s}×{s}
          </button>
        ))}
        <button
          className="action-btn"
          onClick={() => setSolved(solvePuzzle(grid, constr, size))}
        >
          ⚡ Solve
        </button>
        <button
          className="ghost-btn"
          onClick={() => {
            setGrid(Array.from({ length: size }, () => Array(size).fill(0)));
            setConstr([]);
            setSolved(null);
          }}
        >
          ↺ Reset
        </button>
      </div>
      <p className="hint">
        Click cell → blank → {SUN} → {MOON}. Click gap between cells → add = or
        × (again to toggle/remove).
      </p>
      <MamboGrid
        grid={solved || grid}
        constraints={constr}
        size={size}
        onCellClick={solved ? null : cycleCell}
        onEdgeClick={solved ? null : handleEdgeClick}
      />
      {solved === false && <p className="err-msg">❌ No solution found</p>}
      {solved && (
        <p className="ok-msg">✓ Solution found — Reset to try another</p>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function MamboApp() {
  const [tab, setTab] = useState("game");

  return (
    <div className="mambo-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .mambo-root {
          min-height:100vh; background:#0c0b13; color:#dddaea;
          font-family:'Syne',sans-serif;
          display:flex; flex-direction:column; align-items:center;
          padding:24px 16px 60px;
        }

        /* ── Header ── */
        .mambo-header{text-align:center;margin-bottom:20px;}
        .mambo-title {
          font-size:2.6rem; font-weight:800; letter-spacing:-0.04em;
          background:linear-gradient(130deg,#f5c842 0%,#ff7c6e 52%,#a78bfa 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .mambo-sub {
          font-family:'Space Mono',monospace; font-size:0.68rem;
          letter-spacing:.18em; color:#4a4860; margin-top:4px; text-transform:uppercase;
        }

        /* ── Tabs ── */
        .tab-bar{
          display:flex; gap:3px; background:#14131e;
          border:1px solid #22203a; border-radius:14px; padding:4px; margin-bottom:20px;
        }
        .tab-btn{
          font-family:'Syne',sans-serif; font-weight:700; font-size:0.8rem;
          padding:7px 18px; border-radius:10px; border:none; cursor:pointer;
          background:transparent; color:#4a4860; transition:all .18s; letter-spacing:.02em;
        }
        .tab-btn.active{background:linear-gradient(135deg,#f5c842,#ff7c6e);color:#0c0b13;}
        .tab-btn:hover:not(.active){color:#dddaea;background:#22203a;}

        .tab-content{width:100%;max-width:720px;display:flex;flex-direction:column;align-items:center;}
        .game-tab,.solver-tab,.gen-tab,.play-board{
          width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;
        }

        /* ── Difficulty picker ── */
        .diff-picker{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;}
        .diff-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:8px; width:100%; max-width:520px;
        }
        .diff-card{
          display:flex; flex-direction:column; align-items:flex-start;
          padding:10px 14px; border-radius:12px; border:1.5px solid #22203a;
          background:#14131e; cursor:pointer;
          transition:border-color .15s, background .15s, transform .1s;
          text-align:left;
        }
        .diff-card:hover{border-color:var(--tier-color);background:#1a1828;transform:translateY(-1px);}
        .diff-card-active{
          border-color:var(--tier-color)!important;
          background:#1a1828!important;
          box-shadow:0 0 0 1px var(--tier-color);
        }
        .diff-name{
          font-size:.9rem; font-weight:800; letter-spacing:.02em;
          color:var(--tier-color); line-height:1.1;
        }
        .diff-card-top{display:flex;align-items:center;justify-content:space-between;width:100%;gap:4px;}
        .diff-badge{
          font-family:'Space Mono',monospace; font-size:.58rem; font-weight:700;
          color:var(--tier-color); opacity:.65; white-space:nowrap; flex-shrink:0;
        }
        .diff-sub{
          font-family:'Space Mono',monospace; font-size:.6rem;
          color:#4a4860; margin-top:3px; line-height:1;
        }

        /* ── Play board header ── */
        .board-topbar{
          display:flex; align-items:center; justify-content:space-between;
          width:100%; gap:10px; flex-wrap:wrap;
        }
        .board-meta{display:flex;align-items:center;gap:8px;}
        .board-diff{font-weight:800;font-size:1rem;letter-spacing:.03em;}
        .board-lvl{
          font-family:'Space Mono',monospace; font-size:.65rem; font-weight:700;
          color:#a78bfa; background:#14131e; border:1px solid #2e2a4a;
          border-radius:6px; padding:3px 8px;
        }
        .board-size{
          font-family:'Space Mono',monospace; font-size:.68rem;
          color:#4a4860; background:#14131e; border:1px solid #22203a;
          border-radius:6px; padding:3px 8px;
        }
        .board-tools{display:flex;gap:8px;}

        /* ── Progress bar ── */
        .prog-wrap{
          width:100%; max-width:500px; height:3px;
          background:#22203a; border-radius:99px; overflow:hidden;
        }
        .prog-bar{height:100%; border-radius:99px; transition:width .3s ease;}

        /* ── Controls ── */
        .ctrl-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:center;}
        .ctrl-label{
          font-family:'Space Mono',monospace; font-size:.66rem;
          color:#3d3b52; letter-spacing:.14em; text-transform:uppercase;
        }
        .sz-btn{
          font-family:'Space Mono',monospace; font-size:.7rem; font-weight:700;
          padding:6px 10px; border-radius:8px; border:1px solid #22203a;
          background:#14131e; color:#4a4860; cursor:pointer; transition:all .14s;
        }
        .sz-btn.active{border-color:#f5c842;color:#f5c842;background:#1d1b2a;}
        .sz-btn:hover:not(.active){border-color:#32304a;color:#dddaea;}

        .action-btn{
          font-family:'Syne',sans-serif; font-weight:700; font-size:.82rem;
          padding:8px 18px; border-radius:10px; border:none;
          background:linear-gradient(135deg,#f5c842,#ff7c6e); color:#0c0b13;
          cursor:pointer; transition:opacity .14s,transform .1s;
        }
        .action-btn:hover{opacity:.88;transform:translateY(-1px);}
        .action-btn:active{transform:translateY(0);}
        .action-btn.small{font-size:.72rem;padding:5px 12px;margin-left:10px;}

        .ghost-btn{
          font-family:'Space Mono',monospace; font-size:.7rem; font-weight:700;
          padding:6px 12px; border-radius:8px; border:1px solid #22203a;
          background:transparent; color:#4a4860; cursor:pointer; transition:all .14s;
        }
        .ghost-btn:hover{border-color:#4a4860;color:#dddaea;}
        .ghost-btn-on{border-color:#a78bfa!important;color:#a78bfa!important;}

        .timer{
          font-family:'Space Mono',monospace; font-size:.95rem; font-weight:700;
          color:#a78bfa; min-width:50px; text-align:right;
        }
        .won-time{color:#4ade80!important;}

        .hint{
          font-family:'Space Mono',monospace; font-size:.66rem;
          color:#3a3855; text-align:center; max-width:480px; line-height:1.65;
        }

        /* ── Grid ── */
        .grid-wrapper{
          padding:14px; background:#120f1c; border-radius:18px;
          border:1px solid #22203a; overflow:auto; max-width:100%;
        }
        .mambo-cell{
          position:absolute; border-radius:9px;
          background:#1a192a; border:1.5px solid #22203a;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; user-select:none;
          transition:background .12s,border-color .12s,transform .08s,opacity .2s;
        }
        .mambo-cell:hover:not(.cell-locked){border-color:#38364e;transform:scale(1.05);}
        .mambo-cell.cell-sun {background:#231e0c;border-color:#c9a030;}
        .mambo-cell.cell-moon{background:#17102a;border-color:#8060c8;}
        .mambo-cell.cell-locked{cursor:default;}
        .mambo-cell.cell-locked:hover{transform:none!important;}
        .mambo-cell.cell-locked.cell-sun {border-color:#f5c842;opacity:.94;}
        .mambo-cell.cell-locked.cell-moon{border-color:#a78bfa;opacity:.94;}
        .mambo-cell.cell-error{
          border-color:#e02848!important;background:#24091a!important;
          animation:errpulse .4s ease;
        }
        .mambo-cell.cell-done{opacity:.45;}

        @keyframes errpulse{
          0%  {transform:scale(1);}
          30% {transform:scale(1.07);}
          65% {transform:scale(.96);}
          100%{transform:scale(1);}
        }

        .cell-sym{font-size:1.3rem;line-height:1;pointer-events:none;}
        .mambo-cell.cell-sun  .cell-sym{color:#f5c842;}
        .mambo-cell.cell-moon .cell-sym{color:#a78bfa;}

        /* ── Edges ── */
        .edge-zone{position:absolute;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;}
        .edge-empty{opacity:0;transition:opacity .15s;}
        .edge-empty:hover{opacity:.45;background:#38364e;border-radius:3px;}
        .edge-sym{font-family:'Space Mono',monospace;font-size:.6rem;font-weight:700;pointer-events:none;line-height:1;}
        .edge-\\={opacity:1;} .edge-\\= .edge-sym{color:#4ade80;}
        .edge-x  {opacity:1;} .edge-x   .edge-sym{color:#f87171;}

        /* ── Win / messages ── */
        .win-banner{
          background:#0e1a10;border:1px solid #2d6630;border-radius:12px;
          padding:12px 20px;font-size:.95rem;font-weight:700;color:#4ade80;
          display:flex;align-items:center;
        }
        .err-msg{font-family:'Space Mono',monospace;font-size:.78rem;color:#e02848;}
        .ok-msg {font-family:'Space Mono',monospace;font-size:.78rem;color:#4ade80;}

        /* ── Generator mode toggle ── */
        .gen-mode-bar{
          display:flex; gap:6px; background:#14131e;
          border:1px solid #22203a; border-radius:12px; padding:4px; width:100%; max-width:360px;
        }
        .gen-mode-btn{
          flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
          font-family:'Syne',sans-serif; font-weight:700; font-size:.8rem;
          padding:8px 12px; border-radius:9px; border:none; cursor:pointer;
          background:transparent; color:#4a4860; transition:all .18s;
        }
        .gen-mode-btn.active{background:linear-gradient(135deg,#f5c842,#ff7c6e);color:#0c0b13;}
        .gen-mode-btn:hover:not(.active){color:#dddaea;background:#22203a;}
        .gen-mode-icon{font-size:.9rem;}

        /* ── Level input panel ── */
        .gen-level-panel,.gen-diff-panel{
          display:flex; flex-direction:column; align-items:center; gap:14px; width:100%;
        }
        .level-input-row{display:flex; align-items:center; gap:8px;}
        .lv-step{
          font-family:'Space Mono',monospace; font-size:1.2rem; font-weight:700;
          width:38px; height:38px; border-radius:10px; border:1px solid #22203a;
          background:#14131e; color:#a78bfa; cursor:pointer; transition:all .14s;
          display:flex; align-items:center; justify-content:center;
        }
        .lv-step:hover{border-color:#a78bfa;background:#1e1a30;}
        .level-input{
          font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
          width:100px; text-align:center; background:#14131e;
          border:2px solid #a78bfa; border-radius:12px; color:#dddaea;
          padding:6px 8px; outline:none;
          -moz-appearance:textfield;
        }
        .level-input::-webkit-inner-spin-button,.level-input::-webkit-outer-spin-button{-webkit-appearance:none;}
        .level-input:focus{border-color:#c4b5fd; box-shadow:0 0 0 3px #a78bfa22;}

        /* ── Level preview ── */
        .level-preview{
          display:flex; align-items:center; gap:10px;
          background:#14131e; border:1px solid #22203a; border-radius:12px;
          padding:10px 18px; transition:border-color .2s;
          border-color:var(--prev-color);
        }
        .prev-label{font-family:'Space Mono',monospace;font-size:.7rem;color:#4a4860;}
        .prev-diff-name{font-weight:800;font-size:1rem;letter-spacing:.02em;}
        .prev-diff-sub{font-family:'Space Mono',monospace;font-size:.62rem;color:#4a4860;}

        /* ── Curve mini-map ── */
        .curve-preview{
          display:flex; gap:6px; align-items:flex-end;
          background:#14131e; border:1px solid #22203a; border-radius:14px;
          padding:12px 14px; width:100%; max-width:520px; overflow-x:auto;
        }
        .curve-pip{
          display:flex; flex-direction:column; align-items:center; gap:3px;
          cursor:pointer; min-width:46px; transition:opacity .15s;
        }
        .curve-pip:hover{opacity:.75;}
        .curve-pip-active .curve-bar{background:var(--col)!important;}
        .curve-pip-active .curve-lv{color:var(--col)!important; font-weight:700;}
        .curve-lv{
          font-family:'Space Mono',monospace; font-size:.6rem; color:#4a4860;
        }
        .curve-bar-wrap{display:flex;align-items:flex-end;height:36px;}
        .curve-bar{
          width:12px; border-radius:4px 4px 0 0;
          background:#22203a; transition:height .2s;
        }
        .curve-pip-active .curve-name,.curve-pip:hover .curve-name{opacity:1!important;}
        .curve-name{
          font-family:'Space Mono',monospace; font-size:.55rem;
          color:var(--col); opacity:.5; text-align:center;
          max-width:46px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }

        /* ── Idle ── */
        .idle-msg{
          text-align:center; padding:32px 16px;
          display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        .idle-glyph{font-size:3.2rem;opacity:.2;animation:pulse 2.4s ease-in-out infinite;}
        .idle-title{font-size:.95rem;font-weight:700;color:#4a4860;}
        @keyframes pulse{0%,100%{opacity:.16;transform:scale(1);}50%{opacity:.28;transform:scale(1.06);}}

        .rules-list{list-style:none;display:flex;flex-direction:column;gap:6px;width:100%;max-width:380px;}
        .rules-list li{
          font-family:'Space Mono',monospace; font-size:.68rem; color:#3d3b52;
          background:#14131e; border:1px solid #22203a;
          border-radius:8px; padding:7px 12px; text-align:left;
        }
        .eq-tag{color:#4ade80;} .x-tag{color:#f87171;}
      `}</style>

      <div className="mambo-header">
        <div className="mambo-title">MAMBO</div>
        <div className="mambo-sub">☀ ◑ logic puzzle</div>
      </div>

      <div className="tab-bar">
        {[
          ["game", "🎮 Game"],
          ["solver", "🧠 Solver"],
          ["generator", "⚙ Generator"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === "game" && <GameTab />}
        {tab === "solver" && <SolverTab />}
        {tab === "generator" && <GeneratorTab />}
      </div>
    </div>
  );
}
