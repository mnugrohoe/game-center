/**
 * shared/algorithms/validation.test.ts
 * Tests for generic validation utilities.
 */

import { describe, it, expect } from "vitest";
import {
  validAllSameOrDifferent,
  validAllSame,
  validAllDifferent,
  validCount,
  noConsecutiveTriple,
  validAlternating,
  maxOccurrences,
} from "./validation";

describe("validAllSameOrDifferent", () => {
  it("returns true when all values are identical", () => {
    expect(validAllSameOrDifferent([1, 1, 1])).toBe(true);
    expect(validAllSameOrDifferent(["a", "a"])).toBe(true);
  });

  it("returns true when all values are different", () => {
    expect(validAllSameOrDifferent([1, 2, 3])).toBe(true);
    expect(validAllSameOrDifferent(["a", "b", "c"])).toBe(true);
  });

  it("returns false when mixed (some same, some different)", () => {
    expect(validAllSameOrDifferent([1, 1, 2])).toBe(false);
    expect(validAllSameOrDifferent([1, 2, 1])).toBe(false);
  });

  it("handles single elements", () => {
    expect(validAllSameOrDifferent([1])).toBe(true);
  });
});

describe("validAllSame", () => {
  it("returns true when all same", () => {
    expect(validAllSame([5, 5, 5])).toBe(true);
  });

  it("returns false when different", () => {
    expect(validAllSame([5, 5, 6])).toBe(false);
  });

  it("handles empty array", () => {
    expect(validAllSame([])).toBe(true);
  });
});

describe("validAllDifferent", () => {
  it("returns true when all unique", () => {
    expect(validAllDifferent([1, 2, 3])).toBe(true);
  });

  it("returns false when duplicates exist", () => {
    expect(validAllDifferent([1, 2, 1])).toBe(false);
  });
});

describe("validCount", () => {
  it("validates exact count", () => {
    expect(validCount([1, 1, 2, 2], (v) => v === 1, 2)).toBe(true);
    expect(validCount([1, 1, 1, 2], (v) => v === 1, 2)).toBe(false);
  });
});

describe("noConsecutiveTriple", () => {
  it("returns true when no 3 consecutive", () => {
    expect(noConsecutiveTriple([1, 1, 2, 2])).toBe(true);
    expect(noConsecutiveTriple([1, 2, 1, 2])).toBe(true);
  });

  it("returns false when 3+ consecutive", () => {
    expect(noConsecutiveTriple([1, 1, 1, 2])).toBe(false);
    expect(noConsecutiveTriple([1, 2, 2, 2, 1])).toBe(false);
  });
});

describe("validAlternating", () => {
  it("validates alternating pattern", () => {
    const isAlternating = (a: number, b: number) => a !== b;
    expect(validAlternating([1, 2, 1, 2], isAlternating)).toBe(true);
    expect(validAlternating([1, 1, 2, 2], isAlternating)).toBe(false);
  });
});

describe("maxOccurrences", () => {
  it("checks max occurrences", () => {
    expect(maxOccurrences([1, 1, 2, 2], 1, 2)).toBe(true);
    expect(maxOccurrences([1, 1, 1, 2], 1, 2)).toBe(false);
  });
});
