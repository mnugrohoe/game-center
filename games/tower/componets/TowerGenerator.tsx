"use client";

import { useMemo, useState } from "react";

import GameTitle from "@/shared/component/GameTitle";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

import { generateByLevel } from "../lib/generator";

import TowerBoard from "./TowerBoard";

import { TOWER_DIFF_TIERS, TowerDiffTier } from "../lib/difficulty";

import { clamp, levelToDiffScore } from "@/shared/algorithms/difficulty";

const MAX_LEVEL = 99999;

export default function TowerGenerator() {
  const [level, setLevel] = useState(1);

  const [target, setTarget] = useState<number[]>([]);

  const [tier, setTier] = useState<TowerDiffTier>(TOWER_DIFF_TIERS[0]);

  const [boardKey, setBoardKey] = useState(0);

  const diffScore = useMemo(
    () =>
      Math.round(clamp(levelToDiffScore(level), 1, TOWER_DIFF_TIERS.length)),
    [level],
  );

  const handleGenerate = () => {
    const generatedTarget = generateByLevel(level);

    setTarget(generatedTarget);

    const nextTier =
      TOWER_DIFF_TIERS.find((item) => item.diffScore === diffScore) ??
      TOWER_DIFF_TIERS[0];

    setTier(nextTier);
    console.log("generated", generatedTarget);

    setBoardKey((prev) => prev + 1);
  };

  const decreaseLevel = () => {
    setLevel((prev) => Math.max(1, prev - 1));
  };

  const increaseLevel = () => {
    setLevel((prev) => Math.min(MAX_LEVEL, prev + 1));
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLevel(parseInt(e.target.value) || 1);
  };

  return (
    <div className="tower-generator">
      <GameTitle title="Tower">
        A puzzle about finding the right combination in a tower of blocks
      </GameTitle>

      <div>
        <h2>Panel Generator</h2>

        <div className="tower-generator">
          <div className="flex items-center gap-2">
            <button onClick={decreaseLevel}>
              <FaChevronLeft />
            </button>

            <input
              type="number"
              value={level}
              min={1}
              max={MAX_LEVEL}
              placeholder="Level"
              className="w-20 text-center"
              onChange={handleLevelChange}
            />

            <button onClick={increaseLevel}>
              <FaChevronRight />
            </button>
          </div>

          <button className="mt-4" onClick={handleGenerate}>
            Generate
          </button>
        </div>

        {target.length > 0 && (
          <TowerBoard key={boardKey} target={target} tier={tier} />
        )}
      </div>
    </div>
  );
}
