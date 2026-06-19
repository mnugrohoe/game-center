"use client";

import { useMemo } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import GeneratorPanel, {
  ParamItem,
} from "@/shared/components/ui/GeneratorPanel";
import {
  ActionDef,
  StatItem,
  SolverPanel,
} from "@/shared/components/ui/SolverPanel";
import { T, colorId, formatTime } from "@/shared/components/ui/tokens";

import ParamsPanel from "@/shared/components/ui/ParamsPanel";

import { ColorType, GeneratorMode } from "@/shared/types";
import { useTower, TowerProvider } from "@/games/tower/hooks/TowerContext";
import {
  TowerParams,
  TOWER_DIFF_TIERS,
  towerParamsGenerator,
} from "@/games/tower/lib/difficulty";
import TowerLogo from "@/games/tower/components/Logo";
import TowerBoard from "@/games/tower/components/TowerBoard";
import {
  FaArrowRotateLeft,
  FaPlus,
  FaWandMagicSparkles,
} from "react-icons/fa6";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function TowerGame() {
  const ctx = useTower();

  // Pure deterministic game parameter values
  const params: TowerParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return towerParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return towerParamsGenerator.byLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

  // Upper Left Info Dashboard Parameter Elements
  const displayParams = useMemo((): ParamItem[] => {
    if (!params) return [];

    return [
      {
        label: "Sequence Size",
        display: `${params.size} elements`,
        pct: params.size / 10,
        color: `hsl(${colorId(1).bg})` as ColorType,
      },
      {
        label: "Unique Colors Pool",
        display: `${params.uniqueColors} colors`,
        pct: params.uniqueColors / 10,
        color: `hsl(${colorId(2).bg})` as ColorType,
      },
      {
        label: "Max Same Color",
        display:
          params.maxSameColor === 999
            ? "Unbounded"
            : `${params.maxSameColor} max`,
        pct: params.maxSameColor === 999 ? 1 : params.maxSameColor / 5,
        color: `hsl(${colorId(3).bg})` as ColorType,
      },
      {
        label: "Max Tower Height",
        display: `${params.maxTowerHeight} slots`,
        pct: (params.maxTowerHeight - 6) / (15 - 6),
        color: `hsl(${colorId(4).bg})` as ColorType,
      },
      {
        label: "Entropy Factor",
        display: params.entropyFactor.toFixed(2),
        pct: params.entropyFactor,
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

  const towerCell = useMemo(() => {
    return ctx.board.puzzle.value?.targetSequence.length;
  }, [ctx.board.puzzle.value?.targetSequence]);

  const gameplayActions: ActionDef[] = [
    {
      label: "Reveal Hint",
      icon: <FaWandMagicSparkles />,
      color: T.amber,
      disabled:
        !ctx.board.puzzle.value || ctx.isComplete || ctx.board.isHintExhausted,
      onClick: ctx.board.revealHint,
    },
    {
      label: "Clear Board",
      icon: <FaArrowRotateLeft />,
      color: T.text2,
      disabled: !ctx.board.puzzle.value,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: <FaPlus />,
      color: T.green,
      disabled: !ctx.board.puzzle.value,
      onClick: ctx.loadNextPuzzle,
    },
  ];

  // Live Performance Stats Display (Bottom Right Block Grid)
  const stats: StatItem[] = useMemo((): StatItem[] => {
    return [
      {
        label: "Target Size",
        value: ctx.board.puzzle.value ? `${ctx.board.puzzle.value.size}` : "—",
      },
      {
        label: "Height Limit",
        value: ctx.board.puzzle.value
          ? `${ctx.board.puzzle.value.maxTowerHeight}`
          : "—",
      },
      {
        label: "Placed Colors",
        value: ctx.board.puzzle.value
          ? `${towerCell}/${ctx.board.puzzle.value.size}`
          : "—",
      },
      {
        label: "Time",
        value: formatTime(ctx.timer.elapsedTime),
      },
    ];
  }, [ctx.board.puzzle.value, towerCell, ctx.timer.elapsedTime]);

  const handleGenerateBoard = () => {
    ctx.generatePuzzle();
  };

  const targetTotalTower = ctx.board.puzzle.value?.size || 0;
  const themeAccentColor =
    ctx.board.puzzle.value?.params.tier.color || T.accent;

  return (
    <GameShell
      gameName="TOWER"
      logoIcon={<TowerLogo />}
      accentColor={themeAccentColor}
      tierLabel={ctx.board.puzzle.value?.params.tier.name}
      tierIcon={ctx.board.puzzle.value?.params.tier.icon}
      seed={ctx.board.puzzle.value?.params.seed}
      elapsed={ctx.timer.elapsedTime}
      placedCount={towerCell || 0}
      totalCount={targetTotalTower}
      isSolved={ctx.isComplete}
      onNext={ctx.loadNextPuzzle}
      leftPanel={
        <GeneratorPanel
          tiers={TOWER_DIFF_TIERS}
          tier={ctx.generator.tierIdx}
          seed={ctx.generator.seed}
          onGenerate={handleGenerateBoard}
          mode={ctx.generator.mode}
          level={ctx.generator.level}
        />
      }
      centerPanel={<TowerBoard />}
      rightPanel={
        <SolverPanel
          panelLabel="Params & Stats"
          placedCount={towerCell}
          totalCount={targetTotalTower}
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
export default function TowerGamePage() {
  return (
    <TowerProvider>
      <TowerGame />
    </TowerProvider>
  );
}
