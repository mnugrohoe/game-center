"use client";

import { DIFF_TIERS } from "../../lib/difficulty";
import WavePreviewComponent from "@/shared/component/WavePreview";
import { cinzel } from "@/shared/utils/fonts";
import type { GeneratorMode, GeneratedPuzzle } from "../../hooks/useGenerator";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { DifficultyBadge } from "../DifficultyBadge";
import { levelToTierIdx } from "@/shared/algorithms";

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

type LevelStateProps = {
  currentLevel: number;
  setCurrentLevel: (l: number) => void;
};

type TierStateProps = {
  selectedTier: number;
  setSelectedTier: (t: number) => void;
};

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
  const levelState: LevelStateProps = { currentLevel, setCurrentLevel };
  const tierState: TierStateProps = { selectedTier, setSelectedTier };

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
            className={`flex-1 p-2 text-xs tracking-widest ${cinzel.className} transition-all duration-150 border-none cursor-pointer ${mode === m ? "bg-[#c9a84c22] text-[#c9a84c]" : "text-[#7a6840] bg-transparent"}`}
          >
            {m === "level" ? "BY LEVEL" : "BY DIFFICULTY"}
          </button>
        ))}
      </div>

      {/* ── By Level ── */}
      {mode === "level" && <ByLevelWavePreview state={levelState} />}

      {/* ── By Difficulty ── */}
      {mode === "diff" && <ByDifficultyTierSelector state={tierState} />}

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className={`${cinzel.className} text-sm tracking-[0.09rem] px-5 py-3 rounded-sm border border-[rgba(201,168,76,0.65)] bg-[rgba(201,168,76,0.18)] text-[#e8c96a] flex items-center gap-2 justify-center ${generating ? "cursor-not-allowed opacity-70" : "hover:bg-[rgba(201,168,76,0.25)] cursor-pointer"}`}
      >
        {generating && <LoadingAnimation />}
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

const ByLevelWavePreview = ({ state }: { state: LevelStateProps }) => {
  const { currentLevel, setCurrentLevel } = state;
  const TierIdx = levelToTierIdx(currentLevel, DIFF_TIERS.length);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Level spinner */}
        <div className="flex items-center gap-2">
          <LevelButton
            onClick={() => setCurrentLevel(Math.max(1, currentLevel - 1))}
          >
            <FaChevronLeft />
          </LevelButton>
          <input
            type="number"
            value={currentLevel}
            min={1}
            max={99999}
            onChange={(e) => setCurrentLevel(Math.max(1, +e.target.value || 1))}
            className={`${cinzel.className} text-center text-[1.1rem] bg-[rgba(0,0,0,0.5)] border border-[rgba(201,168,76,0.25)] text-[#d4c49a] px-3 py-1.5 rounded-sm outline-none`}
          />
          <LevelButton onClick={() => setCurrentLevel(currentLevel + 1)}>
            <FaChevronRight />
          </LevelButton>
        </div>
        {/* Tier badge */}
        <DifficultyBadge difficulty={TierIdx} />
      </div>

      {/* Wave preview */}
      <WavePreviewComponent currentLevel={currentLevel} />
    </div>
  );
};

const ByDifficultyTierSelector = ({ state }: { state: TierStateProps }) => {
  const { selectedTier, setSelectedTier } = state;
  return (
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
              background: selectedTier === i ? `${t.color}18` : "transparent",
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
                background: i <= selectedTier ? `${t.color}88` : "transparent",
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
  );
};

const LevelButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`${cinzel.className} text-[0.68rem] py-1.5 px-3 border border-[rgba(201,168,76,0.35)] rounded-sm bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer`}
  >
    {children}
  </button>
);

const LoadingAnimation = () => (
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
);
