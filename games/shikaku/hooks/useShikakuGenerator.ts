"use client";

import { useState } from "react";
import { GeneratorMode, StateProp } from "@/shared/types";

/**
 * State container returned by useShikakuGenerator.
 */
export interface UseShikakuGeneratorReturn {
  /**
   * Active generator mode.
   */
  mode: StateProp<GeneratorMode>;

  /**
   * Selected difficulty tier index.
   */
  tierIdx: StateProp<number>;

  /**
   * Selected level within the current tier.
   */
  level: StateProp<number>;

  /**
   * Seed used for deterministic puzzle generation.
   */
  seed: StateProp<number>;
}

/**
 * Manages puzzle generation settings for Shikaku.
 */
export default function useShikakuGenerator(): UseShikakuGeneratorReturn {
  const [mode, setMode] = useState<GeneratorMode>("Difficulty");
  const [tierIdx, setTierIdx] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [seed, setSeed] = useState<number>(231198);

  return {
    mode: {
      value: mode,
      setValue: setMode,
    },

    tierIdx: {
      value: tierIdx,
      setValue: setTierIdx,
    },

    level: {
      value: level,
      setValue: setLevel,
    },

    seed: {
      value: seed,
      setValue: setSeed,
    },
  };
}
