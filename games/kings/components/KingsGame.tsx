"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CellState, HistoryEntry } from "@/games/kings/core/types";
import { getRegionBorders, formatTime } from "@/games/kings/core/utils";
import { ControlButton } from "@/games/kings/components/Button";

// Module-level map — avoids "cannot access ref during render" lint error
const pendingClicks = new Map<string, ReturnType<typeof setTimeout>>();

const PUZZLES: Record<
  string,
  { label: string; size: number; regions: number[][] }
> = {
  easy: {
    label: "EASY · 5×5",
    size: 5,
    regions: [
      [0, 0, 1, 1, 1],
      [0, 0, 1, 2, 2],
      [0, 3, 3, 2, 2],
      [4, 3, 3, 3, 2],
      [4, 4, 4, 3, 2],
    ],
  },
  medium: {
    label: "MEDIUM · 7×7",
    size: 7,
    regions: [
      [0, 0, 0, 1, 1, 1, 1],
      [0, 0, 2, 2, 1, 1, 1],
      [0, 2, 2, 3, 3, 1, 4],
      [5, 2, 3, 3, 4, 4, 4],
      [5, 5, 3, 6, 4, 4, 4],
      [5, 5, 6, 6, 6, 4, 4],
      [5, 5, 6, 6, 6, 6, 6],
    ],
  },
  hard: {
    label: "HARD · 9×9",
    size: 9,
    regions: [
      [0, 0, 0, 1, 1, 1, 2, 2, 2],
      [0, 0, 3, 3, 1, 2, 2, 2, 2],
      [0, 3, 3, 3, 4, 4, 2, 5, 2],
      [6, 3, 3, 4, 4, 5, 5, 5, 5],
      [6, 6, 3, 4, 4, 5, 5, 7, 5],
      [6, 6, 8, 8, 4, 5, 7, 7, 7],
      [6, 8, 8, 8, 8, 7, 7, 7, 7],
      [6, 8, 8, 8, 8, 7, 7, 7, 7],
      [6, 6, 8, 8, 8, 7, 7, 7, 7],
    ],
  },
};

const REG_COLORS = [
  "#1e2a1e",
  "#1e1e2a",
  "#2a1e1e",
  "#2a241a",
  "#1a2426",
  "#26201a",
  "#22192a",
  "#191f26",
  "#26191e",
];

