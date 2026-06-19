"use client";

import { useMemo } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import { ParamItem } from "@/shared/components/ui/GeneratorPanel";
import {
  ActionDef,
  StatItem,
  SolverPanel,
  ParamValues,
  SolverGeneratorParamConfig,
} from "@/shared/components/ui/SolverPanel";
import { T, colorId, formatTime } from "@/shared/components/ui/tokens";

import ParamsPanel from "@/shared/components/ui/ParamsPanel";

import { ColorType, GeneratorMode } from "@/shared/types";
import { FaArrowRotateLeft, FaGear, FaPlus } from "react-icons/fa6";
import {
  ARUKONE_TIERS,
  type ArukoneParams,
  arukoneParamsGenerator,
  useArukone,
  ArukoneProvider,
  meta,
  ArukonePuzzle,
} from "@/games/arukone";
import ArukonesBoard from "@/games/arukone/components/ArukoneBoard";
import { SolverStatusBar } from "@/shared/components/ui/primitive";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";
import { CellKey } from "@/shared/components/ui/Grid";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function ArukoneGame() {
  const ctx = useArukone();

  // Pure deterministic game parameter values
  const params: ArukoneParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return arukoneParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return arukoneParamsGenerator.byLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

  // Upper Left Info Dashboard Parameter Elements
  const displayParams = useMemo((): ParamItem[] => {
    if (!params) return [];

    return [
      {
        label: "Grid Dimensions",
        display: `${params.rows}  x${params.cols}`,
        // Normalized based on a common max grid size (e.g., 20)
        pct: (params.rows * params.cols) / (15 * 15),
        color: `hsl(${colorId(1).bg})` as ColorType,
      },
      {
        label: "Clue Count",
        display: `${params.clueCount} pairs`,
        // Assuming a reasonable max of 20 clue pairs
        pct: params.clueCount / 60,
        color: `hsl(${colorId(2).bg})` as ColorType,
      },
      {
        label: "Wall Count",
        display: `${params.wallCount} walls`,
        // Assuming a relative percentage of total grid cells
        pct: params.wallCount / (params.rows * params.cols * 0.5),
        color: `hsl(${colorId(3).bg})` as ColorType,
      },
      {
        label: "Strategy",
        display:
          params.clueDistribution.charAt(0).toUpperCase() +
          params.clueDistribution.slice(1),
        pct: 1, // Categorical data
        color: `hsl(${colorId(4).bg})` as ColorType,
      },
      {
        label: "Difficulty",
        display: params.tier.name,
        pct: 1, // Categorical data
        color: `hsl(${colorId(5).bg})` as ColorType,
      },
      {
        label: "Seed",
        display: params.seed.toString(),
        pct: 1,
        color: `hsl(${colorId(6).bg})` as ColorType,
      },
    ];
  }, [params]);

  const placedCell = useMemo(() => {
    // Ambil segmen pertama jika ada
    const firstSegment = ctx.board.swapSegments?.[0];

    // Jika ada, ambil panjang order-nya, jika tidak ada, return 0
    return firstSegment?.order.length ?? 0;
  }, [ctx.board.swapSegments]);

  const gameplayActions: ActionDef[] = [
    {
      label: "Auto-Solve",
      icon: <FaGear />,
      color: `${colorId(0).hex}` as ColorType,
      disabled:
        (!ctx.board.puzzle.value && !ctx.board.customPuzzle.value) ||
        ctx.solver.status.value === "solving" ||
        ctx.solver.isVisible.value ||
        !!ctx.solver.solution.value,
      onClick: ctx.autoSolve,
    },
    {
      label: ctx.solver.isVisible.value ? "Hide Solution" : "Show Solution",
      icon: ctx.solver.isVisible.value ? "◎" : "◉",
      color: `${colorId(1).hex}` as ColorType,
      disabled: !ctx.solver.solution.value,
      hidden: !ctx.solver.solution.value,
      onClick: ctx.solver.toggleVisibility,
    },
    {
      label: "Clear Board",
      icon: <FaArrowRotateLeft />,
      color: `${colorId(2).hex}` as ColorType,
      disabled: !ctx.board.puzzle.value && !ctx.board.customPuzzle,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: <FaPlus />,
      color: `${colorId(3).hex}` as ColorType,
      disabled: !ctx.board.puzzle.value,
      onClick: ctx.loadNextPuzzle,
    },
  ];

  // Live Performance Stats Display (Bottom Right Block Grid)
  const stats: StatItem[] = useMemo((): StatItem[] => {
    return [
      {
        label: "Board Size",
        value: ctx.board.puzzle.value
          ? `${ctx.board.puzzle.value.rows} x ${ctx.board.puzzle.value.cols}`
          : "—",
      },
      {
        label: "Wall Count",
        value: ctx.board.puzzle.value
          ? `${ctx.board.puzzle.value.walls.length}`
          : "—",
      },
      {
        label: "Length",
        value: ctx.board.puzzle.value
          ? `${placedCell}/${ctx.board.puzzle.value.solutionPath.length}`
          : "—",
      },
      {
        label: "Time",
        value: formatTime(ctx.timer.elapsedTime),
      },
    ];
  }, [ctx.board.puzzle.value, placedCell, ctx.timer.elapsedTime]);

  const handleGenerateBoard = () => {
    ctx.board.customPuzzle.setValue(null);
    ctx.generatePuzzle();
  };

  const solverBoardParams: SolverGeneratorParamConfig[] = [
    {
      key: "rows",
      label: "Rows",
      type: "number",
      defaultValue: 6,
      min: 4,
      max: 15,
    },
    {
      key: "cols",
      label: "Cols",
      type: "number",
      defaultValue: 6,
      min: 4,
      max: 15,
    },
  ];

  const handleGenerateSolverBoard = (params: ParamValues) => {
    const rows = params.rows as number;
    const cols = params.cols as number;

    const blankBoard: Partial<ArukonePuzzle> = {
      rows,
      cols,
      grid: Array.from({ length: rows * cols }).reduce<Record<CellKey, string>>(
        (acc, _, i) => ({
          ...acc,
          // i % cols = menentukan kolom (x)
          // i / cols = menentukan baris (y)
          [`${i % cols}-${Math.floor(i / cols)}`]: "",
        }),
        {},
      ),
      walls: [],
    };
    ctx.board.puzzle.setValue(null);
    ctx.board.customPuzzle.setValue(blankBoard);
    ctx.resetGame();
  };

  const targetTotalArukone = ctx.board.puzzle.value?.solutionPath.length || 0;
  const themeAccentColor =
    ctx.board.puzzle.value?.params.tier.color || T.accent;

  return (
    <GameShell
      gameName={meta.name}
      logoIcon={<meta.icon />}
      accentColor={themeAccentColor}
      tierLabel={ctx.board.puzzle.value?.params.tier.name}
      tierIcon={ctx.board.puzzle.value?.params.tier.icon}
      seed={ctx.board.puzzle.value?.params.seed}
      elapsed={ctx.timer.elapsedTime}
      placedCount={placedCell || 0}
      totalCount={targetTotalArukone}
      isSolved={ctx.validation.isComplete}
      onNext={ctx.loadNextPuzzle}
      inforPanel={
        <SolverStatusBar
          status={ctx.validation.error ? "error" : "idle"}
          message={ctx.validation.error ?? ""}
        />
      }
      leftPanel={
        <ToolSelectionPanel
          generator={{
            tiers: ARUKONE_TIERS,
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
      centerPanel={<ArukonesBoard />}
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={placedCell}
          totalCount={targetTotalArukone}
          stats={stats}
          actions={gameplayActions}
        >
          <ParamsPanel params={displayParams} />
        </SolverPanel>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Page Wrapper Export
// ---------------------------------------------------------------------------
export default function ArukoneGamePage() {
  return (
    <ArukoneProvider>
      <ArukoneGame />
    </ArukoneProvider>
  );
}
