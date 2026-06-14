/**
 * games/mambo/lib/difficulty.test.ts
 */
import { describe, it, expect } from "vitest";
import { generateMamboParams, MAMBO_TIERS } from "./difficulty";
import { generateSolution, generateMamboBoard } from "./generator";
import { mkRng } from "@/shared/algorithms/rng";
import { verifyNoThreeInARow } from "./validation";

describe("Mambo Architecture Test Suite", () => {
  describe("Difficulty Parameter Suite (generateMamboParams)", () => {
    it("should strictly enforce an even grid size matrix", () => {
      // Test extreme score boundary inputs
      const lowParams = generateMamboParams(0.5, 12345);
      const highParams = generateMamboParams(15.0, 67890);

      expect(lowParams.gridSize % 2).toBe(0);
      expect(highParams.gridSize % 2).toBe(0);
    });

    it("should guarantee completely identical output states given identical seeds", () => {
      const score = 4.5;
      const seed = 99999;

      const run1 = generateMamboParams(score, seed);
      const run2 = generateMamboParams(score, seed);

      expect(run1).toEqual(run2);
    });

    it("should respect bounded fallback clamps if tier definitions break limits", () => {
      const params = generateMamboParams(1.0, 42); // Dusk Tier

      // Values must resolve within realistic mathematically sane bounds
      expect(params.targetInitCount).toBeGreaterThanOrEqual(2);
      expect(params.targetLinksCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Solution Generation Optimization (generateSolution)", () => {
    it("should construct a completely filled, legal solution grid with no 3-in-a-row infractions", () => {
      const size = 6;
      const rng = mkRng(888);
      const grid = generateSolution(size, rng);

      expect(grid.length).toBe(size);
      expect(grid[0].length).toBe(size);

      const isLegal = verifyNoThreeInARow(grid, size);
      expect(isLegal).toBe(true);
    });
  });

  describe("Puzzle Engine Integrity (generateMamboBoard)", () => {
    it("should properly match clue and constraint requests to derived target values", () => {
      const mockParams = {
        gridSize: 4,
        targetInitCount: 6,
        targetLinksCount: 4,
        tier: MAMBO_TIERS[0],
        seed: 777,
      };

      const puzzleInstance = generateMamboBoard(mockParams);
      expect(puzzleInstance).not.toBeNull();

      if (puzzleInstance) {
        // Confirm sizes mirror perfectly
        expect(puzzleInstance.size).toBe(4);
        expect(puzzleInstance.constraints.length).toBe(
          mockParams.targetLinksCount,
        );

        // Count non-empty starting cells in structural board layout
        let revealedClues = 0;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (puzzleInstance.puzzle[r][c] !== 0) revealedClues++;
          }
        }
        expect(revealedClues).toBe(mockParams.targetInitCount);
      }
    });

    it("should construct relational adjacency types strictly matching logical values", () => {
      const mockParams = {
        gridSize: 6,
        targetInitCount: 8,
        targetLinksCount: 12,
        tier: MAMBO_TIERS[2],
        seed: 101010,
      };

      const board = generateMamboBoard(mockParams);
      expect(board).not.toBeNull();

      if (board) {
        const { solution, constraints } = board;

        // Iterate through generated bridges and verify validity against absolute solution matrix
        for (const conn of constraints) {
          const val1 = solution[conn.r1][conn.c1];
          const val2 = solution[conn.r2][conn.c2];

          if (conn.type === "=") {
            expect(val1).toBe(val2);
          } else if (conn.type === "x") {
            expect(val1).not.toBe(val2);
          }
        }
      }
    });
  });
});
