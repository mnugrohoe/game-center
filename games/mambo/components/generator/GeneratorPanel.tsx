"use client";

import {
  DIFF_TIERS,
  levelToDiffScore,
  levelToTierIdx,
} from "../../lib/difficulty";
import { DiffPicker } from "../shared/DiffPicker";
import { WavePreview } from "@/shared/components";
import type { GeneratorMode } from "../../types";

interface GeneratorPanelProps {
  mode: GeneratorMode;
  setMode: (m: GeneratorMode) => void;
  levelInput: string;
  setLevelInput: (s: string) => void;
  diffId: number;
  setDiffId: (d: number) => void;
  diffCounters: number[];
  onGenerateByLevel: () => void;
  onGenerateByDiff: () => void;
}

export function GeneratorPanel({
  mode,
  setMode,
  levelInput,
  setLevelInput,
  diffId,
  setDiffId,
  diffCounters,
  onGenerateByLevel,
  onGenerateByDiff,
}: GeneratorPanelProps) {
  const parsedLevel = Math.max(1, parseInt(levelInput) || 1);
  const previewDiffId = levelToTierIdx(parsedLevel);
  const previewDiff = DIFF_TIERS[previewDiffId];
  const previewScore = levelToDiffScore(parsedLevel);

  function stepLevel(delta: number) {
    const next = Math.max(1, parsedLevel + delta);
    setLevelInput(String(next));
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-140">
      {/* ── Mode toggle ── */}
      <div className="flex gap-1 p-1 bg-[#14131e] border border-[#22203a] rounded-xl">
        {(["level", "diff"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 flex items-center justify-center gap-1.5 font-['Syne',sans-serif] font-bold text-[0.8rem] py-2 rounded-[9px] border-none cursor-pointer transition-all ${
              mode === m
                ? "bg-linear-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13]"
                : "bg-transparent text-[#4a4860] hover:text-[#dddaea] hover:bg-[#22203a]"
            }`}
          >
            <span>{m === "level" ? "🔢" : "🎯"}</span>
            <span>{m === "level" ? "By Level" : "By Difficulty"}</span>
          </button>
        ))}
      </div>

      {/* ── By Level ── */}
      {mode === "level" && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-mono text-[0.68rem] text-[#3d3b52] text-center">
            Enter any level number — difficulty is calculated automatically
          </p>

          {/* Spinner */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => stepLevel(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#22203a] bg-[#14131e] text-[#a78bfa] text-[1.2rem] font-bold cursor-pointer transition-all hover:border-[#a78bfa] hover:bg-[#1e1a30]"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={levelInput}
              onChange={(e) => setLevelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onGenerateByLevel()}
              className="w-25 text-center font-mono text-[1.8rem] font-bold bg-[#14131e] border-2 border-[#a78bfa] rounded-xl text-[#dddaea] py-1.5 outline-none focus:border-[#c4b5fd] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.13)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => stepLevel(1)}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#22203a] bg-[#14131e] text-[#a78bfa] text-[1.2rem] font-bold cursor-pointer transition-all hover:border-[#a78bfa] hover:bg-[#1e1a30]"
            >
              +
            </button>
          </div>

          {/* Preview badge */}
          <div
            className="flex items-center gap-2.5 bg-[#14131e] rounded-xl px-4 py-2.5 border transition-colors"
            style={{ borderColor: previewDiff.color }}
          >
            <span className="font-mono text-[0.7rem] text-[#4a4860]">
              Level {parsedLevel} →
            </span>
            <span
              className="text-[1rem] font-extrabold"
              style={{ color: previewDiff.color }}
            >
              {previewDiff.name}
            </span>
            <span className="font-mono text-[0.62rem] text-[#4a4860]">
              {previewDiff.sub}
            </span>
            <span className="font-mono text-[0.6rem] text-[#4a4860] ml-auto">
              score {previewScore.toFixed(1)}
            </span>
          </div>

          {/* Wave chart */}
          <div className="w-full max-w-100">
            <p className="font-mono text-[0.58rem] text-[#45435a] mb-1.5 tracking-widest uppercase">
              Difficulty wave · ±20 levels
            </p>
            <div className="pr-8">
              <WavePreview level={parsedLevel} />
            </div>
            <div className="flex justify-between mt-1 font-mono text-[0.58rem] text-[#4a3810]">
              <span>lvl {Math.max(1, parsedLevel - 20)}</span>
              <span className="text-[#c9a84c]">← now →</span>
              <span>lvl {parsedLevel + 20}</span>
            </div>
          </div>

          <button
            onClick={onGenerateByLevel}
            className="font-['Syne',sans-serif] font-bold text-[0.82rem] px-5 py-2 rounded-[10px] border-none bg-linear-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13] cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0"
          >
            🎲 Generate Level {parsedLevel}
          </button>
        </div>
      )}

      {/* ── By Difficulty ── */}
      {mode === "diff" && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-mono text-[0.68rem] text-[#3d3b52] text-center">
            Pick a fixed difficulty — generate as many as you want
          </p>
          <DiffPicker
            selected={diffId}
            onSelect={setDiffId}
            actionLabel="🎲 Generate & Play"
            onAction={onGenerateByDiff}
            counters={diffCounters}
          />
        </div>
      )}
    </div>
  );
}
