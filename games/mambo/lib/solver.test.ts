import { describe, expect, it } from "vitest";
import { isValidPlacement, solveMambo } from "./solver";
import type { MamboCellValue, MamboConstraint } from "../types";

describe("Mambo Solver Logic Suite", () => {
  describe("isValidPlacement() — Custom Board Context", () => {
    /**
     * Verifies that a local placement is allowed even if an invalid triple
     * configuration exists farther away in the same row, provided it does
     * not exceed the overall element quota.
     */
    it("should allow a placement if a 3-in-a-row violation exists elsewhere in the row", () => {
      const size = 8;
      const grid: MamboCellValue[][] = [
        [0, 0, 0, 0, 0, 2, 2, 2],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ];

      const result = isValidPlacement(grid, 0, 0, 1, size);
      expect(result).toBe(true);
    });

    /**
     * Verifies that the placement is rejected if it directly creates or completes
     * an illegal horizontal triple grouping.
     */
    it("should reject a placement that triggers a local horizontal triple sandwich", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 0, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(isValidPlacement(grid, 0, 1, 1, size)).toBe(false);
      expect(isValidPlacement(grid, 0, 1, 2, size)).toBe(true);
    });

    /**
     * Verifies that a placement is blocked if adding the value causes the total count
     * of that item in the row or column to exceed N/2.
     */
    it("should reject placements exceeding half-grid balance quotas", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(isValidPlacement(grid, 0, 2, 1, size)).toBe(false);
      expect(isValidPlacement(grid, 0, 2, 2, size)).toBe(true);
    });
  });

  describe("solveMambo() — Backtracking & Custom Isolation", () => {
    /**
     * Confirms the backtracking solver can successfully resolve an empty grid
     * with standard relational layout constraints.
     */
    it("should solve a legal minimal empty puzzle with adjacent relational constraints", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const constraints: MamboConstraint[] = [
        { r1: 0, c1: 0, r2: 0, c2: 1, type: "x" },
      ];

      const solution = solveMambo(grid, constraints, size);

      expect(solution).not.toBeNull();
      if (solution) {
        expect(solution[0][0]).not.toBe(solution[0][1]);
        expect(solution[0][0]).toBeGreaterThan(0);
      }
    });

    /**
     * Ensures that pre-filled cells provided by custom boards or layout states
     * remain unmodified during the state evaluation loop.
     */
    it("should protect initial preset cells from being overwritten during backtrack loops", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 1, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const solution = solveMambo(grid, [], size);

      expect(solution).not.toBeNull();
      if (solution) {
        expect(solution[0]).toEqual([1, 1, 2, 2]);
      }
    });

    /**
     * Ensures that impossible custom configurations return null rather than entering
     * an endless execution sequence.
     */
    it("should fail gracefully and return null for completely unresolvable constraint matrices", () => {
      const size = 4;
      const grid: MamboCellValue[][] = [
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const brokenMamboConstraints: MamboConstraint[] = [
        { r1: 0, c1: 0, r2: 0, c2: 1, type: "=" },
        { r1: 0, c1: 0, r2: 0, c2: 1, type: "x" },
      ];

      const solution = solveMambo(grid, brokenMamboConstraints, size);
      expect(solution).toBeNull();
    });
  });
});
