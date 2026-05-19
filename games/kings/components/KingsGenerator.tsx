"use client";

import { useEffect } from "react";
import {
  KingsBoardProvider,
  useKingsBoardCtx,
} from "../context/KingsBoardContext";
import { KingsBoard } from "./shared/KingsBoard";
import { BoardStatusBar } from "./shared/BoardStatusBar";
import { BoardControls } from "./shared/BoardControls";
import { GeneratorPanel } from "./generator/GeneratorPanel";
import { useGenerator } from "../hooks/useGenerator";
import { measureRegions, DIFF_TIERS, formatTime } from "../lib/index";
import KingsTitle from "./shared/KingsTitle";
import WinBanner from "@/shared/component/WinBanner";
import HowToPlay from "./HowToPlay";

function KingsGeneratorInner() {
  const ctx = useKingsBoardCtx();
  const { loadPuzzle, won, elapsed, showHint, resetBoard } = ctx;
  const gen = useGenerator();

  // When a new puzzle is generated, load it into the board context
  useEffect(() => {
    if (!gen.puzzle) return;
    loadPuzzle(gen.puzzle.grid, gen.puzzle.N);
  }, [gen.puzzle]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = gen.puzzle
    ? measureRegions(gen.puzzle.grid, gen.puzzle.N)
    : null;
  const cellPx = gen.puzzle
    ? Math.max(28, Math.min(54, Math.floor(480 / gen.puzzle.N)))
    : 44;
  const curTier = gen.puzzle ? DIFF_TIERS[gen.puzzle.tierIdx] : null;

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "#0a0908", color: "#d4c49a" }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <KingsTitle>PUZZLE GENERATOR</KingsTitle>

        {/* Generator controls panel */}
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

        {/* Board area */}
        {gen.puzzle && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-2.5 border border-[rgba(201,168,76,0.18)] rounded-sm bg-black/50">
              <KingsBoard cellPx={cellPx} ctx={ctx} />
            </div>

            <BoardStatusBar metrics={metrics} />

            {/* Win banner */}
            {won && curTier && (
              <WinBanner>
                Solved in {formatTime(elapsed)} · {gen.puzzle.N}×{gen.puzzle.N}{" "}
                · {curTier.name} · score {gen.puzzle.diffScore.toFixed(1)}
              </WinBanner>
            )}

            <BoardControls
              onReset={() => {
                resetBoard();
              }}
              onHint={() => gen.puzzle && showHint(gen.puzzle.solution)}
            />
          </div>
        )}

        {/* How to play */}
        <HowToPlay />

        <div
          className="text-center"
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            color: "rgba(201,168,76,0.2)",
          }}
        >
          SAME SEED · SAME PUZZLE · EVERY TIME
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
