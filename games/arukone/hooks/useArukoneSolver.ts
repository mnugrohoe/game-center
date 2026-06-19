"use client";

import useSolver, { UseSolverReturn } from "@/shared/hooks/useSolver";
import { solveArukone, SolveArukoneProps } from "../lib/solver";
import { CellKey, PathSegment } from "@/shared/components/ui/Grid";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type UseArukoneSolverReturn = UseSolverReturn<
  SolveArukoneProps,
  CellKey[]
> & {
  swapSegments: PathSegment[];
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
/**
 * Game-specific adapter for {@link useGameBoard}.
 *
 * Binds the generic puzzle and play state types used by Kings and
 * returns a fully typed board controller.
 *
 * @returns A typed game board controller for specific puzzles.
 */
export default function useArukoneSolver(): UseArukoneSolverReturn {
  const ArukoneSolver = ({ rows, cols, grid, walls }: SolveArukoneProps) =>
    solveArukone({ rows, cols, grid, walls });

  const base = useSolver(ArukoneSolver);

  const swapSegments: PathSegment[] = useMemo(() => {
    const solution = base.solution.value;

    if (!solution || solution.length === 0) {
      return [];
    }

    return [
      {
        order: solution,
        colorMode: {
          type: "single",
          color: "var(--color-amber-700)",
        },
      },
    ];
  }, [base.solution.value]);

  return {
    ...base,
    swapSegments,
  };
}
