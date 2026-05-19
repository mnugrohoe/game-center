"use client";

import {
  DIFF_TIERS,
  levelToDiffScore,
  diffScoreToTierIdx,
} from "../../lib/difficulty";
import { WavePreview } from "./WavePreview";
import type { GeneratorMode, GeneratedPuzzle } from "../../hooks/useGenerator";

interface GeneratorPanelProps {
  mode: GeneratorMode;
  setMode: (m: GeneratorMode) => void;
  currentLevel: number;
  setCurrentLevel: (l: number) => void;
  selectedTier: number;
  setSelectedTier: (t: number) => void;
  generating: boolean;
  puzzle: GeneratedPuzzle | null;
  onGenerate: () => void;
}

export function GeneratorPanel({
  mode,
  setMode,
  currentLevel,
  setCurrentLevel,
  selectedTier,
  setSelectedTier,
  generating,
  puzzle,
  onGenerate,
}: GeneratorPanelProps) {
  const previewScore = levelToDiffScore(currentLevel);
  const previewTier = DIFF_TIERS[diffScoreToTierIdx(previewScore)];

  return (
    <div
      className="rounded-sm p-5 flex flex-col gap-5"
      style={{
        background: "#111009",
        border: "0.5px solid rgba(201,168,76,0.15)",
      }}
    >
      {/* Mode tabs */}
      <div
        className="flex rounded-sm overflow-hidden"
        style={{ border: "1px solid rgba(201,168,76,0.2)" }}
      >
        {(["level", "diff"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "8px",
              fontFamily: "'Cinzel',serif",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              transition: "all 0.15s",
              background: mode === m ? "rgba(201,168,76,0.12)" : "transparent",
              color: mode === m ? "#c9a84c" : "#7a6840",
              border: "none",
              cursor: "pointer",
            }}
          >
            {m === "level" ? "BY LEVEL" : "BY DIFFICULTY"}
          </button>
        ))}
      </div>

      {/* ── By Level ── */}
      {mode === "level" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Level spinner */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentLevel(Math.max(1, currentLevel - 1))}
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: "0.68rem",
                  padding: "6px 12px",
                  border: "1px solid rgba(201,168,76,0.35)",
                  borderRadius: "2px",
                  background: "rgba(201,168,76,0.08)",
                  color: "#c9a84c",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
              <input
                type="number"
                value={currentLevel}
                min={1}
                max={99999}
                onChange={(e) =>
                  setCurrentLevel(Math.max(1, +e.target.value || 1))
                }
                style={{
                  width: 90,
                  textAlign: "center",
                  fontSize: "1.1rem",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#d4c49a",
                  fontFamily: "'Cinzel',serif",
                  padding: "6px 12px",
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setCurrentLevel(currentLevel + 1)}
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: "0.68rem",
                  padding: "6px 12px",
                  border: "1px solid rgba(201,168,76,0.35)",
                  borderRadius: "2px",
                  background: "rgba(201,168,76,0.08)",
                  color: "#c9a84c",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            </div>
            {/* Tier badge */}
            <div
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.68rem",
                padding: "5px 12px",
                border: `1px solid ${previewTier.dim}`,
                borderRadius: "2px",
                background: `${previewTier.color}18`,
                color: previewTier.bright,
                letterSpacing: "0.08em",
              }}
            >
              {previewTier.icon} {previewTier.name}
            </div>
            {/* Score badge */}
            <div
              style={{
                fontSize: "0.68rem",
                padding: "5px 10px",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "2px",
                color: "#9a8450",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              score{" "}
              <span style={{ color: "#c9a84c", fontWeight: 600 }}>
                {previewScore.toFixed(1)}
              </span>{" "}
              / 9
            </div>
          </div>

          {/* Wave preview */}
          <div>
            <div
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                color: "#5a4820",
                marginBottom: 6,
              }}
            >
              DIFFICULTY WAVE · ±20 levels
            </div>
            <div style={{ paddingRight: 32 }}>
              <WavePreview level={currentLevel} />
            </div>
            <div
              className="flex justify-between mt-1"
              style={{
                fontSize: "0.58rem",
                fontFamily: "'Cinzel',serif",
                color: "#4a3810",
              }}
            >
              <span>lvl {Math.max(1, currentLevel - 20)}</span>
              <span style={{ color: "#c9a84c" }}>← now →</span>
              <span>lvl {currentLevel + 20}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── By Difficulty ── */}
      {mode === "diff" && (
        <div className="flex flex-col gap-3">
          <span
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "#7a6840",
            }}
          >
            SELECT DIFFICULTY
          </span>
          <div className="flex flex-wrap gap-2">
            {DIFF_TIERS.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTier(i)}
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: "0.62rem",
                  letterSpacing: "0.08em",
                  padding: "6px 12px",
                  borderRadius: "2px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border:
                    selectedTier === i
                      ? `1px solid ${t.dim}`
                      : "1px solid rgba(201,168,76,0.15)",
                  background:
                    selectedTier === i ? `${t.color}18` : "transparent",
                  color: selectedTier === i ? t.bright : "#7a6840",
                }}
              >
                {t.icon} {t.name}
              </button>
            ))}
          </div>
          <div
            className="flex gap-3 flex-wrap"
            style={{ fontSize: "0.72rem", color: "#7a6840" }}
          >
            <span>
              Grid: {DIFF_TIERS[selectedTier].minGrid}–
              {DIFF_TIERS[selectedTier].maxGrid}
            </span>
            <span>Score: {DIFF_TIERS[selectedTier].diffScore} / 9</span>
          </div>
          {/* Scale bar */}
          <div>
            <div
              style={{
                display: "flex",
                height: 6,
                borderRadius: 3,
                overflow: "hidden",
                background: "rgba(0,0,0,0.4)",
                border: "0.5px solid rgba(201,168,76,0.1)",
              }}
            >
              {DIFF_TIERS.map((t, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background:
                      i <= selectedTier ? `${t.color}88` : "transparent",
                    transition: "background 0.2s",
                    borderRight: i < 8 ? "1px solid rgba(0,0,0,0.3)" : "none",
                  }}
                />
              ))}
            </div>
            <div
              className="flex justify-between mt-1"
              style={{ fontSize: "0.55rem", color: "#4a3810" }}
            >
              <span>Trivial</span>
              <span>Medium</span>
              <span>Brutal</span>
            </div>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{
          fontFamily: "'Cinzel',serif",
          fontSize: "0.875rem",
          letterSpacing: "0.09em",
          padding: "12px 20px",
          borderRadius: "2px",
          border: "1px solid rgba(201,168,76,0.65)",
          background: "rgba(201,168,76,0.18)",
          color: "#e8c96a",
          cursor: generating ? "not-allowed" : "pointer",
          opacity: generating ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {generating && (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid rgba(201,168,76,0.2)",
              borderTopColor: "#c9a84c",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        )}
        {generating ? "Generating…" : "Generate Puzzle"}
      </button>

      {/* Active puzzle info chips */}
      {puzzle && <PuzzleInfoChips puzzle={puzzle} />}
    </div>
  );
}

