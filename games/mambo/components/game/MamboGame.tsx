"use client";

import { useState } from "react";
import type { MamboPuzzle } from "../../types";
import { DIFF_TIERS } from "../../lib/difficulty";
import { generateMamboPuzzle } from "../../lib/puzzle";
import { DiffPicker } from "../shared/DiffPicker";
import { PlayableBoard } from "../shared/PlayableBoard";
import { MamboTitle } from "../shared/MamboTitle";

const SUN = "☀";
const MOON = "◑";

export default function MamboGame() {
  const [diffId, setDiffId] = useState(0);
  const [puzzle, setPuzzle] = useState<MamboPuzzle | null>(null);

  // changed from useRef → useState
  const [counters, setCounters] = useState<number[]>(
    Array(DIFF_TIERS.length).fill(0),
  );

  function startGame(id: number) {
    // create updated counters
    const updated = [...counters];
    updated[id] += 1;

    // save state
    setCounters(updated);

    // generate puzzle
    const data = generateMamboPuzzle(id);
    data.levelNum = updated[id];

    setPuzzle(data);
  }

  if (puzzle) {
    return (
      <PlayableBoard
        puzzle={puzzle}
        onBack={() => setPuzzle(null)}
        sourceLabel="Game"
        onNext={() => startGame(puzzle.diffId)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Header */}
      <div className="pt-4">
        <MamboTitle>☀ ◑ LOGIC PUZZLE</MamboTitle>
      </div>

      {/* ── Idle intro ── */}
      <div className="flex flex-col items-center gap-3.5 text-center px-4 pt-8 pb-2">
        <div
          className="text-[3.2rem] opacity-[0.22]"
          style={{ animation: "pulse 2.4s ease-in-out infinite" }}
        >
          ⊙
        </div>

        <p className="text-[0.95rem] font-bold text-[#4a4860]">
          Choose your challenge
        </p>

        <ul className="flex flex-col gap-1.5 list-none max-w-95">
          {[
            `Equal ${SUN} and ${MOON} in every row & column`,
            "No 3 identical symbols adjacent in a row or column",
            "= neighbors must match · × must differ",
            "Errors appear after a brief pause",
          ].map((rule) => (
            <li
              key={rule}
              className="font-mono text-[0.68rem] text-[#3d3b52] bg-[#14131e] border border-[#22203a] rounded-lg px-3 py-2 text-left"
            >
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <DiffPicker
        selected={diffId}
        onSelect={setDiffId}
        actionLabel="▶ Play"
        onAction={() => startGame(diffId)}
        counters={counters}
      />
    </div>
  );
}
