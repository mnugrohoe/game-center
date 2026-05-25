// backtracking.test.ts
import { describe, it, expect, vi } from "vitest";
import { backtrack, countSolutions } from "@/shared/algorithms";

describe("backtrack", () => {
  it("finds a valid solution", () => {
    const solution: number[] = [];

    const result = backtrack<number, number[]>({
      totalSteps: 3,

      candidates: () => [1, 2, 3],

      isValid: (choice, step) => {
        // enforce ascending sequence
        return step === 0 || choice > solution[step - 1];
      },

      apply: (choice) => {
        solution.push(choice);
      },

      undo: () => {
        solution.pop();
      },

      buildSolution: () => [...solution],
    });

    expect(result.found).toBe(true);
    expect(result.solution).toEqual([1, 2, 3]);
    expect(result.statesExplored).toBeGreaterThan(0);
  });

  it("returns null solution when no solution exists", () => {
    const solution: number[] = [];

    const result = backtrack<number, number[]>({
      totalSteps: 2,

      candidates: () => [1],

      isValid: () => false,

      apply: (choice) => {
        solution.push(choice);
      },

      undo: () => {
        solution.pop();
      },

      buildSolution: () => [...solution],
    });

    expect(result.found).toBe(false);
    expect(result.solution).toBeNull();
  });

  it("calls undo when backtracking", () => {
    const state: number[] = [];

    const apply = vi.fn((choice: number) => {
      state.push(choice);
    });

    const undo = vi.fn(() => {
      state.pop();
    });

    backtrack<number, number[]>({
      totalSteps: 2,

      candidates: (step) => {
        if (step === 0) return [1, 2];
        return [1];
      },

      isValid: (choice, step) => {
        // reject second step when first choice is 1
        if (step === 1 && state[0] === 1) return false;
        return true;
      },

      apply,

      undo,

      buildSolution: () => [...state],
    });

    expect(apply).toHaveBeenCalled();
    expect(undo).toHaveBeenCalled();
  });

  it("aborts when maxStates is exceeded", () => {
    const result = backtrack<number, number[]>({
      totalSteps: 10,

      candidates: () => [1, 2, 3],

      isValid: () => true,

      apply: () => {},

      undo: () => {},

      buildSolution: () => [],

      maxStates: 3,
    });

    expect(result.found).toBe(false);
    expect(result.solution).toBeNull();
    expect(result.statesExplored).toBe(3);
  });
});

describe("countSolutions", () => {
  it("counts all solutions up to the limit", () => {
    const state: number[] = [];

    const count = countSolutions<number, number[]>(
      {
        totalSteps: 2,

        candidates: () => [1, 2],

        isValid: (choice) => !state.includes(choice),

        apply: (choice) => {
          state.push(choice);
        },

        undo: () => {
          state.pop();
        },

        buildSolution: () => [...state],
      },
      10,
    );

    // permutations: [1,2], [2,1]
    expect(count).toBe(2);
  });

  it("stops counting at the provided limit", () => {
    const state: number[] = [];

    const count = countSolutions<number, number[]>(
      {
        totalSteps: 3,

        candidates: () => [1, 2, 3],

        isValid: (choice) => !state.includes(choice),

        apply: (choice) => {
          state.push(choice);
        },

        undo: () => {
          state.pop();
        },

        buildSolution: () => [...state],
      },
      1,
    );

    expect(count).toBe(1);
  });

  it("returns 0 when no solutions exist", () => {
    const count = countSolutions<number, null>({
      totalSteps: 2,

      candidates: () => [1],

      isValid: () => false,

      apply: () => {},

      undo: () => {},

      buildSolution: () => null,
    });

    expect(count).toBe(0);
  });
});
