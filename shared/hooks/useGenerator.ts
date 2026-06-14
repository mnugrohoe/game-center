"use client";

import { useCallback, useState } from "react";
import {
  DiffTier,
  GeneratorMode,
  StateProp,
  ToolSelectionMode,
} from "@/shared/types";
import { getRandomSeed, levelToTierIdx } from "../algorithms";
import { SolverStatus } from "../components/ui/primitive";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseGeneratorReturn {
  mode: StateProp<GeneratorMode>;
  tierIdx: StateProp<number>;
  level: StateProp<number>;
  seed: StateProp<number>;
  puzzleMode: StateProp<ToolSelectionMode>;
  generate: <T>(config: GenerateConfig<T>) => void;
  loadNext: <T>(config: LoadNextConfig<T>) => void;
  isSolver: boolean;
}

/**
 * Lifecycle callbacks fired by generate() / loadNext().
 * Keeps the config objects consistent and makes every hook-point optional.
 */
export interface GeneratorLifecycle {
  /**
   * Called when the puzzle has been generated and set.
   * Use this to reset board state, restart the timer, etc.
   */
  onReset?: () => void;
  /**
   * Called when generation throws. Receives the string "error" so callers
   * can forward it to a status setter without importing a union type.
   */
  onError?: (status: SolverStatus) => void;
}

/**
 * Everything `generate()` needs to produce and apply one puzzle.
 */
export interface GenerateConfig<TPuzzle> extends GeneratorLifecycle {
  /** Generates a puzzle from a level number (Level mode). */
  levelGenerator: (level: number) => TPuzzle;
  /** Generates a puzzle from a tier index + seed (Difficulty mode). */
  tierGenerator: (tierIdx: number, seed: number) => TPuzzle;
  /** Receives the generated puzzle. */
  onPuzzle: (puzzle: TPuzzle) => void;
  /**
   * Override the seed to use. Pass a number to re-generate with a specific
   * seed; omit (or pass anything else) to use the current hook state.
   */
  seedOverride?: number;
}

/**
 * Everything `loadNext()` needs to advance to the next puzzle.
 */
export interface LoadNextConfig<TPuzzle> extends Omit<
  GenerateConfig<TPuzzle>,
  "seedOverride"
> {
  /** Full list of difficulty tiers — used only for tier-index calculation. */
  diffTiers: DiffTier[];
}

// ---------------------------------------------------------------------------
// Pure helper (no React, easily testable)
// ---------------------------------------------------------------------------

/**
 * Decides which generator to call and returns the resulting puzzle.
 * Extracted from the hook so it can be unit-tested without React.
 */
