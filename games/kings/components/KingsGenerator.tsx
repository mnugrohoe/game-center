"use client";
/**
 * games/kings/components/KingsGenerator.tsx
 */
import { useEffect } from "react";
import {
  KingsBoardProvider,
  useKingsBoardCtx,
} from "../context/KingsBoardContext";
import { WinBanner, ActionButton } from "@/shared/components";
import { WavePreview } from "@/shared/components";
import { KingsBoard } from "./shared/KingsBoard";
import { BoardStatusBar } from "./shared/BoardStatusBar";
import { BoardControls } from "./shared/BoardControls";
import { KingsTitle } from "./shared/KingsTitle";
import { DifficultyBadge } from "@/shared/components";
import { HowToPlay } from "./HowToPlay";
import { GeneratorPanel } from "./generator/GeneratorPanel";
import { useGenerator } from "../hooks/useGenerator";
import { measureRegions, DIFF_TIERS, formatTime } from "@/games/kings/lib";

function KingsGeneratorInner() {
  const ctx = useKingsBoardCtx();
  const { loadPuzzle, won, elapsed, showHint, resetBoard } = ctx;
  const gen = useGenerator();

  useEffect(() => {
    if (gen.puzzle) loadPuzzle(gen.puzzle.grid, gen.puzzle.N);
  }, [gen.puzzle]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = gen.puzzle
    ? measureRegions(gen.puzzle.grid, gen.puzzle.N)
    : null;
  const cellPx = gen.puzzle
    ? Math.max(28, Math.min(54, Math.floor(480 / gen.puzzle.N)))
    : 44;
  const curTier = gen.puzzle ? DIFF_TIERS[gen.puzzle.tierIdx] : null;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 gap-6 bg-bg">
      <KingsTitle>PUZZLE GENERATOR</KingsTitle>

      <GeneratorPanel
        mode={gen.mode}
        setMode={gen.setMode}
        currentLevel={gen.currentLevel}
        setCurrentLevel={gen.setCurrentLevel}
        selectedTier={gen.selectedTier}
        setSelectedTier={gen.setSelectedTier}
        generating={gen.generating}
        puzzle={gen.puzzle}
        onGenerate={gen.generate}
      />

      {gen.puzzle && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xl">
          <div className="p-2.5 rounded-xs border border-gold-600 bg-black/50">
            <KingsBoard cellPx={cellPx} />
          </div>

          <BoardStatusBar metrics={metrics} />

          {won && curTier && (
            <WinBanner
              detail={`${formatTime(elapsed)} · ${gen.puzzle.N}×${gen.puzzle.N} · ${curTier.name} · score ${gen.puzzle.diffScore.toFixed(1)}`}
            />
          )}

          <BoardControls
            onReset={resetBoard}
            onHint={() => gen.puzzle && showHint(gen.puzzle.solution)}
          />
        </div>
      )}

      <HowToPlay />

      <p className="font-ui text-[0.6rem] tracking-[0.12em] text-gold-600">
        SAME SEED · SAME PUZZLE · EVERY TIME
      </p>
    </div>
  );
}

export default function KingsGenerator() {
  return (
    <KingsBoardProvider>
      <KingsGeneratorInner />
    </KingsBoardProvider>
  );
}
