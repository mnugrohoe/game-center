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

import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";

import { ColorType, GeneratorMode } from "@/shared/types";
import MamboLogo from "@/games/mambo/components/MamboLogo";
import { MAMBO_TIERS, mamboParamsGenerator } from "@/games/mambo/lib";
import { MamboProvider, useMambo } from "@/games/mambo/components/MamboContext";
import { MamboParams, MamboPuzzle } from "@/games/mambo/types";
import MamboBoard from "@/games/mambo/components/MamboBoard";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function MamboGame() {
  const ctx = useMambo();

  const params: MamboParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return mamboParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return mamboParamsGenerator.byLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

  const displayParams = useMemo((): ParamItem[] => {
    if (!params) return [];
    return [
      {
        label: "Size",
        display: `${params.gridSize} x ${params.gridSize}`,
        pct: params.gridSize / 15,
        color: `hsl(${colorId(0).bg})` as ColorType,
      },
      {
        label: "Init Count",
        display: params.targetInitCount.toFixed(2),
        pct: params.targetInitCount / 25,
        color: `hsl(${colorId(1).bg})` as ColorType,
      },
      {
        label: "Links Count",
        display: params.targetLinksCount.toFixed(2),
        pct: params.targetLinksCount / 25,
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

  const placedCount = useMemo(() => {
    return ctx.board.playState.value.flat().filter((cell) => cell !== 0).length;
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
      hidden: !!ctx.solver.solution.value,
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
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.customPuzzle) ||
        ctx.generator.isSolver,
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
      max: 16,
      step: 2,
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: StatItem[] = [
    {
      label: "Board",
      value: ctx.board.puzzle.value
        ? `${ctx.board.puzzle.value.size}×${ctx.board.puzzle.value.size}`
        : "—",
    },
    {
      label: "Regions",
      value: ctx.board.puzzle.value
        ? ctx.board.puzzle.value.size * ctx.board.puzzle.value.size
        : "—",
    },
    {
      label: "Placed",
      value: ctx.board.puzzle.value
        ? `${placedCount}/${ctx.board.puzzle.value.size * ctx.board.puzzle.value.size}`
        : "—",
    },
    {
      label: "Time",
      value: formatTime(ctx.timer.elapsedTime),
    },
  ];

  /**
   * Initializes and seeds a blank template canvas matrix configuration designated
   * for custom user board placement. Forces validation constraints ensuring odd sizes
   * automatically round up to the nearest valid even grid dimension block.
   *
   * @param params - Configuration values containing required initial layout dimensions.
   */
  const handleGenerateSolverBoard = (params: ParamValues): void => {
    const rawSize = Number(params.size) || 4;
    const size = rawSize % 2 === 0 ? rawSize : rawSize + 1;

    const blankBoard: Partial<MamboPuzzle> = {
      size,
      puzzle: Array.from({ length: size }, () => Array(size).fill(0)),
      constraints: [],
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
      gameName="MAMBO"
      logoIcon={<MamboLogo />}
      accentColor={ctx.board.puzzle.value?.params.tier.color}
      tierLabel={ctx.board.puzzle.value?.params.tier.name}
      tierIcon={ctx.board.puzzle.value?.params.tier.icon}
      seed={ctx.board.puzzle.value?.params.seed}
      elapsed={ctx.timer.elapsedTime}
      placedCount={placedCount ?? 0}
      totalCount={
        (ctx.board.puzzle?.value?.size ?? 0) *
        (ctx.board.puzzle?.value?.size ?? 0)
      }
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
                ? `Solution found`
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
            tiers: MAMBO_TIERS,
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
      centerPanel={<MamboBoard />}
      // ===============================================================================
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={placedCount ?? 0}
          totalCount={
            ctx.board.puzzle.value
              ? ctx.board.puzzle.value.size * ctx.board.puzzle.value.size
              : 0
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

export default function MamboGamePage() {
  return (
    <MamboProvider>
      <MamboGame />
    </MamboProvider>
  );
}
