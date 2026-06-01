"use client";

import { GeneratorMode } from "@/shared/types";
import { useState } from "react";

export interface ShikakuGeneratorProps {
  mode: GeneratorMode;
  setMode: React.Dispatch<React.SetStateAction<GeneratorMode>>;
  tierIdx: number;
  setTierIdx: React.Dispatch<React.SetStateAction<number>>;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  seed: number;
  setSeed: React.Dispatch<React.SetStateAction<number>>;
}

export default function useShikakuGenerator(): ShikakuGeneratorProps {
  // ── Generator state ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<GeneratorMode>("Difficulty");
  const [tierIdx, setTierIdx] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [seed, setSeed] = useState<number>(231198);
  return { mode, setMode, tierIdx, setTierIdx, level, setLevel, seed, setSeed };
}
