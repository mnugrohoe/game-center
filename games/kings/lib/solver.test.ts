import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  solveKings,
  isSolve,
  hasUniqueSolution,
  convertToMatrix2D,
} from "./solver";
import type { Coord } from "@/shared/types";

// ─── REVISI MOCK: Buat mock mesin backtrack yang mensimulasikan hasil asli ───
vi.mock("@/shared/algorithms/backtracking", () => {
  return {
    backtrack: vi.fn((options) => {
      // Jika N = 2, berikan koordinat tiruan yang VALID & AMAN dari aturan catur King
      // [0,0] dan [1,1] saling bertetangga diagonal, tapi jika kita simulasikan koordinat yang berjauhan:
      if (options.totalSteps === 2) {
        return {
          solution: [
            [0, 0],
            [1, 3],
          ] as Coord[],
        }; // Mock solusi tiruan yang panjangnya pas 2
      }
      return { solution: null };
    }),
    countSolutions: vi.fn((options) => {
      if (options.totalSteps === 2) return 1; // 1 solusi = unik
      if (options.totalSteps === 3) return 2; // 2 solusi = tidak unik
      return 0;
    }),
  };
});

vi.mock("@/shared/algorithms/grid", () => {
  return {
    areAdjacent8: vi.fn(([r1, c1]: Coord, [r2, c2]: Coord) => {
      return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) <= 1;
    }),
  };
});

describe("Kings Puzzle Solver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("solveKings & isSolve", () => {
    it("should return an array of coordinates when the puzzle is solvable", () => {
      const grid = [
        [0, 0],
        [1, 1],
      ];
      const N = 2;

      const result = solveKings(grid, N);

      expect(result).not.toBeNull();
      // Sekarang ekspektasi panjang array 2 terpenuhi dari objek kembalian mock yang baru
      expect(result).toHaveLength(2);
      expect(isSolve(grid, N)).toBe(true);
    });

    it("should return null and false when the puzzle is unsolvable", () => {
      const grid = [
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
      ];
      const N = 3;

      const result = solveKings(grid, N);

      expect(result).toBeNull();
      expect(isSolve(grid, N)).toBe(false);
    });
  });

  describe("hasUniqueSolution", () => {
    it("should return true if there is exactly one solution found", () => {
      const grid = [
        [0, 0],
        [1, 1],
      ];
      const N = 2;

      const unique = hasUniqueSolution(grid, N);
      expect(unique).toBe(true);
    });

    it("should return false if there are multiple or no solutions", () => {
      const gridMultiple = [
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
      ];
      expect(hasUniqueSolution(gridMultiple, 3)).toBe(false);
    });
  });

  describe("convertToMatrix2D", () => {
    it("should correctly plot coordinates into a 2D binary matrix", () => {
      const size = 3;
      const coords: Coord[] = [
        [0, 0],
        [2, 1],
      ];

      const expectedMatrix = [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ];

      const result = convertToMatrix2D(size, coords);
      expect(result).toEqual(expectedMatrix);
    });
  });
});