export default function KingsGame() {
  const [diff, setDiff] = useState("easy");
  const [N, setN] = useState(5);
  const [regions, setRegions] = useState(PUZZLES.easy.regions);
  const [cellStates, setCellStates] = useState<CellState[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(0) as CellState[]),
  );
  const [autoMarked, setAutoMarked] = useState<boolean[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(false)),
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback((d: string) => {
    const p = PUZZLES[d];
    const n = p.size;
    setDiff(d);
    setN(n);
    setRegions(p.regions);
    setCellStates(
      Array.from({ length: n }, () => Array(n).fill(0) as CellState[]),
    );
    setAutoMarked(Array.from({ length: n }, () => Array(n).fill(false)));
    setHistory([]);
    setWon(false);
    setElapsed(0);
    setRunning(true);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  // timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  function hasConflict(
    states: CellState[][],
    r: number,
    c: number,
    regs: number[][],
    n: number,
  ): boolean {
    const reg = regs[r][c];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === r && j === c) continue;
        if (states[i][j] === 2) {
          if (i === r || j === c || regs[i][j] === reg) return true;
          if (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1) return true;
        }
      }
    return false;
  }

  function recalcAuto(
    states: CellState[][],
    regs: number[][],
    n: number,
  ): boolean[][] {
    const auto = Array.from({ length: n }, () => Array(n).fill(false));
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (states[r][c] === 2) {
          const reg = regs[r][c];
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
              if (states[i][j] !== 2) {
                if (
                  i === r ||
                  j === c ||
                  regs[i][j] === reg ||
                  (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1)
                )
                  auto[i][j] = true;
              }
            }
        }
      }
    return auto;
  }

  function checkWin(
    states: CellState[][],
    regs: number[][],
    n: number,
  ): boolean {
    const numRegs = new Set(regs.flat()).size;
    const kings: [number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (states[r][c] === 2) kings.push([r, c]);
    if (kings.length !== numRegs) return false;
    for (const [r, c] of kings)
      if (hasConflict(states, r, c, regs, n)) return false;
    return true;
  }

  function placeKing(r: number, c: number) {
    setCellStates((prev) => {
      const next = prev.map((row) => [...row] as CellState[]);
      setHistory((h) => [
        ...h.slice(-59),
        {
          states: prev.map((row) => [...row] as CellState[]),
          auto: autoMarked.map((row) => [...row]),
        },
      ]);
      next[r][c] = 2;
      const newAuto = recalcAuto(next, regions, N);
      setAutoMarked(newAuto);
      if (checkWin(next, regions, N)) {
        setWon(true);
        setRunning(false);
      }
      return next;
    });
  }

  function handleLeftClick(r: number, c: number) {
    if (autoMarked[r][c] && cellStates[r][c] === 0) return;
    const cur = cellStates[r][c];
    if (cur === 2 || cur === 1) {
      setHistory((h) => [
        ...h.slice(-59),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          auto: autoMarked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const next = prev.map((row) => [...row] as CellState[]);
        next[r][c] = 0;
        setAutoMarked(recalcAuto(next, regions, N));
        return next;
      });
      return;
    }
    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.set(
      key,
      setTimeout(() => {
        pendingClicks.delete(key);
        setCellStates((prev) => {
          if (prev[r][c] !== 0) return prev;
          setHistory((h) => [
            ...h.slice(-59),
            {
              states: prev.map((row) => [...row] as CellState[]),
              auto: autoMarked.map((row) => [...row]),
            },
          ]);
          const next = prev.map((row) => [...row] as CellState[]);
          next[r][c] = 1;
          return next;
        });
      }, 220),
    );
  }

  function handleDblClick(r: number, c: number) {
    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.delete(key);
    if (autoMarked[r][c] && cellStates[r][c] === 0) return;
    if (cellStates[r][c] === 2) {
      setHistory((h) => [
        ...h.slice(-59),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          auto: autoMarked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const next = prev.map((row) => [...row] as CellState[]);
        next[r][c] = 0;
        setAutoMarked(recalcAuto(next, regions, N));
        return next;
      });
      return;
    }
    if (cellStates[r][c] === 1) {
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        return n;
      });
    }
    placeKing(r, c);
  }

  function handleRightClick(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (autoMarked[r][c] && cellStates[r][c] === 0) return;
    if (cellStates[r][c] === 2) {
      setHistory((h) => [
        ...h.slice(-59),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          auto: autoMarked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const next = prev.map((row) => [...row] as CellState[]);
        next[r][c] = 0;
        setAutoMarked(recalcAuto(next, regions, N));
        return next;
      });
      return;
    }
    if (cellStates[r][c] === 1) {
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        return n;
      });
    }
    placeKing(r, c);
  }

  function undoLast() {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCellStates(snap.states.map((row) => [...row] as CellState[]));
    setAutoMarked(snap.auto.map((row) => [...row]));
  }

  function clearMarks() {
    setHistory((h) => [
      ...h.slice(-59),
      {
        states: cellStates.map((row) => [...row] as CellState[]),
        auto: autoMarked.map((row) => [...row]),
      },
    ]);
    setCellStates((prev) =>
      prev.map((row) => row.map((v) => (v === 1 ? 0 : v)) as CellState[]),
    );
  }

  const numRegs = new Set(regions.flat()).size;
  const numKings = cellStates.flat().filter((v) => v === 2).length;
  const hasAnyConflict = cellStates.some((row, r) =>
    row.some((v, c) => v === 2 && hasConflict(cellStates, r, c, regions, N)),
  );

  // build territory map
  const territory = Array.from({ length: N }, () => Array(N).fill(false));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (cellStates[r]?.[c] === 2) {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr,
              nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N)
              territory[nr][nc] = true;
          }
      }
    }

  const cellPx = N <= 5 ? 58 : N <= 7 ? 50 : 44;

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4"
      style={{
        background:
          "linear-gradient(135deg,#1a1814 0%,#0f0e0d 50%,#161410 100%)",
        color: "#e8dcc8",
      }}
    >
      {/* Header */}
      <div className="w-full max-w-lg mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(to right,transparent,rgba(212,152,15,0.4))",
            }}
          />
          <h1
            style={{
              fontFamily: "'Cinzel',serif",
              letterSpacing: "0.12em",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#e4b43a",
            }}
          >
            ♛ KINGS
          </h1>
          <div
            className="h-px flex-1"
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
            letterSpacing: "0.15em",
            color: "rgba(200,168,64,0.45)",
          }}
        >
          PLACE ONE KING PER REGION · ROW · COLUMN
        </p>
      </div>

      {/* Difficulty */}
      <div className="flex gap-2 mb-5">
        {Object.entries(PUZZLES).map(([key, p]) => (
          <button
            key={key}
            onClick={() => initBoard(key)}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              padding: "4px 14px",
              borderRadius: "999px",
              cursor: "pointer",
              transition: "all 0.2s",
              border:
                diff === key
                  ? "1px solid rgba(212,152,15,0.6)"
                  : "1px solid rgba(212,152,15,0.2)",
              background:
                diff === key ? "rgba(212,152,15,0.15)" : "transparent",
              color: diff === key ? "#d4980f" : "#7a6840",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-4">
        <span
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.72rem",
            padding: "3px 10px",
            borderRadius: "2px",
            border: "1px solid rgba(212,152,15,0.25)",
            background: "rgba(212,152,15,0.1)",
            color: "#e4b43a",
          }}
        >
          {numKings} / {numRegs} kings
        </span>
        {numKings > 0 && (
          <span
            style={{
              fontSize: "0.72rem",
              padding: "3px 10px",
              borderRadius: "2px",
              border: `1px solid ${hasAnyConflict ? "rgba(220,80,80,0.4)" : "rgba(40,180,80,0.4)"}`,
              background: hasAnyConflict
                ? "rgba(180,50,50,0.15)"
                : "rgba(40,120,60,0.15)",
              color: hasAnyConflict ? "#e07070" : "#6fcf97",
            }}
          >
            {hasAnyConflict ? "⚠ Conflict" : "✓ Clear"}
          </span>
        )}
        <span
          style={{
            fontSize: "0.72rem",
            padding: "3px 10px",
            borderRadius: "2px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#888",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Board */}
      <div
        className="mb-5 p-1.5 rounded-sm"
        style={{
          border: "1px solid rgba(212,152,15,0.2)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${N},${cellPx}px)`,
          }}
        >
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              if (!cellStates[r]) return null;
              const reg = regions[r][c];
              const borders = getRegionBorders(regions, r, c, N);
              const st = cellStates[r][c];
              const isAuto = autoMarked[r]?.[c] && st === 0;
              const inTerritory = territory[r]?.[c];
              const isKing = st === 2;
              const isMark = st === 1;
              const conflict =
                isKing && hasConflict(cellStates, r, c, regions, N);
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleLeftClick(r, c)}
                  onDoubleClick={() => handleDblClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  style={{
                    width: cellPx,
                    height: cellPx,
                    background: conflict ? "#2a1414" : REG_COLORS[reg % 9],
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderTop: borders.top
                      ? "2px solid rgba(212,152,15,0.55)"
                      : undefined,
                    borderBottom: borders.bottom
                      ? "2px solid rgba(212,152,15,0.55)"
                      : undefined,
                    borderLeft: borders.left
                      ? "2px solid rgba(212,152,15,0.55)"
                      : undefined,
                    borderRight: borders.right
                      ? "2px solid rgba(212,152,15,0.55)"
                      : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isAuto ? "default" : "pointer",
                    opacity: isAuto ? 0.45 : 1,
                    position: "relative",
                    userSelect: "none",
                    transition: "filter 0.12s",
                    outline:
                      inTerritory && !isKing && !isAuto
                        ? "1px solid rgba(212,152,15,0.18)"
                        : undefined,
                  }}
                >
                  {/* territory overlay */}
                  {inTerritory && !isKing && !isAuto && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(212,152,15,0.07)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {isAuto && (
                    <span
                      style={{
                        fontSize: "1.6rem",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      ·
                    </span>
                  )}
                  {isMark && (
                    <span
                      style={{
                        fontSize: "1rem",
                        color: "rgba(232,220,200,0.35)",
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </span>
                  )}
                  {isKing && (
                    <span
                      style={{
                        fontSize: "1.5rem",
                        color: "#d4980f",
                        filter: conflict
                          ? "none"
                          : "drop-shadow(0 0 6px rgba(212,152,15,0.8))",
                      }}
                    >
                      ♛
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Win banner */}
      {won && (
        <div
          className="mb-4 px-6 py-3 text-center rounded-sm"
          style={{
            border: "1px solid rgba(212,152,15,0.5)",
            background: "rgba(212,152,15,0.1)",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel',serif",
              color: "#e4b43a",
              fontSize: "0.875rem",
              letterSpacing: "0.1em",
            }}
          >
            ⚜ PUZZLE SOLVED ⚜
          </div>
          <div style={{ color: "#888", fontSize: "0.75rem", marginTop: "4px" }}>
            Solved in {formatTime(elapsed)}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        <ControlButton label="↺ Reset" onClick={() => initBoard(diff)} />
        <ControlButton label="Clear marks" onClick={clearMarks} />
        <ControlButton
          label="↩ Undo"
          onClick={undoLast}
          disabled={!history.length}
        />
      </div>

      {/* Tips */}
      <div
        className="w-full max-w-md rounded-sm p-4"
        style={{
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.4)",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          HOW TO PLAY
        </div>
        <div className="space-y-2">
          {[
            {
              dot: "#555",
              text: (
                <>
                  <span style={{ color: "#e8dcc8" }}>Left click ×1</span> —
                  pasang tanda ×
                </>
              ),
            },
            {
              dot: "#d4980f",
              text: (
                <>
                  <span style={{ color: "#e8dcc8" }}>Klik kanan</span> atau{" "}
                  <span style={{ color: "#e8dcc8" }}>double klik</span> — taruh
                  King ♛
                </>
              ),
            },
            {
              dot: "#333",
              text: (
                <>
                  <span style={{ color: "#e8dcc8" }}>Klik lagi</span> — hapus
                  (King / mark)
                </>
              ),
            },
            {
              dot: "#1e2a1e",
              border: "1px solid rgba(212,152,15,0.4)",
              text: (
                <>
                  Tiap{" "}
                  <span style={{ color: "#e8dcc8" }}>warna = 1 region</span> —
                  hanya boleh 1 King per region, baris, kolom
                </>
              ),
            },
            {
              dot: "rgba(212,152,15,0.3)",
              border: "1px solid rgba(212,152,15,0.5)",
              text: (
                <>
                  <span style={{ color: "#e8dcc8" }}>
                    Area 3×3 di sekitar King
                  </span>{" "}
                  — teritori eksklusif
                </>
              ),
            },
          ].map(({ dot, border, text }, i) => (
            <div
              key={i}
              className="flex items-start gap-2"
              style={{ fontSize: "0.75rem", color: "#888" }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dot,
                  border,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
