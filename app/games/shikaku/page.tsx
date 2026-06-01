"use client";

import { useState, useMemo } from "react";

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
import LogoIcon from "@/games/shikaku/components/Logo";
import {
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  levelToTierIdx,
  SHIKAKU_TIERS,
  ShikakuParams,
} from "@/games/shikaku/lib/difficulty";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";
import {
  ShikakuBoardProvider,
  useShikakuBoardCtx,
} from "@/games/shikaku/components/ShikakuBoardContext";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function ShikakuGame() {
  const {
    puzzle,
    elapsedTime,
    mode,
    setMode,
    tierIdx,
    setTierIdx,
    seed,
    setSeed,
    level: currentLevel,
    setLevel: setCurrentLevel,
    isSolutionVisible,
    solverSolution,
    ...ctx
  } = useShikakuBoardCtx();

  const [solverStatus, setSolverStatus] = useState<
    null | "solving" | "done" | "error"
  >(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tier = SHIKAKU_TIERS[tierIdx];

  function resetGame(p: ShikakuPuzzle) {
    ctx.setPuzzle(p);
    ctx.setuserRects([]);
    ctx.setIsSolutionVisible(false);
    ctx.setSolverSolution(null);
    setSolverStatus(null);
    ctx.resetTimer();
  }

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
  const validRect = useMemo(() => {
    return ctx.userRects.filter((r) => r.validAnchor);
  }, [ctx.userRects]);

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

  // ── Solver ────────────────────────────────────────────────────────────────
  function handleAutoSolve() {
    if (!puzzle) return;
    setSolverStatus("solving");
    setTimeout(() => {
      try {
        const result = solveShikaku(puzzle.width, puzzle.height, puzzle.infos);
        ctx.setSolverSolution(result);
        setSolverStatus(result ? "done" : "error");
      } catch {
        setSolverStatus("error");
      }
    }, 60);
  }

  function handleToggleSolution() {
    ctx.setIsSolutionVisible((s) => !s);
  }

  function handleClear() {
    ctx.setuserRects([]);
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
        isSolutionVisible ||
        (solverSolution ? solverSolution?.length > 1 : false),
      onClick: handleAutoSolve,
    },
    {
      label: isSolutionVisible ? "Hide Solution" : "Show Solution",
      icon: isSolutionVisible ? "◎" : "◉",
      color: T.cyan,
      disabled: !solverSolution,
      hidden: !solverSolution,
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
      value: puzzle ? `${validRect.length}/${puzzle.infos.length}` : "—",
    },
    {
      label: "Time",
      value: formatTime(elapsedTime),
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
      elapsed={elapsedTime}
      placedCount={validRect.length}
      totalCount={puzzle ? puzzle.infos.length : 0}
      isSolved={ctx.isComplete}
      // ===============================================================================
      inforPanel={
        <SolverStatusBar
          status={solverStatus}
          message={
            solverStatus === "solving"
              ? "Running backtracking solver…"
              : solverStatus === "done"
                ? `Solution found — ${solverSolution?.length} rectangles`
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
            show={ctx.isComplete}
            timeLabel={formatTime(elapsedTime)}
            onNext={handleNext}
          />

          <ShikakuGrid />
        </>
      }
      // ===============================================================================
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={validRect.length}
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

export default function ShikakuGamePage() {
  return (
    <ShikakuBoardProvider>
      <ShikakuGame />
    </ShikakuBoardProvider>
  );
}
