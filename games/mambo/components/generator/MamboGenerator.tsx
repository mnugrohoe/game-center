"use client";

import { useState, useEffect } from "react";
import type { MamboPuzzle } from "../../types";
import { useGenerator } from "../../hooks/useGenerator";
import { GeneratorPanel } from "./GeneratorPanel";
import { PlayableBoard } from "../shared/PlayableBoard";
import MamboTitle from "../shared/MamboTitle";

export default function MamboGenerator() {
  const gen = useGenerator();
  const [activePuzzle, setActivePuzzle] = useState<MamboPuzzle | null>(null);

  // When gen.puzzle changes (generate was called), push it to activePuzzle
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gen.puzzle) setActivePuzzle(gen.puzzle);
  }, [gen.puzzle]);

  if (activePuzzle) {
    return (
      <PlayableBoard
        puzzle={activePuzzle}
        onBack={() => setActivePuzzle(null)}
        sourceLabel="Generator"
        onNext={gen.generateNext}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="pt-4">
        <MamboTitle>☀ ◑ LOGIC PUZZLE</MamboTitle>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="text-[2.8rem] opacity-[0.22]"
          style={{ animation: "pulse 2.4s ease-in-out infinite" }}
        >
          🎲
        </div>
        <p className="font-['Syne',sans-serif] font-bold text-[0.95rem] text-[#4a4860]">
          Puzzle Generator
        </p>
        <p className="font-mono text-[0.78rem] text-[#45435a] max-w-85 text-center leading-[1.6]">
          Pick a difficulty or level, generate a unique solvable puzzle, and
          play it right here.
        </p>
      </div>

      <GeneratorPanel
        mode={gen.mode}
        setMode={gen.setMode}
        levelInput={gen.levelInput}
        setLevelInput={gen.setLevelInput}
        diffId={gen.diffId}
        setDiffId={gen.setDiffId}
        diffCounters={gen.diffCounters}
        onGenerateByLevel={gen.generateByLevel}
        onGenerateByDiff={gen.generateByDiff}
      />
    </div>
  );
}
