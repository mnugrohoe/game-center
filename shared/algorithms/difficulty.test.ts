// difficulty.test.ts
import { describe, it, expect } from "vitest";

import {
  waveDifficulty,
  levelToDiffScore,
  normalizeScore,
  lerp,
  clamp,
  diffScoreToTierIdx,
  levelToTierIdx,
  sampleWave,
} from "./difficulty";

describe("waveDifficulty", () => {
  it("returns a score within min/max bounds", () => {
    const score = waveDifficulty({
      level: 50,
      minScore: 1,
      maxScore: 9,
    });

    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(9);
  });

  it("is deterministic for the same level", () => {
    const a = waveDifficulty({ level: 42 });
    const b = waveDifficulty({ level: 42 });

    expect(a).toBe(b);
  });

  it("produces different values for different levels", () => {
    const a = waveDifficulty({ level: 10 });
    const b = waveDifficulty({ level: 11 });

    expect(a).not.toBe(b);
  });

  it("respects custom score bounds", () => {
    const score = waveDifficulty({
      level: 100,
      minScore: 3,
      maxScore: 5,
    });

    expect(score).toBeGreaterThanOrEqual(3);
    expect(score).toBeLessThanOrEqual(5);
  });

  it("handles level 1 safely", () => {
    const score = waveDifficulty({ level: 1 });

    expect(Number.isFinite(score)).toBe(true);
  });

  it("clamps extremely large values to maxScore", () => {
    const score = waveDifficulty({
      level: 1_000_000,
      minScore: 1,
      maxScore: 9,
    });

    expect(score).toBeLessThanOrEqual(9);
  });
});

describe("levelToDiffScore", () => {
  it("delegates to waveDifficulty defaults", () => {
    expect(levelToDiffScore(25)).toBe(waveDifficulty({ level: 25 }));
  });
});

describe("normalizeScore", () => {
  it("normalizes minimum score to 0", () => {
    expect(normalizeScore(1)).toBe(0);
  });

  it("normalizes maximum score to 1", () => {
    expect(normalizeScore(9)).toBe(1);
  });

  it("normalizes midpoint correctly", () => {
    expect(normalizeScore(5)).toBe(0.5);
  });

  it("supports custom ranges", () => {
    expect(normalizeScore(50, 0, 100)).toBe(0.5);
  });
});

describe("lerp", () => {
  it("interpolates between two values", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("returns start value when t = 0", () => {
    expect(lerp(5, 15, 0)).toBe(5);
  });

  it("returns end value when t = 1", () => {
    expect(lerp(5, 15, 1)).toBe(15);
  });

  it("clamps t below 0", () => {
    expect(lerp(0, 10, -1)).toBe(0);
  });

  it("clamps t above 1", () => {
    expect(lerp(0, 10, 2)).toBe(10);
  });
});

describe("clamp", () => {
  it("returns value within range unchanged", () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it("clamps below minimum", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("clamps above maximum", () => {
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe("diffScoreToTierIdx", () => {
  it("maps score 1 to tier 0", () => {
    expect(diffScoreToTierIdx(1, 9)).toBe(0);
  });

  it("maps score 9 to tier 8", () => {
    expect(diffScoreToTierIdx(9, 9)).toBe(8);
  });

  it("rounds intermediate scores", () => {
    expect(diffScoreToTierIdx(4.6, 9)).toBe(4);
  });

  it("clamps below valid range", () => {
    expect(diffScoreToTierIdx(-100, 9)).toBe(0);
  });

  it("clamps above valid range", () => {
    expect(diffScoreToTierIdx(999, 9)).toBe(8);
  });
});

describe("levelToTierIdx", () => {
  it("returns a valid tier index", () => {
    const idx = levelToTierIdx(50, 9);

    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(9);
  });

  it("is deterministic for the same level", () => {
    expect(levelToTierIdx(100, 9)).toBe(levelToTierIdx(100, 9));
  });
});

describe("sampleWave", () => {
  it("returns the correct number of samples", () => {
    const samples = sampleWave(50, 10);

    // inclusive range: -10..10
    expect(samples).toHaveLength(21);
  });

  it("includes level and score for each sample", () => {
    const samples = sampleWave(20, 2);

    for (const sample of samples) {
      expect(sample).toHaveProperty("level");
      expect(sample).toHaveProperty("score");

      expect(typeof sample.level).toBe("number");
      expect(typeof sample.score).toBe("number");
    }
  });

  it("never returns levels below 1", () => {
    const samples = sampleWave(1, 10);

    for (const sample of samples) {
      expect(sample.level).toBeGreaterThanOrEqual(1);
    }
  });

  it("uses custom wave options", () => {
    const samples = sampleWave(30, 1, {
      minScore: 2,
      maxScore: 4,
    });

    for (const sample of samples) {
      expect(sample.score).toBeGreaterThanOrEqual(2);
      expect(sample.score).toBeLessThanOrEqual(4);
    }
  });

  it("returns deterministic samples", () => {
    const a = sampleWave(25, 5);
    const b = sampleWave(25, 5);

    expect(a).toEqual(b);
  });
});
