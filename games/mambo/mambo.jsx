"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
// CellState: 0 = blank, 1 = Sun (X), 2 = Moon (Y)
// Constraint: { r1,c1,r2,c2, type: "=" | "x" }

// ─── Symbols ─────────────────────────────────────────────────────────────────
const SUN = "☀";
const MOON = "◑";

// ─── Difficulty config ───────────────────────────────────────────────────────
function getDiffConfig(level) {
  // level 1-9
  const configs = [
    { gridSize: 4, initRatio: 0.55, constraintRatio: 0.5 }, // 1
    { gridSize: 4, initRatio: 0.45, constraintRatio: 0.4 }, // 2
    { gridSize: 6, initRatio: 0.5, constraintRatio: 0.45 }, // 3
    { gridSize: 6, initRatio: 0.4, constraintRatio: 0.35 }, // 4
    { gridSize: 6, initRatio: 0.3, constraintRatio: 0.3 }, // 5
    { gridSize: 8, initRatio: 0.4, constraintRatio: 0.35 }, // 6
    { gridSize: 8, initRatio: 0.3, constraintRatio: 0.28 }, // 7
    { gridSize: 8, initRatio: 0.22, constraintRatio: 0.22 }, // 8
    { gridSize: 10, initRatio: 0.22, constraintRatio: 0.2 }, // 9
  ];
  return configs[Math.min(level - 1, 8)];
}

// ─── Core Logic ──────────────────────────────────────────────────────────────
function isValidPlacement(grid, r, c, val, size) {
  const half = size / 2;
  // Check row: count existing val
  const rowVals = grid[r].filter((v) => v === val).length;
  if (rowVals >= half) return false;
  // Check col
  let colCount = 0;
  for (let i = 0; i < size; i++) if (grid[i][c] === val) colCount++;
  if (colCount >= half) return false;
  // Check no 3 in a row (row)
  const row = [...grid[r]];
  row[c] = val;
  for (let i = 0; i <= size - 3; i++) {
    if (row[i] !== 0 && row[i] === row[i + 1] && row[i + 1] === row[i + 2])
      return false;
  }
  // Check no 3 in a col
  const col = grid.map((rw) => rw[c]);
  col[r] = val;
  for (let i = 0; i <= size - 3; i++) {
    if (col[i] !== 0 && col[i] === col[i + 1] && col[i + 1] === col[i + 2])
      return false;
  }
  return true;
}

function isValidWithConstraints(grid, constraints, size) {
  for (const c of constraints) {
    const a = grid[c.r1][c.c1];
    const b = grid[c.r2][c.c2];
    if (a === 0 || b === 0) continue;
    if (c.type === "=" && a !== b) return false;
    if (c.type === "x" && a === b) return false;
  }
  return true;
}

