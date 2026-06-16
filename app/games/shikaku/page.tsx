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
import { SolverStatusBar } from "@/shared/components/ui/primitive";
import { colorId, formatTime } from "@/shared/components/ui/tokens";

// shikaku-specific
import ShikakuGrid from "@/games/shikaku/components/ShikakuGrid";

import LogoIcon from "@/games/shikaku/components/Logo";
import {
  SHIKAKU_TIERS,
  ShikakuParams,
  shikakuParamsGenerator,
} from "@/games/shikaku/lib/difficulty";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";
import {
  ShikakuProvider,
  useShikaku,
} from "@/games/shikaku/components/ShikakuContext";
import { ColorType, GeneratorMode } from "@/shared/types";
// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function ShikakuGame() {
  const ctx = useShikaku();

  const params: ShikakuParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return shikakuParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return shikakuParamsGenerator.byLevel(ctx.generator.level.value);
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
    return ctx.board.playState.value.filter((r) => r.validAnchor);
  }, [ctx.board.playState]);

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: "⚙",
      color: `hsla(${colorId(0).bg})` as ColorType,
      disabled:
        (!ctx.board.puzzle.value &&
          !ctx.board.customPuzzle.value &&
          !ctx.solver.solution.value) ||
        ctx.solver.status.value === "solving" ||
        ctx.solver.isVisible.value ||
        (ctx.solver.solution.value
          ? ctx.solver.solution?.value.length > 1
          : false),
      onClick: ctx.autoSolve,
    },
    {
      label: ctx.solver.isVisible.value ? "Hide Solution" : "Show Solution",
      icon: ctx.solver.isVisible.value ? "◎" : "◉",
      color: `hsla(${colorId(1).bg})` as ColorType,
      disabled: !ctx.solver.solution.value,
      hidden: !ctx.solver.solution.value,
      onClick: ctx.solver.toggleVisibility,
    },
    {
      label: "Clear Board",
      icon: "⌫",
      color: `hsla(${colorId(2).bg})` as ColorType,
      disabled: !ctx.board.puzzle.value && !ctx.board.customPuzzle,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: "↺",
      color: `hsla(${colorId(3).bg})` as ColorType,
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.customPuzzle) ||
        ctx.generator.isSolver,
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
    ctx.generator.puzzleMode.setValue("Solver");

    ctx.board.puzzle.setValue(null);
    ctx.board.customPuzzle.setValue(blankBoard);
    ctx.resetGame();
  };

  const handleGenerateBoard = () => {
    ctx.generator.puzzleMode.setValue("Generator");
    ctx.board.customPuzzle.setValue(null);
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
      onNext={ctx.loadNextPuzzle}
      // ===============================================================================
      inforPanel={
        <SolverStatusBar
          status={ctx.solver.status.value}
          message={
            ctx.solver.status.value === "solving"
              ? "Running backtracking solver…"
              : ctx.solver.status.value === "done"
                ? `Solution found — ${ctx.solver.solution.value?.length ?? 0} rectangles`
                : ctx.solver.status.value === "error"
                  ? !ctx.solver.solution.value
                    ? "Invalid grid setup or no solution found"
                    : "No solution found"
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
          mode={ctx.generator.puzzleMode}
        />
      }
      // ===============================================================================
      centerPanel={<ShikakuGrid />}
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
