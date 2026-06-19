"use client";
import type {
  CellCoord,
  DragPayload,
  PathSegment,
  CellKey,
} from "@/shared/components/ui/Grid";
import { type ArukonePuzzle } from "../index";
import useGameBoard, {
  type UseGameBoardReturn,
} from "@/shared/hooks/useGameBoard";
import { useEffect, useMemo } from "react";
import {
  cellKey,
  keyToCoord,
  useGrid,
  type SwapEndpointPair,
} from "@/shared/hooks/useGrid";
import { colorId } from "@/shared/components/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type UseArukoneBoardReturn = UseGameBoardReturn<
  ArukonePuzzle,
  CellKey
> & {
  pointerHandlers: {
    onPointerDown: (coord: CellCoord) => void;
    onDragStart: (payload: DragPayload) => void;
    onDrag: (payload: DragPayload) => void;
    onDragEnd: (payload: DragPayload) => void;
  };
  swapSegments: PathSegment[];
  wallSet: Set<string>;
  customWallSet: Set<string>;
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const getCoords = (payload: DragPayload) => {
  const start =
    payload.mode === "rect" ? payload.startCoord : payload.currentCoord;
  return { start, current: payload.currentCoord };
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
export default function useArukoneBoard(): UseArukoneBoardReturn {
  const base = useGameBoard<ArukonePuzzle, CellKey>();
  const puzzle = base.puzzle.value;
  const {
    interactionMode,
    swapPaths,

    initSwapPaths,
    initWalls,

    swapPointerDown,
    swapPointerUp,
    swapDrag,

    processCellInteraction,
    persistRectSelection,
    setDragCoords,
    reset,
  } = useGrid(
    {
      rows: puzzle?.rows ?? 0,
      cols: puzzle?.cols ?? 0,
    },
    "swap",
  );

  useEffect(() => {
    if (!puzzle) return;

    const SWAP_PAIRS: SwapEndpointPair[] = puzzle.solutionPath?.length
      ? [
          {
            start: keyToCoord(puzzle.solutionPath[0]),
            end: keyToCoord(
              puzzle.solutionPath[puzzle.solutionPath.length - 1],
            ),
            color: "yellow",
          },
        ]
      : [];
    initSwapPaths(SWAP_PAIRS);
    initWalls(puzzle.walls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // ── shared pointer handlers  ──────────────────────
  const pointerHandlers = {
    onPointerDown: (coord: CellCoord) => {
      if (interactionMode === "swap") {
        swapPointerDown(coord);
        return;
      }
      reset();
      setDragCoords(coord, coord);
      processCellInteraction(coord, coord);
    },
    onDragStart: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapDrag(payload.currentCoord);
        return;
      }
      const { start, current } = getCoords(payload);
      setDragCoords(start, current);
      processCellInteraction(current, start);
    },
    onDrag: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapDrag(payload.currentCoord);
        return;
      }
      const { start, current } = getCoords(payload);
      setDragCoords(start, current);
      processCellInteraction(current, start);
    },
    onDragEnd: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapPointerUp();
        return;
      }
      const { start, current } = getCoords(payload);
      processCellInteraction(current, start);
      if (interactionMode === "rect") persistRectSelection();
      else setDragCoords(null, null);
      console.log("[useBoard] Drag End");
      console.log(interactionMode);
    },
  };

  const swapSegments: PathSegment[] = useMemo(
    () =>
      [...swapPaths.values()].map((p) => {
        const fullLength = (puzzle?.rows ?? 0) * (puzzle?.cols ?? 0);

        return {
          order: p.order,
          colorMode: {
            type: "gradient",
            startColor: `${colorId(cellKey(p.startPoint)).hex}`,
            endColor: `${colorId(cellKey(p.endPoint)).hex}`,
            pct: Math.min(1, p.order.length / fullLength),
          },
        };
      }),
    [swapPaths, puzzle?.rows, puzzle?.cols],
  );

  const wallSet: Set<string> = useMemo(
    () =>
      new Set(
        (puzzle?.walls ?? []).flatMap((w) => [
          `${w.r1}-${w.c1}-${w.r2}-${w.c2}`,
          `${w.r2}-${w.c2}-${w.r1}-${w.c1}`,
        ]),
      ),
    [puzzle?.walls],
  );

  const customWallSet: Set<string> = useMemo(
    () =>
      new Set(
        (base.customPuzzle.value?.walls ?? []).flatMap((w) => [
          `${w.r1}-${w.c1}-${w.r2}-${w.c2}`,
          `${w.r2}-${w.c2}-${w.r1}-${w.c1}`,
        ]),
      ),
    [base.customPuzzle.value?.walls],
  );

  return {
    ...base,
    pointerHandlers,
    swapSegments,
    wallSet,
    customWallSet,
  };
}