function solvePuzzle(grid, constraints, size) {
  const g = grid.map((r) => [...r]);
  function bt(pos) {
    if (pos === size * size)
      return isValidWithConstraints(g, constraints, size);
    const r = Math.floor(pos / size),
      c = pos % size;
    if (g[r][c] !== 0) return bt(pos + 1);
    for (const val of [1, 2]) {
      if (isValidPlacement(g, r, c, val, size)) {
        g[r][c] = val;
        // check constraints partially
        let ok = true;
        for (const cn of constraints) {
          if ((cn.r1 === r && cn.c1 === c) || (cn.r2 === r && cn.c2 === c)) {
            const a = g[cn.r1][cn.c1],
              b = g[cn.r2][cn.c2];
            if (a !== 0 && b !== 0) {
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
    }
    return false;
  }
  if (bt(0)) return g;
  return null;
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
    const vals = shuffle([1, 2]);
    for (const val of vals) {
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

function generatePuzzle(level) {
  const { gridSize: size, initRatio, constraintRatio } = getDiffConfig(level);
  const solution = generateSolution(size);

  // Generate constraints between adjacent cells
  const allEdges = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) allEdges.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      if (r + 1 < size) allEdges.push({ r1: r, c1: c, r2: r + 1, c2: c });
    }
  }
  const shuffledEdges = shuffle(allEdges);
  const maxConstraints = Math.floor(allEdges.length * constraintRatio);
  const constraints = shuffledEdges.slice(0, maxConstraints).map((e) => ({
    ...e,
    type: solution[e.r1][e.c1] === solution[e.r2][e.c2] ? "=" : "x",
  }));

  // Generate initial cells
  const allCells = shuffle(Array.from({ length: size * size }, (_, i) => i));
  const initCount = Math.floor(size * size * initRatio);
  const initSet = new Set(allCells.slice(0, initCount));
  const puzzle = solution.map((row, r) =>
    row.map((val, c) => (initSet.has(r * size + c) ? val : 0)),
  );

  return { puzzle, solution, constraints, size };
}

// ─── Solver Tab ───────────────────────────────────────────────────────────────
function SolverTab({ size: defaultSize }) {
  const [size, setSize] = useState(defaultSize || 6);
  const [grid, setGrid] = useState(() =>
    Array.from({ length: size }, () => Array(size).fill(0)),
  );
  const [constraints, setConstraints] = useState([]);
  const [solved, setSolved] = useState(null);

  const [addingConstraint, setAddingConstraint] = useState(null); // {r1,c1}
  const [pendingEdge, setPendingEdge] = useState(null);

  function resizeGrid(newSize) {
    setSize(newSize);
    setGrid(Array.from({ length: newSize }, () => Array(newSize).fill(0)));
    setConstraints([]);
    setSolved(null);
    setAddingConstraint(null);
    setPendingEdge(null);
  }

  function cycleCell(r, c) {
    const ng = grid.map((row) => [...row]);
    ng[r][c] = (ng[r][c] + 1) % 3;
    setGrid(ng);
    setSolved(null);
  }

  function handleSolve() {
    const result = solvePuzzle(grid, constraints, size);
    setSolved(result);
  }

  function addConstraint(r1, c1, r2, c2, type) {
    // remove existing
    const filtered = constraints.filter(
      (c) => !(c.r1 === r1 && c.c1 === c1 && c.r2 === r2 && c.c2 === c2),
    );
    setConstraints([...filtered, { r1, c1, r2, c2, type }]);
  }

  function handleEdgeClick(r1, c1, r2, c2) {
    const existing = constraints.find(
      (c) => c.r1 === r1 && c.c1 === c1 && c.r2 === r2 && c.c2 === c2,
    );
    if (!existing) {
      addConstraint(r1, c1, r2, c2, "=");
    } else if (existing.type === "=") {
      addConstraint(r1, c1, r2, c2, "x");
    } else {
      setConstraints(
        constraints.filter(
          (c) => !(c.r1 === r1 && c.c1 === c1 && c.r2 === r2 && c.c2 === c2),
        ),
      );
    }
  }

  return (
    <div className="solver-tab">
      <div className="ctrl-row">
        <label>Grid Size:</label>
        {[4, 6, 8, 10].map((s) => (
          <button
            key={s}
            className={`sz-btn ${size === s ? "active" : ""}`}
            onClick={() => resizeGrid(s)}
          >
            {s}×{s}
          </button>
        ))}
        <button className="solve-btn" onClick={handleSolve}>
          ⚡ Solve
        </button>
      </div>
      <p className="hint">
        Click cell to cycle state. Click edge between cells to add = or ×
        constraint (click again to toggle/remove).
      </p>
      <MamboGrid
        grid={solved || grid}
        constraints={constraints}
        size={size}
        onCellClick={cycleCell}
        onEdgeClick={handleEdgeClick}
        isStatic={!!solved}
      />
      {solved === null && <div className="no-sol" />}
      {solved === false && <div className="no-sol">❌ No solution found</div>}
    </div>
  );
}

// ─── Generator Tab ────────────────────────────────────────────────────────────
function GeneratorTab() {
  const [level, setLevel] = useState(3);
  const [puzzle, setPuzzle] = useState(null);
  const [generated, setGenerated] = useState(false);

  function handleGenerate() {
    const p = generatePuzzle(level);
    setPuzzle(p);
    setGenerated(true);
  }

  return (
    <div className="gen-tab">
      <div className="ctrl-row">
        <label>Difficulty:</label>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
          <button
            key={l}
            className={`sz-btn ${level === l ? "active" : ""}`}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
        <button className="solve-btn" onClick={handleGenerate}>
          🎲 Generate
        </button>
      </div>
      {generated && puzzle && (
        <div>
          <p className="hint">
            Generated {puzzle.size}×{puzzle.size} puzzle at difficulty {level}.
            This is the solution view.
          </p>
          <MamboGrid
            grid={puzzle.solution}
            constraints={puzzle.constraints}
            size={puzzle.size}
            onCellClick={null}
            onEdgeClick={null}
            isStatic={true}
          />
        </div>
      )}
    </div>
  );
}

// ─── Game Grid Component ──────────────────────────────────────────────────────
function MamboGrid({
  grid,
  constraints,
  size,
  onCellClick,
  onEdgeClick,
  isStatic,
  lockedCells,
  errorCells,
  completedRows,
  completedCols,
}) {
  const CELL = 52;
  const GAP = 4;
  const EDGE = 16;
  const total = size * (CELL + GAP) - GAP;

  function getConstraint(r1, c1, r2, c2) {
    return constraints?.find(
      (c) => c.r1 === r1 && c.c1 === c1 && c.r2 === r2 && c.c2 === c2,
    );
  }

  function cellSymbol(val) {
    if (val === 1) return SUN;
    if (val === 2) return MOON;
    return "";
  }

  function cellClass(r, c) {
    const val = grid[r]?.[c] ?? 0;
    const locked = lockedCells?.has(r * size + c);
    const err = errorCells?.has(r * size + c);
    const rowDone = completedRows?.has(r);
    const colDone = completedCols?.has(c);
    let cls = "mambo-cell";
    if (val === 1) cls += " cell-sun";
    if (val === 2) cls += " cell-moon";
    if (locked) cls += " cell-locked";
    if (err) cls += " cell-error";
    if ((rowDone || colDone) && val !== 0) cls += " cell-done";
    return cls;
  }

  return (
    <div
      className="grid-wrapper"
      style={{ width: total + EDGE * 2, height: total + EDGE * 2 }}
    >
      <div
        className="grid-inner"
        style={{ width: total, height: total, position: "relative" }}
      >
        {/* Cells */}
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const x = c * (CELL + GAP);
            const y = r * (CELL + GAP);
            const val = grid[r]?.[c] ?? 0;
            return (
              <div
                key={`${r}-${c}`}
                className={cellClass(r, c)}
                style={{
                  left: x,
                  top: y,
                  width: CELL,
                  height: CELL,
                  position: "absolute",
                }}
                onClick={() =>
                  onCellClick &&
                  !lockedCells?.has(r * size + c) &&
                  onCellClick(r, c)
                }
              >
                <span className="cell-sym">{cellSymbol(val)}</span>
              </div>
            );
          }),
        )}
        {/* Horizontal edges (between cols in same row) */}
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size - 1 }, (_, c) => {
            const cn = getConstraint(r, c, r, c + 1);
            const x = c * (CELL + GAP) + CELL;
            const y = r * (CELL + GAP) + CELL / 2 - EDGE / 2;
            return (
              <div
                key={`h-${r}-${c}`}
                className={`edge-h ${cn ? "edge-" + cn.type : "edge-empty"}`}
                style={{
                  left: x,
                  top: y,
                  width: GAP,
                  height: EDGE,
                  position: "absolute",
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r, c + 1)}
                title={cn ? cn.type : "click to add"}
              >
                {cn && (
                  <span className="edge-sym">
                    {cn.type === "=" ? "＝" : "✕"}
                  </span>
                )}
              </div>
            );
          }),
        )}
        {/* Vertical edges (between rows in same col) */}
        {Array.from({ length: size - 1 }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const cn = getConstraint(r, c, r + 1, c);
            const x = c * (CELL + GAP) + CELL / 2 - EDGE / 2;
            const y = r * (CELL + GAP) + CELL;
            return (
              <div
                key={`v-${r}-${c}`}
                className={`edge-v ${cn ? "edge-" + cn.type : "edge-empty"}`}
                style={{
                  left: x,
                  top: y,
                  width: EDGE,
                  height: GAP,
                  position: "absolute",
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r + 1, c)}
                title={cn ? cn.type : "click to add"}
              >
                {cn && (
                  <span className="edge-sym">
                    {cn.type === "=" ? "＝" : "✕"}
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
function GameTab() {
  const [level, setLevel] = useState(1);
  const [gameData, setGameData] = useState(null);
  const [userGrid, setUserGrid] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, playing, won
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function startGame(lvl) {
    clearInterval(timerRef.current);
    const data = generatePuzzle(lvl);
    setGameData(data);
    setUserGrid(data.puzzle.map((r) => [...r]));
    setStatus("playing");
    setElapsed(0);
    const t = Date.now();
    setStartTime(t);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - t) / 1000));
    }, 1000);
  }

  function handleCellClick(r, c) {
    if (status !== "playing") return;
    const locked = gameData.puzzle[r][c] !== 0;
    if (locked) return;
    const ng = userGrid.map((row) => [...row]);
    ng[r][c] = (ng[r][c] + 1) % 3;
    setUserGrid(ng);
    checkWin(ng);
  }

  function checkWin(g) {
    const { solution, size } = gameData;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (g[r][c] !== solution[r][c]) return;
    clearInterval(timerRef.current);
    setStatus("won");
  }

  // Compute error cells and completed rows/cols
  const errorCells = new Set();
  const completedRows = new Set();
  const completedCols = new Set();

  if (gameData && userGrid) {
    const { size, constraints } = gameData;
    const half = size / 2;
    // Row checks
    for (let r = 0; r < size; r++) {
      const row = userGrid[r];
      const suns = row.filter((v) => v === 1).length;
      const moons = row.filter((v) => v === 2).length;
      if (row.every((v) => v !== 0) && suns === half && moons === half) {
        completedRows.add(r);
      }
      // 3 in a row
      for (let c = 0; c <= size - 3; c++) {
        if (
          row[c] !== 0 &&
          row[c] === row[c + 1] &&
          row[c + 1] === row[c + 2]
        ) {
          errorCells.add(r * size + c);
          errorCells.add(r * size + c + 1);
          errorCells.add(r * size + c + 2);
        }
      }
    }
    // Col checks
    for (let c = 0; c < size; c++) {
      const col = userGrid.map((r) => r[c]);
      const suns = col.filter((v) => v === 1).length;
      const moons = col.filter((v) => v === 2).length;
      if (col.every((v) => v !== 0) && suns === half && moons === half) {
        completedCols.add(c);
      }
      for (let r = 0; r <= size - 3; r++) {
        if (
          col[r] !== 0 &&
          col[r] === col[r + 1] &&
          col[r + 1] === col[r + 2]
        ) {
          errorCells.add(r * size + c);
          errorCells.add((r + 1) * size + c);
          errorCells.add((r + 2) * size + c);
        }
      }
    }
    // Constraint errors
    for (const cn of constraints) {
      const a = userGrid[cn.r1][cn.c1],
        b = userGrid[cn.r2][cn.c2];
      if (a !== 0 && b !== 0) {
        if (cn.type === "=" && a !== b) {
          errorCells.add(cn.r1 * size + cn.c1);
          errorCells.add(cn.r2 * size + cn.c2);
        }
        if (cn.type === "x" && a === b) {
          errorCells.add(cn.r1 * size + cn.c1);
          errorCells.add(cn.r2 * size + cn.c2);
        }
      }
    }
  }

  const lockedCells = gameData
    ? new Set(
        gameData.puzzle.flatMap((row, r) =>
          row
            .map((v, c) => (v !== 0 ? r * gameData.size + c : -1))
            .filter((i) => i >= 0),
        ),
      )
    : new Set();

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="game-tab">
      <div className="ctrl-row">
        <label>Level:</label>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
          <button
            key={l}
            className={`sz-btn ${level === l ? "active" : ""}`}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
        <button className="solve-btn" onClick={() => startGame(level)}>
          ▶ Start
        </button>
        {status === "playing" && (
          <span className="timer">{fmtTime(elapsed)}</span>
        )}
      </div>
      {status === "won" && (
        <div className="win-banner">
          🎉 Solved in {fmtTime(elapsed)}!
          <button
            className="solve-btn"
            style={{ marginLeft: 12 }}
            onClick={() => startGame(level)}
          >
            Play Again
          </button>
        </div>
      )}
      {status !== "idle" && gameData && userGrid && (
        <>
          <p className="hint">
            {gameData.size}×{gameData.size} · Level {level} · Click blank cells
            to cycle ☀ ◑
          </p>
          <MamboGrid
            grid={userGrid}
            constraints={gameData.constraints}
            size={gameData.size}
            onCellClick={status === "playing" ? handleCellClick : null}
            onEdgeClick={null}
            lockedCells={lockedCells}
            errorCells={errorCells}
            completedRows={completedRows}
            completedCols={completedCols}
          />
        </>
      )}
      {status === "idle" && (
        <div className="idle-msg">
          <div className="idle-icon">⊙</div>
          <p>Select a level and press Start to play Mambo!</p>
          <ul className="rules-list">
            <li>Each row & column must have equal ☀ and ◑</li>
            <li>No 3 identical symbols in a row or column</li>
            <li>
              <b>＝</b> means adjacent cells must match
            </li>
            <li>
              <b>✕</b> means adjacent cells must differ
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MamboApp() {
  const [tab, setTab] = useState("game");

  return (
    <div className="mambo-root">
      <style>{`
        
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mambo-root {
          min-height: 100vh;
          background: #0d0d14;
          color: #e8e4f0;
          font-family: 'Syne', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 48px;
        }

        .mambo-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .mambo-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #f5c842 0%, #ff7c6e 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .mambo-sub {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: #6b6880;
          margin-top: 6px;
          text-transform: uppercase;
        }

        .tab-bar {
          display: flex;
          gap: 4px;
          background: #16151f;
          border: 1px solid #2a2838;
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .tab-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          padding: 8px 22px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          background: transparent;
          color: #6b6880;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #f5c842, #ff7c6e);
          color: #0d0d14;
        }

        .tab-btn:hover:not(.active) {
          color: #e8e4f0;
          background: #2a2838;
        }

        .tab-content {
          width: 100%;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .game-tab, .solver-tab, .gen-tab {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .ctrl-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ctrl-row label {
          font-size: 0.75rem;
          color: #6b6880;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .sz-btn {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #2a2838;
          background: #16151f;
          color: #6b6880;
          cursor: pointer;
          transition: all 0.15s;
        }

        .sz-btn.active {
          border-color: #f5c842;
          color: #f5c842;
          background: #1e1c2a;
        }

        .sz-btn:hover:not(.active) {
          border-color: #3a3850;
          color: #e8e4f0;
        }

        .solve-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f5c842, #ff7c6e);
          color: #0d0d14;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .solve-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .solve-btn:active { transform: translateY(0); }

        .timer {
          font-size: 1.1rem;
          font-weight: 700;
          color: #a78bfa;
          min-width: 56px;
          text-align: center;
        }

        .hint {
          font-size: 0.7rem;
          color: #4a4860;
          text-align: center;
          max-width: 520px;
          line-height: 1.6;
        }

        .grid-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: #16151f;
          border-radius: 20px;
          border: 1px solid #2a2838;
          overflow: auto;
        }

        .grid-inner {
          position: relative;
        }

        .mambo-cell {
          position: absolute;
          border-radius: 10px;
          background: #1e1c2a;
          border: 1.5px solid #2a2838;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          user-select: none;
        }

        .mambo-cell:hover {
          border-color: #3a3850;
          transform: scale(1.04);
        }

        .mambo-cell.cell-sun {
          background: #2a2010;
          border-color: #f5c842;
        }

        .mambo-cell.cell-moon {
          background: #1a1028;
          border-color: #a78bfa;
        }

        .mambo-cell.cell-locked {
          cursor: default;
          opacity: 0.85;
        }

        .mambo-cell.cell-locked:hover { transform: none; }

        .mambo-cell.cell-error {
          border-color: #ff4d6d !important;
          background: #2a1018 !important;
          animation: shake 0.3s ease;
        }

        .mambo-cell.cell-done {
          opacity: 0.7;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        .cell-sym {
          font-size: 1.4rem;
          line-height: 1;
          pointer-events: none;
        }

        .mambo-cell.cell-sun .cell-sym { color: #f5c842; }
        .mambo-cell.cell-moon .cell-sym { color: #a78bfa; }

        .edge-h, .edge-v {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: opacity 0.15s;
        }

        .edge-empty {
          opacity: 0.2;
        }

        .edge-empty:hover { opacity: 0.6; }

        .edge-sym {
          font-size: 0.55rem;
          line-height: 1;
          pointer-events: none;
          font-weight: 700;
        }

        .edge-\\= .edge-sym { color: #4ade80; }
        .edge-x .edge-sym { color: #f87171; }
        .edge-\\=, .edge-x { opacity: 1; }

        .win-banner {
          background: linear-gradient(135deg, #1e2a1a, #1a1e28);
          border: 1px solid #4ade80;
          border-radius: 14px;
          padding: 14px 24px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #4ade80;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .idle-msg {
          text-align: center;
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .idle-icon {
          font-size: 4rem;
          opacity: 0.3;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        .idle-msg p {
          color: #4a4860;
          font-size: 0.95rem;
        }

        .rules-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .rules-list li {
          font-size: 0.72rem;
          color: #4a4860;
          background: #16151f;
          border: 1px solid #2a2838;
          border-radius: 8px;
          padding: 8px 14px;
          text-align: left;
        }

        .no-sol {
          font-size: 0.85rem;
          color: #ff4d6d;
          min-height: 24px;
        }
      `}</style>

      <div className="mambo-header">
        <div className="mambo-title">MAMBO</div>
        <div className="mambo-sub">☀ ◑ logic puzzle</div>
      </div>

      <div className="tab-bar">
        {[
          ["game", "🎮 Game"],
          ["solver", "🧠 Solver"],
          ["generator", "⚙️ Generator"],
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
