"use client";

import { useEffect } from "react";
import { KingsBoardProvider, useKingsBoardCtx } from "../context/KingsBoardContext";
import { KingsBoard } from "./shared/KingsBoard";
import { BoardStatusBar } from "./shared/BoardStatusBar";
import { BoardControls } from "./shared/BoardControls";
import { GeneratorPanel } from "./generator/GeneratorPanel";
import { useGenerator } from "../hooks/useGenerator";
import { measureRegions, DIFF_TIERS, formatTime } from "../lib/utils";

function KingsGeneratorInner() {
  const { loadPuzzle, won, elapsed, showHint, resetBoard, N } = useKingsBoardCtx();
  const gen = useGenerator();

  // When a new puzzle is generated, load it into the board context
  useEffect(() => {
    if (!gen.puzzle) return;
    loadPuzzle(gen.puzzle.grid, gen.puzzle.N);
  }, [gen.puzzle]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = gen.puzzle ? measureRegions(gen.puzzle.grid, gen.puzzle.N) : null;
  const cellPx = gen.puzzle ? Math.max(28, Math.min(54, Math.floor(480 / gen.puzzle.N))) : 44;
  const curTier = gen.puzzle ? DIFF_TIERS[gen.puzzle.tierIdx] : null;

  return (
    <div className="min-h-screen relative" style={{ background: "#0a0908", color: "#d4c49a" }}>
      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)", pointerEvents: "none", zIndex: 0 }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h1 style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: "1.75rem", fontWeight: 700, color: "#e8c96a", letterSpacing: "0.08em", marginBottom: 4 }}>♛ KINGS</h1>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#7a6840" }}>PUZZLE GENERATOR</p>
        </div>

        {/* Generator controls panel */}
        <GeneratorPanel
          mode={gen.mode} setMode={gen.setMode}
          currentLevel={gen.currentLevel} setCurrentLevel={gen.setCurrentLevel}
          selectedTier={gen.selectedTier} setSelectedTier={gen.setSelectedTier}
          generating={gen.generating} puzzle={gen.puzzle}
          onGenerate={gen.generate}
        />

        {/* Board area */}
        {gen.puzzle && (
          <div className="flex flex-col items-center gap-3">
            <div style={{ padding: 10, border: "1px solid rgba(201,168,76,0.18)", background: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
              <KingsBoard cellPx={cellPx} />
            </div>

            <BoardStatusBar metrics={metrics} />

            {/* Win banner */}
            {won && curTier && (
              <div className="text-center px-5 py-3 rounded-sm"
                style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)" }}>
                <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: "0.875rem", color: "#e8c96a" }}>⚜ PUZZLE CONQUERED ⚜</div>
                <div style={{ fontSize: "0.75rem", marginTop: 4, color: "#7a6840" }}>
                  Solved in {formatTime(elapsed)} · {gen.puzzle.N}×{gen.puzzle.N} · {curTier.name} · score {gen.puzzle.diffScore.toFixed(1)}
                </div>
              </div>
            )}

            <BoardControls
              onReset={() => { resetBoard(); }}
              onHint={() => gen.puzzle && showHint(gen.puzzle.solution)}
            />
          </div>
        )}

        {/* How to play */}
        <div className="rounded-sm p-4" style={{ background: "#111009", border: "0.5px solid rgba(201,168,76,0.1)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(to right,transparent,rgba(201,168,76,0.3))" }} />
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#7a6840" }}>HOW TO PLAY</span>
            <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(to left,transparent,rgba(201,168,76,0.3))" }} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              { k: "L-click", v: "→ mark ×" },
              { k: "R-click / dblclick", v: "→ King ♛" },
              { k: "1 king", v: "per region, row, column" },
              { k: "3×3 zone", v: "around each king = blocked" },
            ].map(({ k, v }) => (
              <div key={k} className="flex gap-2" style={{ fontSize: "0.75rem", color: "#7a6840" }}>
                <span style={{ color: "#c9a84c" }}>{k}</span> {v}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: "0.68rem", color: "#4a3810", lineHeight: 1.6 }}>
            Difficulty is non-linear — it rises like a wave, not a ramp. Same level always generates the same puzzle.
          </div>
        </div>

        <div className="text-center" style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(201,168,76,0.2)" }}>
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
