import { describe, expect, it } from "vitest";

import { validateArukone } from "./validation";
import type { ArukonePuzzle } from "./generator";

describe("validateArukone()", () => {
  it("returns empty state when path is empty", () => {
    const result = validateArukone(
      [],
      {
        "0-0": "1",
        "1-0": "2",
      },
      [],
    );

    expect(result.isComplete).toBe(false);
    expect(result.reachedClue).toBe(0);
    expect(result.expectedNextClue).toBe(1);
  });

  it("accepts a valid completed puzzle", () => {
    const result = validateArukone(
      ["0-0", "1-0", "2-0"],
      {
        "0-0": "1",
        "1-0": "2",
        "2-0": "3",
      },
      [],
    );

    expect(result.isComplete).toBe(true);
    expect(result.isSequenceError).toBe(false);
    expect(result.reachedClue).toBe(3);
    expect(result.expectedNextClue).toBeNull();
  });

  it("detects skipped clue numbers", () => {
    const result = validateArukone(
      ["0-0", "1-0"],
      {
        "0-0": "1",
        "1-0": "3",
      },
      [],
    );

    expect(result.isComplete).toBe(false);
    expect(result.isSequenceError).toBe(true);

    expect(result.reachedClue).toBe(1);
    expect(result.expectedNextClue).toBe(2);

    expect(result.error).toContain("Expected clue 2");
  });

  it("allows moving through empty cells between clues", () => {
    const result = validateArukone(
      ["0-0", "1-0", "2-0"],
      {
        "0-0": "1",
        "1-0": " ",
        "2-0": "2",
      },
      [],
    );

    expect(result.isSequenceError).toBe(false);
    expect(result.reachedClue).toBe(2);
  });

  it("detects non-adjacent moves", () => {
    const result = validateArukone(
      ["0-0", "2-0"],
      {
        "0-0": "1",
        "2-0": "2",
      },
      [],
    );

    expect(result.isComplete).toBe(false);
    expect(result.error).toContain("Invalid move");
  });

  it("detects revisiting a cell", () => {
    const result = validateArukone(
      ["0-0", "1-0", "0-0"],
      {
        "0-0": "1",
        "1-0": "2",
      },
      [],
    );

    expect(result.isComplete).toBe(false);
    expect(result.error).toContain("visited more than once");
  });

  it("detects crossing a wall", () => {
    const walls: ArukonePuzzle["walls"] = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
      },
    ];

    const result = validateArukone(
      ["0-0", "1-0"],
      {
        "0-0": "1",
        "1-0": "2",
      },
      walls,
    );

    expect(result.isComplete).toBe(false);
    expect(result.error).toContain("Wall blocks move");
  });

  it("is not complete when board is not fully filled", () => {
    const result = validateArukone(
      ["0-0", "1-0"],
      {
        "0-0": "1",
        "1-0": "2",
        "2-0": "3",
      },
      [],
    );

    expect(result.isComplete).toBe(false);

    expect(result.reachedClue).toBe(2);
    expect(result.expectedNextClue).toBe(3);
  });

  it("tracks progress correctly", () => {
    const result = validateArukone(
      ["0-0", "1-0", "2-0"],
      {
        "0-0": "1",
        "1-0": "2",
        "2-0": " ",
        "3-0": "3",
      },
      [],
    );

    expect(result.reachedClue).toBe(2);
    expect(result.expectedNextClue).toBe(3);

    expect(result.isComplete).toBe(false);
  });

  it("supports multi-digit clues", () => {
    const path: string[] = [];
    const grid: Record<string, string> = {};

    for (let i = 1; i <= 12; i++) {
      const key = `${i - 1}-0`;

      path.push(key);
      grid[key] = String(i);
    }

    const result = validateArukone(path, grid, []);

    expect(result.isComplete).toBe(true);
    expect(result.reachedClue).toBe(12);
  });

  it("ignores non-number cells", () => {
    const result = validateArukone(
      ["0-0", "1-0", "2-0"],
      {
        "0-0": "1",
        "1-0": " ",
        "2-0": "2",
      },
      [],
    );

    expect(result.isSequenceError).toBe(false);
  });
});
