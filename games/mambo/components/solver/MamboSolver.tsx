"use client";

import { useState } from "react";
import type { CellValue, Constraint } from "../../types";
import { solveMambo } from "../../lib/solver";
import { MamboBoard } from "../shared/MamboBoard";

const SUN = "☀";
const MOON = "◑";

export default function MamboSolver() {
  const [size, setSize] = useState(6);
  const [grid, setGrid] = useState<CellValue[][]>(() =>
    Array.from({ length: 6 }, () => Array(6).fill(0) as CellValue[]),
  );
  const [constr, setConstr] = useState<Constraint[]>([]);
  const [solved, setSolved] = useState<CellValue[][] | null | false>(null);

  function resizeGrid(s: number) {
    setSize(s);
    setGrid(Array.from({ length: s }, () => Array(s).fill(0) as CellValue[]));
    setConstr([]);
    setSolved(null);
  }

  function cycleCell(r: number, c: number) {
    const ng = grid.map((row) => [...row]) as CellValue[][];
    ng[r][c] = ((ng[r][c] + 1) % 3) as CellValue;
    setGrid(ng);
    setSolved(null);
  }

  function handleEdgeClick(r1: number, c1: number, r2: number, c2: number) {
    const idx = constr.findIndex(
      (cn) => cn.r1 === r1 && cn.c1 === c1 && cn.r2 === r2 && cn.c2 === c2,
    );
    if (idx === -1) {
      setConstr([...constr, { r1, c1, r2, c2, type: "=" }]);
    } else if (constr[idx].type === "=") {
      const nc = [...constr];
      nc[idx] = { ...nc[idx], type: "x" };
      setConstr(nc);
    } else {
      setConstr(constr.filter((_, i) => i !== idx));
    }
    setSolved(null);
  }

  function handleSolve() {
    const result = solveMambo(grid, constr, size);
    setSolved(result ?? false);
  }

  function handleReset() {
    setGrid(
      Array.from({ length: size }, () => Array(size).fill(0) as CellValue[]),
    );
    setConstr([]);
    setSolved(null);
  }

  const displayGrid = solved && solved !== false ? solved : grid;

  return (
    <div className="flex flex-col items-center gap-3.5 w-full">
      {/* ── Controls ── */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="font-mono text-[0.66rem] text-[#3d3b52] tracking-[0.14em] uppercase">
          Size
        </span>
        {[4, 6, 8, 10].map((s) => (
          <button
            key={s}
            onClick={() => resizeGrid(s)}
            className={`font-mono text-[0.7rem] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
              size === s
                ? "border-[#f5c842] text-[#f5c842] bg-[#1d1b2a]"
                : "border-[#22203a] text-[#4a4860] bg-[#14131e] hover:border-[#32304a] hover:text-[#dddaea]"
            }`}
          >
            {s}×{s}
          </button>
        ))}

        <button
          onClick={handleSolve}
          className="font-['Syne',sans-serif] font-bold text-[0.82rem] px-4 py-1.5 rounded-[10px] border-none bg-linear-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13] cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px"
        >
          ⚡ Solve
        </button>

        <button
          onClick={handleReset}
          className="font-mono text-[0.7rem] font-bold px-3 py-1.5 rounded-lg border border-[#22203a] bg-transparent text-[#4a4860] cursor-pointer transition-all hover:border-[#4a4860] hover:text-[#dddaea]"
        >
          ↺ Reset
        </button>
      </div>

      <p className="font-mono text-[0.66rem] text-[#3a3855] text-center max-w-[480px] leading-[1.65]">
        Click cell → blank → {SUN} → {MOON}. Click gap between cells → add = or
        × (click again to toggle/remove).
      </p>

      <MamboBoard
        grid={displayGrid}
        constraints={constr}
        size={size}
        onCellClick={solved ? null : cycleCell}
        onEdgeClick={solved ? null : handleEdgeClick}
      />

      {solved === false && (
        <p className="font-mono text-[0.78rem] text-red-400">
          ❌ No solution found
        </p>
      )}
      {solved && solved !== false && (
        <p className="font-mono text-[0.78rem] text-green-400">
          ✓ Solution found — Reset to try another
        </p>
      )}
    </div>
  );
}
