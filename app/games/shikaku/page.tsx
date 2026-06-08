"use client";

import { useEffect, useMemo } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import { ParamItem } from "@/shared/components/ui/GeneratorPanel";
import {
  ActionDef,
  StatItem,
  SolverPanel,
  SolverGeneratorParamConfig,
  ParamValues,
} from "@/shared/components/ui/SolverPanel";
import { SolveBanner, SolverStatusBar } from "@/shared/components/ui/primitive";
import { T, formatTime } from "@/shared/components/ui/tokens";

// shikaku-specific
import ShikakuGrid from "@/games/shikaku/components/ShikakuGrid";

import LogoIcon from "@/games/shikaku/components/Logo";
import {
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  SHIKAKU_TIERS,
  ShikakuParams,
} from "@/games/shikaku/lib/difficulty";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";
import {
  ShikakuProvider,
  useShikaku,
} from "@/games/shikaku/components/ShikakuContext";
import { GeneratorMode } from "@/shared/types";
// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function ShikakuGame() {
  const ctx = useShikaku();

  const params: ShikakuParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return getShikakuParamsByTierIdx(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return getShikakuParamsByLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

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
    return ctx.board.userRects.value.filter((r) => r.validAnchor);
  }, [ctx.board.userRects]);

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: "⚙",
      color: "#a78bfa",
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.solverPuzzle.value) ||
        ctx.solverStatus.value === "solving" ||
        ctx.board.isSolutionVisible.value ||
        (ctx.board.solverSolution.value
          ? ctx.board.solverSolution?.value.length > 1
          : false),
      onClick: ctx.autoSolve,
    },
    {
      label: ctx.board.isSolutionVisible.value
        ? "Hide Solution"
        : "Show Solution",
      icon: ctx.board.isSolutionVisible.value ? "◎" : "◉",
      color: T.cyan,
      disabled: !ctx.board.solverSolution.value,
      hidden: !ctx.board.solverSolution.value,
      onClick: ctx.toggleSolution,
    },
    {
      label: "Clear Board",
      icon: "⌫",
      color: T.text2,
      disabled: !ctx.board.puzzle.value && !ctx.board.solverPuzzle,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: "↺",
      color: T.green,
      disabled: !ctx.board.puzzle.value && !ctx.board.solverPuzzle,
      onClick: ctx.loadNextPuzzle,
    },
  ];

  const solverBoardParams: SolverGeneratorParamConfig[] = [
    {
      key: "cols",
      label: "Width",
      type: "number",
      defaultValue: 10,
      min: 2,
      max: 30,
    },
    {
      key: "rows",
      label: "Height",
      type: "number",
      defaultValue: 12,
      min: 2,
      max: 30,
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: StatItem[] = [
    {
      label: "Board",
      value: ctx.board.puzzle.value
        ? `${ctx.board.puzzle.value.width}×${ctx.board.puzzle.value.height}`
        : "—",
    },
    {
      label: "Regions",
      value: ctx.board.puzzle.value ? ctx.board.puzzle.value.rectCount : "—",
    },
    {
      label: "Placed",
      value: ctx.board.puzzle.value
        ? `${validRect.length}/${ctx.board.puzzle.value.infos.length}`
        : "—",
    },
    {
      label: "Time",
      value: formatTime(ctx.timer.elapsedTime),
    },
  ];

  const handleGenerateSolverBoard = (params: ParamValues) => {
    const blankBoard = {
      width: params.cols as number,
      height: params.rows as number,
    };
    ctx.board.puzzle.setValue(null);
    ctx.board.solverPuzzle.setValue(blankBoard);
    ctx.resetGame();
  };

  const handleGenerateBoard = () => {
    ctx.board.solverPuzzle.setValue(null);
    ctx.generatePuzzle();
  };

  return (
    <GameShell
      gameName="SHIKAKU"
      logoIcon={<LogoIcon />}
      accentColor={ctx.board.puzzle.value?.params.tier.color}
      tierLabel={ctx.board.puzzle.value?.params.tier.name}
      tierIcon={ctx.board.puzzle.value?.params.tier.icon}
      seed={ctx.board.puzzle.value?.params.seed}
      elapsed={ctx.timer.elapsedTime}
      placedCount={validRect.length}
      totalCount={ctx.board.puzzle.value?.infos.length ?? 0}
      isSolved={ctx.isComplete}
      // ===============================================================================
      inforPanel={
        <SolverStatusBar
          status={ctx.solverStatus.value}
          message={
            ctx.solverStatus.value === "solving"
              ? "Running backtracking solver…"
              : ctx.solverStatus.value === "done"
                ? `Solution found — ${ctx.board.solverSolution.value?.length} rectangles`
                : ctx.solverStatus.value === "error"
                  ? "No solution found"
                  : ""
          }
        />
      }
      // ===============================================================================
      leftPanel={
        <ToolSelectionPanel
          generator={{
            tiers: SHIKAKU_TIERS,
            tier: ctx.generator.tierIdx,
            seed: ctx.generator.seed,
            onGenerate: handleGenerateBoard,
            mode: ctx.generator.mode,
            level: ctx.generator.level,
          }}
          solver={{
            paramsConfig: solverBoardParams,
            onGenerate: handleGenerateSolverBoard,
          }}
        />
      }
      // ===============================================================================
      centerPanel={
        <>
          <SolveBanner
            show={ctx.isComplete}
            timeLabel={formatTime(ctx.timer.elapsedTime)}
            onNext={ctx.loadNextPuzzle}
          />

          <ShikakuGrid />
        </>
      }
      // ===============================================================================
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={validRect.length}
          totalCount={
            ctx.board.puzzle.value ? ctx.board.puzzle.value.infos.length : 0
          }
          stats={stats}
          actions={solverActions}
        >
          <ParamsPanel params={displayParams} />
        </SolverPanel>
      }
    />
  );
}

export default function ShikakuGamePage() {
  useEffect(() => {
    document.title = "Shikaku Puzzle";
  }, []);
  return (
    <ShikakuProvider>
      <ShikakuGame />
    </ShikakuProvider>
  );
}