function PuzzleInfoChips({ puzzle }: { puzzle: GeneratedPuzzle }) {
  const tier = DIFF_TIERS[puzzle.tierIdx];
  const diffBarPct = ((puzzle.diffScore - 1) / 8) * 100;
  const diffBarColor = `hsl(${120 - (puzzle.diffScore - 1) * 13}deg, 70%, 45%)`;

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <span
        style={{
          fontFamily: "'Cinzel',serif",
          fontSize: "0.6rem",
          padding: "3px 10px",
          border: `1px solid ${tier.dim}`,
          borderRadius: "2px",
          background: `${tier.color}18`,
          color: tier.bright,
        }}
      >
        {tier.icon} {tier.name}
      </span>
      <span
        style={{
          fontSize: "0.6rem",
          padding: "3px 10px",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "2px",
          color: "#7a6840",
        }}
      >
        {puzzle.N}×{puzzle.N}
      </span>
      <span
        style={{
          fontSize: "0.6rem",
          padding: "3px 10px",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "2px",
          color: "#7a6840",
        }}
      >
        {puzzle.params.label}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 60,
          height: 4,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 2,
          overflow: "hidden",
          border: "0.5px solid rgba(201,168,76,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${diffBarPct.toFixed(1)}%`,
            background: diffBarColor,
            borderRadius: 2,
            transition: "width 0.4s",
          }}
        />
      </div>
      <span style={{ fontSize: "0.6rem", color: "#7a6840" }}>
        {puzzle.diffScore.toFixed(1)}
      </span>
    </div>
  );
}
