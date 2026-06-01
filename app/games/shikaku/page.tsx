"use client";

import { useState, useEffect, useRef, useMemo } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import { ParamItem } from "@/shared/components/ui/GeneratorPanel";
import SolverPanel, {
  ActionDef,
  StatItem,
} from "@/shared/components/ui/SolverPanel";
import { SolveBanner, SolverStatusBar } from "@/shared/components/ui/primitive";
import { T, formatTime } from "@/shared/components/ui/tokens";

// shikaku-specific
import ShikakuGrid from "@/games/shikaku/components/ShikakuGrid";
import {
  generateShikakuByLevel,
  generateShikakuByTierIdx,
  ShikakuPuzzle,
} from "@/games/shikaku/lib/generator";
import { solveShikaku } from "@/games/shikaku/lib/solver";
import {
  checkShikakuAnchor,
  checkShikakuComplete,
} from "@/games/shikaku/lib/validation";
import LogoIcon from "@/games/shikaku/components/Logo";
import { Cell, DragState, Rect, userRect } from "@/games/shikaku/lib/types";
import { overlaps } from "@/games/shikaku/lib/utils";
import {
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  levelToTierIdx,
  SHIKAKU_TIERS,
  ShikakuParams,
} from "@/games/shikaku/lib/difficulty";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ShikakuGame() {
  // ── Generator state ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<"Difficulty" | "Level">("Difficulty");
  const [tierIdx, setTierIdx] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [seed, setSeed] = useState<number>(231198);

  // ── Puzzle state ──────────────────────────────────────────────────────────
  const [puzzle, setPuzzle] = useState<ShikakuPuzzle | null>(null);
  const [userRects, setUserRects] = useState<userRect[]>([]);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [CELL, setCellSize] = useState<number>(50);
  const [attempt, setAttempt] = useState<number>(1);

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
  const placedLabels = new Set(displayRects.map((r) => r.id));
  const tier = SHIKAKU_TIERS[tierIdx];

  function resetGame(p: ShikakuPuzzle) {
    setPuzzle(p);
    setUserRects([]);
    setShowSol(false);
    setSolverResult(null);
    setSolverStatus(null);
    setIsComplete(false);
    setElapsed(0);
    setAttempt(1);
    setStartTime(null);
  }

  // ── Display ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!puzzle) return;

    const container = document.getElementById("game-container");
    if (!container) return;

    const update = () => {
      const padding = 24;
      const containerWidth = container.clientWidth - padding;
      const containerHeight = container.clientHeight - padding;
      const cellFromWidth = Math.floor(containerWidth / puzzle.width);
      const cellFromHeight = Math.floor(containerHeight / puzzle.height);
      const cellSize = Math.max(
        20,
        Math.min(cellFromWidth, cellFromHeight, 50),
      );

      setCellSize(cellSize);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);

    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [puzzle]);

  const params: ShikakuParams | null = useMemo(() => {
    if (mode === "Difficulty") {
      return getShikakuParamsByTierIdx(tierIdx, seed);
    }

    if (mode === "Level") {
      return getShikakuParamsByLevel(currentLevel, seed);
    }

    return null;
  }, [mode, tierIdx, currentLevel, seed]);

  const displayParams = useMemo((): ParamItem[] => {
    if (!params) return [];
    return [
      {
        label: "Width",
        display: params.width,
        pct: params.width / 25,
        color: "#3b82f6",
      },
      {
        label: "Height",
        display: params.height,
        pct: params.height / 25,
        color: "#3b82f6",
      },
      {
        label: "Rect Count",
        display: params.rectCount,
        pct: params.rectCount / 100,
        color: "#22c55e",
      },
      {
        label: "Min Area",
        display: params.minArea,
        pct: 1,
        color: "#f59e0b",
      },
      {
        label: "Compactness",
        display: params.compactness.toFixed(2),
        pct: params.compactness,
        color: "#a855f7",
      },
      {
        label: "Size Variance",
        display: params.sizeVariance.toFixed(2),
        pct: params.sizeVariance,
        color: "#ef4444",
      },
      {
        label: "Anchor Ambiguity",
        display: params.anchorAmbiguity.toFixed(2),
        pct: params.anchorAmbiguity,
        color: "#ef4444",
      },
      {
        label: "Seed",
        display: params.seed,
        pct: 1,
        color: "#6b7280",
      },
    ];
  }, [params]);

  // ── Generate ──────────────────────────────────────────────────────────────
  function handleGenerate(seeded?: number) {
    const actualSeed = seeded ?? seed;
    try {
      const puzzle =
        mode === "Difficulty"
          ? generateShikakuByTierIdx(tierIdx, actualSeed)
          : generateShikakuByLevel(currentLevel, actualSeed);
      resetGame(puzzle);
    } catch (e) {
      console.error("Generator error:", e);
    }
  }

  function handleNext() {
    if (mode === "Level") {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      setTierIdx(levelToTierIdx(nextLevel, SHIKAKU_TIERS.length));
      handleGenerate();
    }
    if (mode === "Difficulty") {
      const newSeed = Math.floor(Math.random() * 999999);
      setSeed(newSeed);
      handleGenerate(newSeed);
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  function cellFromEvent(
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ): Cell | null {
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
    if (!startTime) setStartTime(Date.now());
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
    const dr: Omit<Rect, "id"> = {
      x: Math.min(s.x, c.x),
      y: Math.min(s.y, c.y),
      w: Math.abs(c.x - s.x) + 1,
      h: Math.abs(c.y - s.y) + 1,
    };

    setDragState(null);
    setAttempt((prev) => prev + 1);

    setUserRects((prev) => {
      const next = prev.filter((r) => !overlaps(r, dr));
      const newRect: userRect = { id: `${attempt}`, ...dr };
      newRect.validAnchor = checkShikakuAnchor(newRect, puzzle);

      const merged = dr.w * dr.h !== 1 ? [...next, newRect] : [...next];
      setIsComplete(checkShikakuComplete(merged, puzzle));

      return merged;
    });
  }

  function onLeave() {
    setDragState(null);
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

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: "⚙",
      color: "#a78bfa",
      disabled:
        !puzzle ||
        solverStatus === "solving" ||
        showSol ||
        (solverResult ? solverResult?.length > 1 : false),
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
      onClick: handleNext,
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
      // ===============================================================================
      inforPanel={
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
      }
      // ===============================================================================
      leftPanel={
        <ToolSelectionPanel
          tiers={SHIKAKU_TIERS}
          tierIdx={tierIdx}
          setTier={setTierIdx}
          seed={seed}
          onChangeSeed={setSeed}
          onGenerate={handleGenerate}
          params={displayParams}
          mode={mode}
          setMode={setMode}
          level={currentLevel}
          setLevel={setCurrentLevel}
        />
      }
      // ===============================================================================
      centerPanel={
        <>
          <SolveBanner
            show={isComplete}
            timeLabel={formatTime(elapsed)}
            onNext={handleNext}
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
      // ===============================================================================
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={placedLabels.size}
          totalCount={puzzle ? puzzle.infos.length : 0}
          stats={stats}
          actions={solverActions}
        >
          <ParamsPanel
            seed={seed}
            onChangeSeed={setSeed}
            params={displayParams}
            mode={mode}
          />
        </SolverPanel>
      }
    />
  );
}
