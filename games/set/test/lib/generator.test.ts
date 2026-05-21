import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  generateSetBoard,
  generateByDifficulty,
  generateByTier,
  generateByLevel,
} from "@/games/set/lib/generator";

import { SET_DIFF_TIERS } from "@/games/set/lib/difficulty";

import * as solver from "@/games/set/lib/solver";
import * as algorithms from "@/shared/algorithms";

import type { SetCard, Difficulty } from "@/games/set/lib/types";

/**
 * Mock only true external dependencies
 */
vi.mock("@/games/set/lib/solver", () => ({
  findAllSets: vi.fn(),
}));

vi.mock("@/shared/algorithms", async () => {
  const actual = await vi.importActual<typeof import("@/shared/algorithms")>(
    "@/shared/algorithms",
  );

  return {
    ...actual,
    shuffle: vi.fn(),
    seedFromDiff: vi.fn(),
    seedFromLevel: vi.fn(),
    levelToDiffScore: vi.fn(),
  };
});

describe("generateSetBoard", () => {
  const tier = {
    boardCols: 3,
    boardRows: 3,
    ensureSets: 1,
    allowNearMiss: false,
  };

  const mockCards: SetCard[] = Array.from({ length: 9 }).map((_, i) => ({
    id: `card-${i}`,
    symbol: "diamond",
    color: "red",
    texture: "solid",
    count: 1,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a valid board", () => {
    vi.mocked(algorithms.shuffle).mockReturnValue(mockCards);

    vi.mocked(solver.findAllSets).mockReturnValue([
      [mockCards[0], mockCards[1], mockCards[2]],
    ]);

    const result = generateSetBoard(tier as Difficulty, 123);

    expect(result.cards).toHaveLength(9);
    expect(result.sets).toHaveLength(1);
    expect(result.seed).toBe(123);
    expect(result.tier).toBe(tier);
  });

  it("retries when too few sets exist", () => {
    vi.mocked(algorithms.shuffle).mockReturnValue(mockCards);

    vi.mocked(solver.findAllSets)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([[mockCards[0], mockCards[1], mockCards[2]]]);

    const result = generateSetBoard(tier as Difficulty, 456);

    expect(solver.findAllSets).toHaveBeenCalledTimes(2);
    expect(result.sets).toHaveLength(1);
  });

  it("throws after max attempts", () => {
    vi.mocked(algorithms.shuffle).mockReturnValue(mockCards);
    vi.mocked(solver.findAllSets).mockReturnValue([]);

    expect(() => generateSetBoard(tier as Difficulty, 999)).toThrowError(
      "Failed generating SET board after 2500 attempts",
    );
  });
});

describe("generateByDifficulty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates using difficulty score", () => {
    vi.mocked(algorithms.seedFromDiff).mockReturnValue(777);

    const result = generateByDifficulty(0);

    expect(result.seed).toBe(777);
    expect(result.tier).toBe(SET_DIFF_TIERS[0]);
  });

  it("throws for invalid difficulty", () => {
    expect(() => generateByDifficulty(999)).toThrowError(
      "No difficulty tier found for score: 999",
    );
  });
});

describe("generateByTier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates using tier index", () => {
    vi.mocked(algorithms.seedFromDiff).mockReturnValue(888);

    const result = generateByTier(0);

    expect(result.seed).toBe(888);
    expect(result.tier).toBe(SET_DIFF_TIERS[0]);
  });

  it("throws for invalid tier index", () => {
    expect(() => generateByTier(999)).toThrowError(
      "There's no tier at index: 999",
    );
  });
});

describe("generateByLevel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates using level", () => {
    vi.mocked(algorithms.seedFromLevel).mockReturnValue(555);
    vi.mocked(algorithms.levelToDiffScore).mockReturnValue(0);

    const result = generateByLevel(10);

    expect(result.seed).toBe(555);
    expect(result.tier).toBe(SET_DIFF_TIERS[0]);
  });

  it("clamps difficulty score", () => {
    vi.mocked(algorithms.seedFromLevel).mockReturnValue(123);
    vi.mocked(algorithms.levelToDiffScore).mockReturnValue(999);

    const result = generateByLevel(999);

    expect(result.tier).toBe(SET_DIFF_TIERS[SET_DIFF_TIERS.length - 1]);
  });
});
