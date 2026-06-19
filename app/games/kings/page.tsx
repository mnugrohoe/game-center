"use client";

import { useMemo } from "react";

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
import { T, colorId, formatTime } from "@/shared/components/ui/tokens";

import LogoIcon from "@/games/kings/components/Logo";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";

import { ColorType, GeneratorMode } from "@/shared/types";
import KingsBoard from "@/games/kings/components/KingsBoard";
import {
  BLANK_CANVAS_STATE,
  KING_CELL_STATE,
  KINGS_TIERS,
  KingsParams,
  kingsParamsGenerator,
  KingsPuzzle,
} from "@/games/kings/lib";
import { KingsProvider, useKings } from "@/games/kings/components/KingsContext";
// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function KingsGame() {
  const ctx = useKings();

  const params: KingsParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return kingsParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return kingsParamsGenerator.byLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

  const displayParams = useMemo((): ParamItem[] => {
    if (!params) return [];
    return [
      {
        label: "Size",
        display: `${params.N} x ${params.N}`,
        pct: params.N / 15,
        color: `hsl(${colorId(0).bg})` as ColorType,
      },
      {
        label: "Compactness",
        display: params.compactness.toFixed(2),
        pct: params.compactness,
        color: `hsl(${colorId(1).bg})` as ColorType,
      },
      {
        label: "Size Variance",
        display: params.sizeVariance.toFixed(2),
        pct: params.sizeVariance,
        color: `hsl(${colorId(2).bg})` as ColorType,
      },
      {
        label: "Seed",
        display: params.seed,
        pct: 1,
        color: `hsl(${colorId(3).bg})` as ColorType,
      },
    ];
  }, [params]);

  const kingsCell = useMemo(() => {
    return ctx.board.playState.value
      .flat()
      .filter((cell) => cell === KING_CELL_STATE);
  }, [ctx.board.playState]);

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: "⚙",
      color: "#a78bfa",
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.customPuzzle.value) ||
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
      color: T.cyan,
      disabled: !ctx.solver.solution.value,
      hidden: !ctx.solver.solution.value,
      onClick: ctx.solver.toggleVisibility,
    },
    {
      label: "Clear Board",
      icon: "⌫",
      color: T.text2,
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.customPuzzle) ||
        ctx.generator.isSolver,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: "↺",
      color: T.green,
      disabled: !ctx.board.puzzle.value && !ctx.board.customPuzzle,
      onClick: ctx.loadNextPuzzle,
    },
  ];

  const solverBoardParams: SolverGeneratorParamConfig[] = [
    {
      key: "size",
      label: "Size",
      type: "number",
      defaultValue: 6,
      min: 4,
      max: 15,
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: StatItem[] = [
    {
      label: "Board",
      value: ctx.board.puzzle.value
        ? `${ctx.board.puzzle.value.params.N}×${ctx.board.puzzle.value.params.N}`
        : "—",
    },
    {
      label: "Regions",
      value: ctx.board.puzzle.value ? ctx.board.puzzle.value.params.N : "—",
    },
    {
      label: "Placed",
      value: ctx.board.puzzle.value
        ? `${kingsCell.length}/${ctx.board.puzzle.value.size}`
        : "—",
    },
    {
      label: "Time",
      value: formatTime(ctx.timer.elapsedTime),
    },
  ];

  const handleGenerateSolverBoard = (params: ParamValues) => {
    const blankBoard: Partial<KingsPuzzle> = {
      size: params.size as number,
      grid: Array.from({ length: params.size as number }, () =>
        Array(params.size as number).fill(BLANK_CANVAS_STATE),
      ),
    };
    ctx.board.puzzle.setValue(null);
    ctx.board.customPuzzle.setValue(blankBoard);
    ctx.resetGame();
  };

  const handleGenerateBoard = () => {
    ctx.board.customPuzzle.setValue(null);
    ctx.generatePuzzle();
  };

  return (
    <GameShell
      gameName="KINGS"
      logoIcon={<LogoIcon />}
      accentColor={ctx.board.puzzle.value?.params.tier.color}
      tierLabel={ctx.board.puzzle.value?.params.tier.name}
      tierIcon={ctx.board.puzzle.value?.params.tier.icon}
      seed={ctx.board.puzzle.value?.params.seed}
      elapsed={ctx.timer.elapsedTime}
      placedCount={kingsCell.length || 0}
      totalCount={ctx.board.puzzle.value?.size || 0}
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
                ? `Solution found — ${ctx.solver.solution.value?.length} rectangles`
                : ctx.solver.status.value === "error"
                  ? "No solution found"
                  : ""
          }
        />
      }
      // ===============================================================================
      leftPanel={
        <ToolSelectionPanel
          generator={{
            tiers: KINGS_TIERS,
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
      centerPanel={<KingsBoard />}
      // ===============================================================================
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={kingsCell.length}
          totalCount={
            ctx.board.puzzle.value ? ctx.board.puzzle.value.params.N : 0
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

export default function KingsGamePage() {
  return (
    <KingsProvider>
      <KingsGame />
    </KingsProvider>
  );
}
