"use client";

import { useState, useEffect, useRef } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import DifficultyPicker from "@/shared/components/ui/DifficultyPicker";
import SolverPanel, {
  ActionDef,
  StatItem,
} from "@/shared/components/ui/SolverPanel";
import { SolveBanner, SolverStatusBar } from "@/shared/components/ui/primitive";
import { T, formatTime } from "@/shared/components/ui/tokens";

// shikaku-specific
import ShikakuGrid, { CELL } from "@/games/shikaku/components/ShikakuGrid";
import AnchorList from "@/games/shikaku/components/AnchorList";
import { DIFF_TIERS } from "@/games/kings/lib";
import {
  generateShikakuByTierIdx,
  ShikakuPuzzle,
} from "@/games/shikaku/lib/generator";
import { solveShikaku } from "@/games/shikaku/lib/solver";

//

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Point = {
  x: number;
  y: number;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
};

type DragState = {
  s: Point;
  c: Point;
};

// ─────────────────────────────────────────────────────────────────────────────
// Logo icon
// ─────────────────────────────────────────────────────────────────────────────
const LogoIcon = () => (
  <div className="grid grid-cols-3 grid-rows-3 w-full gap-0 h-full text-black">
    <div className="row-span-2 bg-blue-300 flex items-center justify-center h-2/3">
      2
    </div>

    <div className="col-span-2 row-span-2 bg-green-300 flex items-start justify-start h-2/3">
      4
    </div>

    <div className="col-span-3 bg-yellow-300 flex items-center justify-center h-1/3">
      3
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ShikakuGame() {
  // ── Generator state ───────────────────────────────────────────────────────
  const [tierIdx, setTierIdx] = useState<number>(0);
  const [seed, setSeed] = useState<number>(42);

  // ── Puzzle state ──────────────────────────────────────────────────────────
  const [puzzle, setPuzzle] = useState<ShikakuPuzzle | null>(null);
  const [userRects, setUserRects] = useState<Rect[]>([]);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [dragState, setDragState] = useState<DragState | null>(null);

  // ── Solver state ──────────────────────────────────────────────────────────
  const [showSol, setShowSol] = useState<boolean>(false);
  const [solverResult, setSolverResult] = useState<Rect[] | null>(null);

  const [solverStatus, setSolverStatus] = useState<
    null | "solving" | "done" | "error"
  >(null);

  // ── Timer / completion ────────────────────────────────────────────────────
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (startTime && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isComplete]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const displayRects: Rect[] =
    showSol && solverResult ? solverResult : userRects;

  const placedLabels = new Set(displayRects.map((r) => r.label));

  const tier = DIFF_TIERS[tierIdx];

  function resetGame(p: ShikakuPuzzle) {
    setPuzzle(p);
    setUserRects([]);
    setShowSol(false);
    setSolverResult(null);
    setSolverStatus(null);
    setIsComplete(false);
    setElapsed(0);
    setStartTime(Date.now());
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  function handleGenerate() {
    try {
      resetGame(generateShikakuByTierIdx(tierIdx));
    } catch (e) {
      console.error("Generator error:", e);
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  function cellFromEvent(
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ): Point | null {
    if (!gridRef.current || !puzzle) return null;
    const rect = gridRef.current.getBoundingClientRect();

    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = Math.floor((cx - rect.left) / CELL);
    const y = Math.floor((cy - rect.top) / CELL);

    if (x < 0 || y < 0 || x >= puzzle.width || y >= puzzle.height) {
      return null;
    }

    return { x, y };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    if (!puzzle || isComplete || showSol) return;
    e.preventDefault();
    const c = cellFromEvent(e);
    if (c) setDragState({ s: c, c });
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragState) return;
    e.preventDefault();
    const c = cellFromEvent(e);

    if (c) {
      setDragState((d) => (d ? { ...d, c } : null));
    }
  }

  function onUp(e: React.MouseEvent | React.TouchEvent) {
    if (!dragState || !puzzle) {
      setDragState(null);
      return;
    }

    e.preventDefault();
    const { s, c } = dragState;
    const dr = {
      x: Math.min(s.x, c.x),
      y: Math.min(s.y, c.y),
      w: Math.abs(c.x - s.x) + 1,
      h: Math.abs(c.y - s.y) + 1,
    };

    setDragState(null);

    // Find matching anchor
    const area = dr.w * dr.h;
    const match = puzzle.infos.find(
      (i) =>
        i.area === area &&
        i.anchor.x >= dr.x &&
        i.anchor.x < dr.x + dr.w &&
        i.anchor.y >= dr.y &&
        i.anchor.y < dr.y + dr.h,
    );

    if (!match) return;

    setUserRects((prev) => {
      const filtered = prev.filter((r) => {
        if (r.label === match.label) return false;
        return !(
          r.x < dr.x + dr.w &&
          r.x + r.w > dr.x &&
          r.y < dr.y + dr.h &&
          r.y + r.h > dr.y
        );
      });

      const next: Rect[] = [...filtered, { ...dr, label: match.label }];

      checkCompletion(next, puzzle);
      return next;
    });
  }

  function onLeave() {
    setDragState(null);
  }

  // ── Completion check ──────────────────────────────────────────────────────
  function checkCompletion(rects: Rect[], p: ShikakuPuzzle) {
    if (rects.length !== p.infos.length) return;

    const used = new Uint8Array(p.width * p.height);

    let cov = 0;

    for (const r of rects) {
      const info = p.infos.find((i) => i.label === r.label);

      if (!info || r.w * r.h !== info.area) return;

      const { x: ax, y: ay } = info.anchor;

      if (ax < r.x || ax >= r.x + r.w || ay < r.y || ay >= r.y + r.h) {
        return;
      }

      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          const k = y * p.width + x;

          if (used[k]) return;

          used[k] = 1;
          cov++;
        }
      }
    }

    if (cov === p.width * p.height) {
      setIsComplete(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  // ── Solver ────────────────────────────────────────────────────────────────
  function handleAutoSolve() {
    if (!puzzle) return;

    setSolverStatus("solving");

    setTimeout(() => {
      try {
        const result = solveShikaku(puzzle.width, puzzle.height, puzzle.infos);

        setSolverResult(result);
        setSolverStatus(result ? "done" : "error");
      } catch {
        setSolverStatus("error");
      }
    }, 60);
  }

  function handleToggleSolution() {
    setShowSol((s) => !s);
  }

  function handleClear() {
    setUserRects([]);
    setIsComplete(false);
  }

  function handleRemove(label: string) {
    setUserRects((r) => r.filter((x) => x.label !== label));
  }

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: "⚙",
      color: "#a78bfa",
      disabled: !puzzle || solverStatus === "solving" || showSol,
      onClick: handleAutoSolve,
    },
    {
      label: showSol ? "Hide Solution" : "Show Solution",
      icon: showSol ? "◎" : "◉",
      color: T.cyan,
      disabled: !solverResult,
      hidden: !solverResult,
      onClick: handleToggleSolution,
    },
    {
      label: "Clear Board",
      icon: "⌫",
      color: T.text2,
      disabled: !puzzle,
      onClick: handleClear,
    },
    {
      label: "New Puzzle",
      icon: "↺",
      color: T.green,
      disabled: !puzzle,
      onClick: handleGenerate,
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: StatItem[] = [
    {
      label: "Board",
      value: puzzle ? `${puzzle.width}×${puzzle.height}` : "—",
    },
    {
      label: "Regions",
      value: puzzle ? puzzle.rectCount : "—",
    },
    {
      label: "Placed",
      value: puzzle ? `${placedLabels.size}/${puzzle.infos.length}` : "—",
    },
    {
      label: "Time",
      value: formatTime(elapsed),
    },
  ];

  return (
    <GameShell
      gameName="SHIKAKU"
      logoIcon={<LogoIcon />}
      accentColor={tier.color}
      tierLabel={tier.name}
      tierIcon={tier.icon}
      seed={seed}
      elapsed={elapsed}
      placedCount={placedLabels.size}
      totalCount={puzzle ? puzzle.infos.length : 0}
      isSolved={isComplete}
      leftPanel={
        <DifficultyPicker
          tiers={DIFF_TIERS}
          tierIdx={tierIdx}
          onSelectTier={setTierIdx}
          seed={seed}
          onChangeSeed={setSeed}
          onGenerate={handleGenerate}
        />
      }
      centerPanel={
        <>
          <SolveBanner
            show={isComplete}
            timeLabel={formatTime(elapsed)}
            onNext={handleGenerate}
          />

          <SolverStatusBar
            status={solverStatus}
            message={
              solverStatus === "solving"
                ? "Running backtracking solver…"
                : solverStatus === "done"
                  ? `Solution found — ${solverResult?.length} rectangles`
                  : solverStatus === "error"
                    ? "No solution found"
                    : ""
            }
          />

          <ShikakuGrid
            puzzle={puzzle}
            rects={displayRects}
            dragState={dragState}
            gridRef={gridRef}
            onDown={onDown}
            onMove={onMove}
            onUp={onUp}
            onLeave={onLeave}
            disabled={showSol || isComplete}
          />
        </>
      }
      rightPanel={
        <SolverPanel
          panelLabel="Anchors"
          placedCount={placedLabels.size}
          totalCount={puzzle ? puzzle.infos.length : 0}
          accentColor={isComplete ? T.green : tier.color}
          isSolving={solverStatus === "solving"}
          hasSolution={!!solverResult}
          showSolution={showSol}
          stats={stats}
          actions={solverActions}
        >
          <AnchorList
            infos={puzzle?.infos ?? []}
            placedLabels={placedLabels}
            onRemove={handleRemove}
          />
        </SolverPanel>
      }
    />
  );
}
