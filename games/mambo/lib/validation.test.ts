/**
 * games/mambo/lib/validation.test.ts
 */
import { describe, expect, it } from "vitest";
import { verifyNoThreeInARow, checkMamboComplete } from "./validation";
import type { MamboCellValue, MamboPuzzle } from "../types";

describe("Mambo Validation Engine Suite", () => {
  describe("verifyNoThreeInARow()", () => {
    it("returns true for a perfectly valid, resolved grid without triples", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 2, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(verifyNoThreeInARow(grid, size)).toBe(true);
    });

    it("returns false if there is an unresolved blank cell (0)", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 2, 0, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(verifyNoThreeInARow(grid, size)).toBe(false);
    });

    it("returns false for a horizontal 3-in-a-row violation", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 1, 1, 2], // Three 1s in a row
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(verifyNoThreeInARow(grid, size)).toBe(false);
    });

    it("returns false for a vertical 3-in-a-row violation", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 2, 1, 2],
        [1, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      // Inject vertical triple of 1s in column 0
      grid[0][0] = 1;
      grid[1][0] = 1;
      grid[2][0] = 1;

      expect(verifyNoThreeInARow(grid, size)).toBe(false);
    });
  });

  describe("checkKingsComplete()", () => {
    // Mock minimal MamboPuzzle configuration for quota and constraint testing
    const mockPuzzle: MamboPuzzle = {
      puzzle: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      solution: [
        [1, 2, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ],
      constraints: [
        { r1: 0, c1: 0, r2: 0, c2: 1, type: "x" }, // [0,0] and [0,1] must differ
      ],
      size: 4,
      params: {
        gridSize: 4,
        targetInitCount: 0,
        targetLinksCount: 1,
        tier: {
          name: "Dusk",
          icon: "🌅",
          diffScore: 1,
          sub: "4x4",
          gridSize: 4,
          initRatio: 0.5,
          constraintRatio: 0.1,
          color: "#fff",
          dim: "#888",
          bright: "#fff",
        },
        seed: 123,
      },
    };

    it("returns true for a completely valid, full grid meeting element quotas and satisfying edge constraints", () => {
      const validGrid: MamboCellValue[][] = [
        [1, 2, 1, 2], // Differs at [0,0]=1 and [0,1]=2 (Matches 'x' constraint)
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(checkMamboComplete(validGrid, mockPuzzle)).toBe(true);
    });

    it("returns false if the board is incomplete (contains 0)", () => {
      const incompleteGrid: MamboCellValue[][] = [
        [1, 0, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(checkMamboComplete(incompleteGrid, mockPuzzle)).toBe(false);
    });

    it("returns false if edge constraint relationships are broken", () => {
      // Constraint specifies [0,0] and [0,1] must be different ('x'), making them both 1 violates this
      const brokenConstraintGrid: MamboCellValue[][] = [
        [1, 1, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(checkMamboComplete(brokenConstraintGrid, mockPuzzle)).toBe(false);
    });

    it("returns false if rows or columns do not have exactly N/2 Suns and N/2 Moons", () => {
      // Row 0 has three 1s and one 2 (4x4 requires exactly two 1s and two 2s)
      const unbalancedGrid: MamboCellValue[][] = [
        [1, 1, 1, 1],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(checkMamboComplete(unbalancedGrid, mockPuzzle)).toBe(false);
    });
  });
});