export function buildPuzzle<TPuzzle>(
  mode: GeneratorMode,
  levelGenerator: (level: number) => TPuzzle,
  tierGenerator: (tierIdx: number, seed: number) => TPuzzle,
  level: number,
  tierIdx: number,
  seed: number,
): TPuzzle {
  return mode === "Difficulty"
    ? tierGenerator(tierIdx, seed)
    : levelGenerator(level);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generic puzzle-generation state shared across any grid/logic game.
 *
 * ### How to add a new game
 *
 * Create a thin adapter that pre-fills `levelGenerator`, `tierGenerator`,
 * and `diffTiers` so components never reference game-specific internals:
 *
 * ```ts
 * export function useShikakuGenerator() {
 *   const gen = useGenerator();
 *   return {
 *     ...gen,
 *     generate: (opts: Omit<GenerateConfig<ShikakuPuzzle>, "levelGenerator" | "tierGenerator">) =>
 *       gen.generate({
 *         ...opts,
 *         levelGenerator: generateShikakuByLevel,
 *         tierGenerator:  generateShikakuByTierIdx,
 *       }),
 *     loadNext: (opts: Omit<LoadNextConfig<ShikakuPuzzle>, "levelGenerator" | "tierGenerator" | "diffTiers">) =>
 *       gen.loadNext({
 *         ...opts,
 *         levelGenerator: generateShikakuByLevel,
 *         tierGenerator:  generateShikakuByTierIdx,
 *         diffTiers:      SHIKAKU_TIERS,
 *       }),
 *   };
 * }
 * ```
 *
 * ### Lifecycle hooks available on every call
 *
 * | Callback   | When it fires                          | Typical use                    |
 * |------------|----------------------------------------|--------------------------------|
 * | `onPuzzle` | puzzle built successfully              | `board.puzzle.setValue(p)`     |
 * | `onReset`  | after `onPuzzle`, always on success    | reset board + timer            |
 * | `onError`  | generation threw                       | set solver/UI status to error  |
 *
 * ### Seed behaviour in `loadNext`
 *
 * | Mode          | Seed used for generation  | Seed committed to state  |
 * |---------------|---------------------------|--------------------------|
 * | `"Difficulty"`| fresh `getRandomSeed()`   | yes — `setSeed(nextSeed)`|
 * | `"Level"`     | existing `seed` (ignored) | no — level puzzles are   |
 * |               |                           | deterministic by level#  |
 *
 * In Level mode the `seed` state is never used by the level generator, so
 * it intentionally stays unchanged. If you ever add a hybrid mode that
 * uses both level *and* seed, revisit this branch.
 */
export default function useGenerator(): UseGeneratorReturn {
  const [mode, setMode] = useState<GeneratorMode>("Difficulty");
  const [tierIdx, setTierIdx] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [seed, setSeed] = useState<number>(getRandomSeed);
  const [puzzleMode, setPuzzleMode] = useState<ToolSelectionMode>("Generator");

  // ------------------------------------------------------------------
  // generate — produce a single puzzle with current (or overridden) state
  // ------------------------------------------------------------------
  const generate = useCallback(
    <TPuzzle>({
      levelGenerator,
      tierGenerator,
      onPuzzle,
      onReset,
      onError,
      seedOverride,
    }: GenerateConfig<TPuzzle>) => {
      try {
        const activeSeed =
          typeof seedOverride === "number" ? seedOverride : seed;

        const puzzle = buildPuzzle(
          mode,
          levelGenerator,
          tierGenerator,
          level,
          tierIdx,
          activeSeed,
        );

        onReset?.();
        onPuzzle(puzzle);
      } catch (error) {
        console.error(error);
        onError?.("error");
      }
    },
    [mode, level, tierIdx, seed],
  );

  // ------------------------------------------------------------------
  // loadNext — advance level/seed then produce the next puzzle
  // ------------------------------------------------------------------
  const loadNext = useCallback(
    <TPuzzle>({
      diffTiers,
      levelGenerator,
      tierGenerator,
      onPuzzle,
      onReset,
      onError,
    }: LoadNextConfig<TPuzzle>) => {
      try {
        if (mode === "Level") {
          const nextLevel = level + 1;
          const nextTierIdx = levelToTierIdx(nextLevel, diffTiers.length);

          setLevel(nextLevel);
          setTierIdx(nextTierIdx);

          const puzzle = buildPuzzle(
            mode,
            levelGenerator,
            tierGenerator,
            nextLevel,
            nextTierIdx,
            seed,
          );

          onReset?.();
          onPuzzle(puzzle);
        } else {
          const nextSeed = getRandomSeed();
          setSeed(nextSeed);

          const puzzle = buildPuzzle(
            mode,
            levelGenerator,
            tierGenerator,
            level,
            tierIdx,
            nextSeed,
          );

          onReset?.();
          onPuzzle(puzzle);
        }
      } catch (error) {
        console.error(error);
        onError?.("error");
      }
    },
    [mode, level, tierIdx, seed],
  );

  const isSolver = puzzleMode === "Solver";

  return {
    mode: { value: mode, setValue: setMode },
    tierIdx: { value: tierIdx, setValue: setTierIdx },
    level: { value: level, setValue: setLevel },
    seed: { value: seed, setValue: setSeed },
    puzzleMode: { value: puzzleMode, setValue: setPuzzleMode },
    isSolver,
    generate,
    loadNext,
  };
}
