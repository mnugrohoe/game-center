"use client";

import { useState, useEffect } from "react";
import type { SolState, StatusType } from "@/games/kings/core/types";
import {
  REGION_FILL_SOLVER,
  REGION_BORDER_SOLVER,
  EXAMPLE_GRID,
  STATUS_STYLE,
} from "@/games/kings/core/const";

export default function KingsSolver() {
  const [N, setN] = useState(6);
  const [sizeInput, setSizeInput] = useState(6);
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: 6 }, () => Array(6).fill(-1)),
  );
  const [solution, setSolution] = useState<SolState[][]>(() =>
    Array.from({ length: 6 }, () => Array(6).fill("")),
  );
  const [hasSolution, setHasSolution] = useState(false);
  const [activeRegion, setActiveRegion] = useState(0);
  const [painting, setPainting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; msg: string }>({
    type: "edit",
    msg: "Draw regions on the grid above",
  });
  const [solveLog, setSolveLog] = useState("");
  const [winDetail, setWinDetail] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [use3x3, setUse3x3] = useState(true);
  const [exportText, setExportText] = useState("");
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    const up = () => {
      setPainting(false);
      setErasing(false);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  function buildGrid(n?: number, keepData?: boolean) {
    const size = n ?? N;
    if (!keepData)
      setGrid(Array.from({ length: size }, () => Array(size).fill(-1)));
    setSolution(Array.from({ length: size }, () => Array(size).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setSolveLog("");
    setStatus({ type: "edit", msg: "Draw regions on the grid" });
  }

  function paintCell(r: number, c: number) {
    if (hasSolution) {
      clearSolution();
    }
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = activeRegion;
      return next;
    });
  }
  function eraseCell(r: number, c: number) {
    if (hasSolution) {
      clearSolution();
    }
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = -1;
      return next;
    });
  }

  function getRegionBordersForCell(r: number, c: number, g: number[][]) {
    const reg = g[r][c];
    const n = g.length;
    return {
      top: r === 0 || g[r - 1]?.[c] !== reg,
      bottom: r === n - 1 || g[r + 1]?.[c] !== reg,
      left: c === 0 || g[r]?.[c - 1] !== reg,
      right: c === n - 1 || g[r]?.[c + 1] !== reg,
    };
  }

  function validateRegions(): boolean {
    const regs = new Set<number>();
    let unassigned = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === -1) unassigned++;
        else regs.add(grid[r][c]);
      }
    const numR = regs.size;
    if (unassigned > 0) {
      setStatus({
        type: "err",
        msg: `${unassigned} unassigned cell(s) — paint all cells first`,
      });
      return false;
    }
    if (numR !== N) {
      setStatus({
        type: "err",
        msg: `${numR} region(s) found but need exactly ${N}`,
      });
      return false;
    }
    setStatus({
      type: "ok",
      msg: `✓ ${numR} regions on ${N}×${N} grid — ready to solve`,
    });
    return true;
  }

  function clearSolution() {
    setSolution(Array.from({ length: N }, () => Array(N).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setSolveLog("");
  }

  function solve() {
    if (!validateRegions()) return;
    clearSolution();
    setStatus({ type: "solve", msg: "Solving…" });
    setSolveLog("Running backtracker…");
    setSolving(true);

    setTimeout(() => {
      const regs = [...new Set(grid.flat())].sort((a, b) => a - b);
      const regionCells: Record<number, [number, number][]> = {};
      regs.forEach((r) => (regionCells[r] = []));
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) regionCells[grid[r][c]].push([r, c]);

      const kings: [number, number][] = [];
      const usedRow = new Set<number>(),
        usedCol = new Set<number>(),
        usedReg = new Set<number>();

      function conflicts(r: number, c: number) {
        if (usedRow.has(r) || usedCol.has(c) || usedReg.has(grid[r][c]))
          return true;
        if (use3x3)
          for (const [kr, kc] of kings)
            if (Math.abs(kr - r) <= 1 && Math.abs(kc - c) <= 1) return true;
        return false;
      }

      let calls = 0;
      function bt(regIdx: number): boolean {
        calls++;
        if (regIdx === regs.length) return true;
        const reg = regs[regIdx];
        for (const [r, c] of regionCells[reg]) {
          if (!conflicts(r, c)) {
            kings.push([r, c]);
            usedRow.add(r);
            usedCol.add(c);
            usedReg.add(reg);
            if (bt(regIdx + 1)) return true;
            kings.pop();
            usedRow.delete(r);
            usedCol.delete(c);
            usedReg.delete(reg);
          }
        }
        return false;
      }

      const t0 = performance.now();
      const found = bt(0);
      const ms = (performance.now() - t0).toFixed(1);

      setSolving(false);
      if (!found) {
        setStatus({
          type: "err",
          msg: "No solution found — check your regions",
        });
        setSolveLog(`Explored ${calls} states in ${ms}ms`);
        return;
      }

      const newSol: SolState[][] = Array.from({ length: N }, () =>
        Array(N).fill(""),
      );
      for (const [r, c] of kings) {
        newSol[r][c] = "king";
        if (use3x3) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr,
                nc = c + dc;
              if (
                nr >= 0 &&
                nr < N &&
                nc >= 0 &&
                nc < N &&
                newSol[nr][nc] === ""
              )
                newSol[nr][nc] = "territory";
            }
        }
        for (let i = 0; i < N; i++) {
          if (newSol[r][i] === "") newSol[r][i] = "blocked";
          if (newSol[i][c] === "") newSol[i][c] = "blocked";
        }
      }

      setSolution(newSol);
      setHasSolution(true);
      setStatus({ type: "ok", msg: `✓ Solved! ${kings.length} kings placed` });
      setSolveLog(`${calls} states explored · ${ms}ms`);
      setWinDetail(
        `${N}×${N} grid · ${use3x3 ? "3×3 territory" : "no territory"} · ${calls} states · ${ms}ms`,
      );
      setShowWin(true);
    }, 30);
  }

  function fillFlood() {
    let nextReg = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] !== -1) nextReg = Math.max(nextReg, grid[r][c] + 1);
    const newGrid = grid.map((row) => [...row]);
    const visited = Array.from({ length: N }, () => Array(N).fill(false));
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (newGrid[r][c] === -1 && !visited[r][c]) {
          const fill = nextReg++;
          const q: number[][] = [[r, c]];
          visited[r][c] = true;
          while (q.length) {
            const [cr, cc] = q.shift()!;
            newGrid[cr][cc] = fill;
            for (const [dr, dc] of [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ] as number[][]) {
              const nr = cr + dr,
                nc = cc + dc;
              if (
                nr >= 0 &&
                nr < N &&
                nc >= 0 &&
                nc < N &&
                newGrid[nr][nc] === -1 &&
                !visited[nr][nc]
              ) {
                visited[nr][nc] = true;
                q.push([nr, nc]);
              }
            }
          }
        }
      }
    setGrid(newGrid);
  }

  function loadExample() {
    const n = 7;
    setN(n);
    setSizeInput(n);
    setGrid(EXAMPLE_GRID.map((r) => [...r]));
    setSolution(Array.from({ length: n }, () => Array(n).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setStatus({ type: "ok", msg: "7×7 example loaded — click Solve!" });
    setSolveLog("");
  }

  function exportJSON() {
    setExportText(JSON.stringify({ size: N, regions: grid }, null, 2));
  }
  function copyCode() {
    const rows = grid.map((r) => "[" + r.join(",") + "]").join(",\n  ");
    const code = `regions: [\n  ${rows}\n]`;
    navigator.clipboard.writeText(code).catch(() => {});
    setExportText(code);
  }

  const statusStyle = STATUS_STYLE[status.type];
  const cellPx = Math.max(32, Math.min(58, Math.floor(520 / N)));
  const maxR = Math.min(N, 12);

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4 gap-5"
      style={{ background: "#0f0e0d", color: "#e8dcc8" }}
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div
            className="h-px w-16"
            style={{
              background:
                "linear-gradient(to right,transparent,rgba(212,152,15,0.4))",
            }}
          />
          <h1
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#e4b43a",
              letterSpacing: "0.1em",
            }}
          >
            ♛ KINGS SOLVER
          </h1>
          <div
            className="h-px w-16"
            style={{
              background:
                "linear-gradient(to left,transparent,rgba(212,152,15,0.4))",
            }}
          />
        </div>
        <p
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            color: "rgba(200,168,64,0.45)",
          }}
        >
          DESIGN · PAINT · SOLVE
        </p>
      </div>

      {/* Step 1 */}
      <div
        className="w-full max-w-xl p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          STEP 1 — SET GRID SIZE
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label
              style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.6)" }}
            >
              Size
            </label>
            <input
              type="range"
              min={3}
              max={12}
              value={sizeInput}
              step={1}
              style={{ width: 120, accentColor: "#d4980f" }}
              onChange={(e) => setSizeInput(+e.target.value)}
            />
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#e4b43a",
                minWidth: 28,
              }}
            >
              {sizeInput}
            </span>
            <span
              style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.4)" }}
            >
              × {sizeInput}
            </span>
          </div>
          <button
            onClick={() => {
              setN(sizeInput);
              buildGrid(sizeInput);
            }}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.7)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.22)",
              color: "#e4b43a",
              cursor: "pointer",
            }}
          >
            Build Grid
          </button>
          <button
            onClick={loadExample}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.35)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              cursor: "pointer",
            }}
          >
            Load Example
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div
        className="w-full max-w-xl p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          STEP 2 — PAINT REGIONS
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.5)" }}>
            Active region:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: maxR }, (_, i) => (
              <div
                key={i}
                onClick={() => setActiveRegion(i)}
                title={`Region ${i + 1}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "transform 0.1s",
                  background: REGION_FILL_SOLVER[i],
                  border: `2px solid ${i === activeRegion ? "#d4980f" : REGION_BORDER_SOLVER[i]}`,
                  transform: i === activeRegion ? "scale(1.12)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            {
              label: "Clear all",
              fn: () => {
                setGrid(Array.from({ length: N }, () => Array(N).fill(-1)));
                clearSolution();
              },
            },
            { label: "Auto-fill unassigned", fn: fillFlood },
            {
              label: "Reset grid",
              fn: () => buildGrid(N, false),
              danger: true,
            },
          ].map(({ label, fn, danger }) => (
            <button
              key={label}
              onClick={fn}
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                padding: "7px 18px",
                border: `1px solid ${danger ? "rgba(180,60,60,0.5)" : "rgba(212,152,15,0.35)"}`,
                borderRadius: "2px",
                background: danger
                  ? "rgba(180,60,60,0.08)"
                  : "rgba(212,152,15,0.07)",
                color: danger ? "#e07070" : "#c8a840",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="mt-2"
          style={{ fontSize: "0.7rem", color: "rgba(200,168,64,0.35)" }}
        >
          Click or drag to paint · Right-click to erase · Each region = 1 king
        </div>
      </div>

      {/* Board */}
      <div
        className="p-2 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(212,152,15,0.2)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${N},${cellPx}px)`,
            userSelect: "none",
          }}
          onMouseDown={() => setPainting(true)}
        >
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const reg = grid[r]?.[c];
              const b =
                reg !== undefined && reg !== -1
                  ? getRegionBordersForCell(r, c, grid)
                  : null;
              const sol = solution[r]?.[c];
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellPx,
                    height: cellPx,
                    background:
                      reg === -1 || reg === undefined
                        ? "#161412"
                        : REGION_FILL_SOLVER[reg % 12],
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderTop: b?.top
                      ? "2.5px solid rgba(212,152,15,0.6)"
                      : undefined,
                    borderBottom: b?.bottom
                      ? "2.5px solid rgba(212,152,15,0.6)"
                      : undefined,
                    borderLeft: b?.left
                      ? "2.5px solid rgba(212,152,15,0.6)"
                      : undefined,
                    borderRight: b?.right
                      ? "2.5px solid rgba(212,152,15,0.6)"
                      : undefined,
                    cursor: "crosshair",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (e.button === 2) {
                      setErasing(true);
                      eraseCell(r, c);
                    } else {
                      setPainting(true);
                      paintCell(r, c);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (erasing && e.buttons) {
                      eraseCell(r, c);
                    } else if (painting && e.buttons === 1) {
                      paintCell(r, c);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    eraseCell(r, c);
                  }}
                >
                  {sol === "territory" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(212,152,15,0.08)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {sol === "king" && (
                    <span
                      style={{
                        fontSize: "1.35rem",
                        color: "#d4980f",
                        filter: "drop-shadow(0 0 5px rgba(212,152,15,0.9))",
                      }}
                    >
                      ♛
                    </span>
                  )}
                  {sol === "blocked" && (
                    <span
                      style={{
                        fontSize: "1.5rem",
                        color: "rgba(255,255,255,0.18)",
                      }}
                    >
                      ·
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            padding: "4px 12px",
            borderRadius: "2px",
            border: `1px solid ${statusStyle.border}`,
            background: statusStyle.bg,
            color: statusStyle.color,
          }}
        >
          {status.msg}
        </div>
        {showWin && (
          <div
            className="text-center px-6 py-2 rounded-sm"
            style={{
              background: "rgba(212,152,15,0.12)",
              border: "1px solid rgba(212,152,15,0.4)",
            }}
          >
            <div
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.875rem",
                color: "#e4b43a",
              }}
            >
              ⚜ SOLUTION FOUND ⚜
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                marginTop: 2,
                color: "rgba(200,168,64,0.6)",
              }}
            >
              {winDetail}
            </div>
          </div>
        )}
        {solveLog && (
          <div
            style={{
              fontSize: "0.68rem",
              color: "rgba(200,168,64,0.55)",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            {solveLog}
          </div>
        )}
      </div>

      {/* Step 3 */}
      <div
        className="w-full max-w-xl p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          STEP 3 — SOLVE
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={solve}
            disabled={solving}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.7)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.22)",
              color: "#e4b43a",
              cursor: solving ? "not-allowed" : "pointer",
              opacity: solving ? 0.5 : 1,
            }}
          >
            {solving ? "Solving…" : "♛ Solve puzzle"}
          </button>
          <button
            onClick={clearSolution}
            disabled={!hasSolution}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.35)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              cursor: !hasSolution ? "not-allowed" : "pointer",
              opacity: !hasSolution ? 0.35 : 1,
            }}
          >
            Clear solution
          </button>
          <button
            onClick={validateRegions}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.35)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              cursor: "pointer",
            }}
          >
            Validate regions
          </button>
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.6)" }}
          >
            <input
              type="checkbox"
              checked={use3x3}
              onChange={(e) => setUse3x3(e.target.checked)}
              style={{ accentColor: "#d4980f" }}
            />
            3×3 territory rule
          </label>
        </div>
        <div
          className="mt-3"
          style={{ fontSize: "0.72rem", color: "rgba(200,168,64,0.35)" }}
        >
          Rules: 1 king per region · 1 per row · 1 per column · no adjacency
          (3×3 when checked)
        </div>
      </div>

      {/* Export */}
      <div
        className="w-full max-w-xl p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          EXPORT
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportJSON}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.35)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              cursor: "pointer",
            }}
          >
            Export JSON
          </button>
          <button
            onClick={copyCode}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              padding: "7px 18px",
              border: "1px solid rgba(212,152,15,0.35)",
              borderRadius: "2px",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              cursor: "pointer",
            }}
          >
            Copy region array
          </button>
        </div>
        {exportText && (
          <pre
            className="mt-2 text-xs p-2 rounded overflow-x-auto"
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "#9090cc",
              border: "0.5px solid rgba(100,100,200,0.2)",
              maxHeight: 120,
              fontSize: "0.68rem",
            }}
          >
            {exportText}
          </pre>
        )}
      </div>
    </div>
  );
}
