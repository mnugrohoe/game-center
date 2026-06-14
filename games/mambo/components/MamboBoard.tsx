"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CellCoord,
  CellRenderProps,
  EmptyGrid,
  GapCoord,
  GapRenderProps,
  GridCell,
  GridWrapper,
} from "@/shared/components/ui/Grid";
import { cellKey, coordToKey } from "@/shared/hooks/useGrid";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";
import { useMambo } from "./MamboContext";
import { StateProp } from "@/shared/types";
import { MamboCellValue, MamboConstraint, MamboPuzzle } from "../types";
import {
  gapKey,
  MAMBO_EMPTY,
  MAMBO_MOON,
  MAMBO_SUN,
  validateMamboBoard,
} from "../lib";
import { constraintToGapCoord } from "../lib/utils";
import MamboLogo from "./MamboLogo";
import { FaEquals, FaX } from "react-icons/fa6";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const GAP = 16;
const VALIDATE_DEBOUNCE_MS = 500;

const EMPTY_VALIDATION = {
  threeInRowCells: new Set<string>(),
  countErrorCells: new Set<string>(),
  constraintErrorGaps: new Set<string>(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Precomputed class strings — zero runtime cn() cost per cell render
// ─────────────────────────────────────────────────────────────────────────────

// Cell
const CELL_BASE = "border select-none rounded-lg overflow-hidden";

const CELL_CLS = {
  empty: `${CELL_BASE} bg-transparent border-zinc-700 hover:border-zinc-500`,
  sun: `${CELL_BASE} bg-zinc-900/40 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]`,
  moon: `${CELL_BASE} bg-zinc-900/40 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]`,
  error: `${CELL_BASE} animate-pulse ring-4 ring-red-500/40 border-red-500 bg-red-950/20`,
} as const;

const ICON_CLS = {
  empty: "flex h-full w-full items-center justify-center",
  sun: "flex h-full w-full items-center justify-center text-amber-400",
  moon: "flex h-full w-full items-center justify-center text-sky-400",
  error:
    "flex h-full w-full items-center justify-center text-red-500 font-bold",
} as const;

type CellVariant = keyof typeof CELL_CLS;

function getCellVariant(move: MamboCellValue, hasError: boolean): CellVariant {
  if (hasError) return "error";
  if (move === MAMBO_SUN.state) return "sun";
  if (move === MAMBO_MOON.state) return "moon";
  return "empty";
}

// Gap
const GAP_WRAPPER = {
  play: "flex items-center justify-center w-full h-full select-none pointer-events-none",
  solver:
    "flex items-center justify-center w-full h-full select-none cursor-pointer pointer-events-auto relative z-10 group/gap rounded border border-dashed border-transparent hover:border-zinc-500/40 hover:bg-zinc-800/20",
  error:
    "flex items-center justify-center w-full h-full select-none cursor-pointer pointer-events-auto relative z-10 group/gap rounded border border-solid border-red-500/50 bg-red-950/20",
} as const;

const GAP_ICON_BASE = "flex items-center justify-center scale-90";
const GAP_ICON = {
  equal: `${GAP_ICON_BASE} text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]`,
  cross: `${GAP_ICON_BASE} text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.4)]`,
  empty: `${GAP_ICON_BASE} text-transparent group-hover/gap:text-zinc-600 group-hover/gap:scale-100`,
  error: `${GAP_ICON_BASE} text-red-500 animate-pulse font-black drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MamboCellProps extends CellRenderProps {
  move: MamboCellValue;
  hasThreeInRowError?: boolean;
  hasCountError?: boolean;
  hasConstraintError?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

function cycleCell(current: MamboCellValue): MamboCellValue {
  if (current === MAMBO_EMPTY.state) return MAMBO_SUN.state;
  if (current === MAMBO_SUN.state) return MAMBO_MOON.state;
  return MAMBO_EMPTY.state ?? 0;
}

function cycleConstraint(
  current?: MamboConstraint["type"],
): MamboConstraint["type"] | null {
  if (!current) return "=";
  if (current === "=") return "x";
  return null;
}

function resolveConstraintErrorCells(
  errorGaps: Set<string>,
  constraints: MamboConstraint[] | undefined,
): Set<string> {
  const cells = new Set<string>();
  if (!constraints || errorGaps.size === 0) return cells;
  for (const c of constraints) {
    const gc = constraintToGapCoord(c);
    if (!gc || !errorGaps.has(gapKey(gc))) continue;
    cells.add(`${c.r1}-${c.c1}`);
    cells.add(`${c.r2}-${c.c2}`);
  }
  return cells;
}

// ─────────────────────────────────────────────────────────────────────────────
// State updaters
// ─────────────────────────────────────────────────────────────────────────────

function updatePlayerMove(
  state: StateProp<MamboCellValue[][]>,
  { x, y }: CellCoord,
  val: MamboCellValue,
): void {
  state.setValue((prev) => {
    const next = [...prev];
    next[y] = [...(next[y] ?? [])];
    next[y][x] = val;
    return next;
  });
}

function updateCustomPuzzleCell(
  state: StateProp<Partial<MamboPuzzle> | null>,
  { x, y }: CellCoord,
  val: MamboCellValue,
): void {
  state.setValue((prev) => {
    if (!prev) return prev;
    const grid = [...(prev.puzzle ?? [])];
    grid[y] = [...(grid[y] ?? [])];
    grid[y][x] = val;
    return { ...prev, puzzle: grid };
  });
}

function upsertConstraint(
  state: StateProp<Partial<MamboPuzzle> | null>,
  constraint: MamboConstraint,
): void {
  state.setValue((prev) => {
    if (!prev) return prev;
    const existing = prev.constraints ?? [];
    const isSame = (c: MamboConstraint) =>
      c.r1 === constraint.r1 &&
      c.c1 === constraint.c1 &&
      c.r2 === constraint.r2 &&
      c.c2 === constraint.c2;
    const next = existing.some(isSame)
      ? existing.map((c) => (isSame(c) ? constraint : c))
      : [...existing, constraint];
    return { ...prev, constraints: next };
  });
}

function removeConstraint(
  state: StateProp<Partial<MamboPuzzle> | null>,
  rc: Pick<MamboConstraint, "r1" | "c1" | "r2" | "c2">,
): void {
  state.setValue((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      constraints: (prev.constraints ?? []).filter(
        (c) =>
          !(
            c.r1 === rc.r1 &&
            c.c1 === rc.c1 &&
            c.r2 === rc.r2 &&
            c.c2 === rc.c2
          ),
      ),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MamboCell
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single Mambo grid cell. Memoized — re-renders only when props change.
 * Uses precomputed class strings to avoid cn() overhead per cell.
 * No CSS transitions to prevent white-flash on initial paint.
 */
export const MamboCell = memo(function MamboCell({
  coord,
  cellSize,
  move,
  hasThreeInRowError,
  hasCountError,
  hasConstraintError,
}: MamboCellProps) {
  const hasError = !!(
    hasThreeInRowError ||
    hasCountError ||
    hasConstraintError
  );
  const variant = getCellVariant(move, hasError);
  const fontSize = Math.floor(cellSize * 0.55);

  return (
    <GridCell coord={coord} cellSize={cellSize} className={CELL_CLS[variant]}>
      <div className={ICON_CLS[variant]} style={{ fontSize }}>
        {move === MAMBO_SUN.state && MAMBO_SUN.icon}
        {move === MAMBO_MOON.state && MAMBO_MOON.icon}
      </div>
    </GridCell>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MamboBoard
// ─────────────────────────────────────────────────────────────────────────────

/** Main interactive board for the Mambo (Sun/Moon) puzzle. */
export default function MamboBoard() {
  const { board, generator, timer, solver } = useMambo();
  const { puzzle, customPuzzle } = board;
  const { isSolver } = generator;

  const activePuzzle = isSolver ? customPuzzle.value : puzzle.value;
  const N = activePuzzle?.size ?? 0;

  const cellSize = useResponsiveCellSize({
    rows: N,
    cols: N,
    gap: GAP,
    mode: "fill",
  });

  // ── Active move grid ───────────────────────────────────────────────────────

  const moves = useMemo((): MamboCellValue[][] => {
    if (solver.isVisible.value) return solver.solution.value ?? [];
    if (isSolver) return customPuzzle.value?.puzzle ?? [];
    return board.moves.value ?? [];
  }, [
    solver.isVisible.value,
    solver.solution.value,
    isSolver,
    customPuzzle.value?.puzzle,
    board.moves.value,
  ]);

  // ── Debounced validation ───────────────────────────────────────────────────

  const [validation, setValidation] = useState(EMPTY_VALIDATION);

  useEffect(() => {
    const id = setTimeout(() => {
      setValidation(
        isSolver || solver.isVisible.value
          ? EMPTY_VALIDATION
          : validateMamboBoard(moves, activePuzzle?.constraints, N),
      );
    }, VALIDATE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [moves, activePuzzle?.constraints, N, isSolver, solver.isVisible.value]);

  const constraintErrorCells = useMemo(
    () =>
      resolveConstraintErrorCells(
        validation.constraintErrorGaps,
        activePuzzle?.constraints,
      ),
    [validation.constraintErrorGaps, activePuzzle?.constraints],
  );

  // ── Locked cells ──────────────────────────────────────────────────────────

  const lockedKeys = useMemo((): Set<string> => {
    if (isSolver || !puzzle.value?.puzzle) return new Set();
    const { puzzle: grid, size } = puzzle.value;
    const locked = new Set<string>();
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (grid[r][c] !== 0) locked.add(coordToKey(r, c));
    return locked;
  }, [puzzle.value, isSolver]);

  // ── Gap click guard ────────────────────────────────────────────────────────

  const gapClickedRef = useRef(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCellClick = useCallback(
    (coord: CellCoord): void => {
      if (gapClickedRef.current) {
        gapClickedRef.current = false;
        return;
      }
      if (!isSolver && timer.elapsedTime === 0) timer.startTimer();
      if (!isSolver && lockedKeys.has(coordToKey(coord.y, coord.x))) return;

      const next = cycleCell(moves[coord.y]?.[coord.x] ?? 0);
      if (isSolver) {
        if (solver.solution) solver.reset();
        updateCustomPuzzleCell(board.customPuzzle, coord, next);
      } else updatePlayerMove(board.moves, coord, next);
    },
    [
      isSolver,
      lockedKeys,
      moves,
      timer,
      board.moves,
      board.customPuzzle,
      solver,
    ],
  );

  const handleGapClick = useCallback(
    (g: GapCoord): void => {
      if (!isSolver) return;
      if (solver.solution) solver.reset();

      gapClickedRef.current = true;

      const rc = {
        r1: g.y,
        c1: g.x,
        r2: g.edge === "v" ? g.y : g.y + 1,
        c2: g.edge === "v" ? g.x + 1 : g.x,
      };

      const existing = customPuzzle.value?.constraints?.find(
        (c) =>
          c.r1 === rc.r1 && c.c1 === rc.c1 && c.r2 === rc.r2 && c.c2 === rc.c2,
      );
      const nextType = cycleConstraint(existing?.type);

      if (nextType === null) removeConstraint(board.customPuzzle, rc);
      else upsertConstraint(board.customPuzzle, { ...rc, type: nextType });
    },
    [isSolver, customPuzzle.value, board.customPuzzle, solver],
  );

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderCell = useCallback(
    ({ coord, cellSize: cs }: CellRenderProps) => {
      const key = cellKey({ x: coord.y, y: coord.x });
      return (
        <MamboCell
          coord={coord}
          cellSize={cs}
          move={moves[coord.y]?.[coord.x] ?? 0}
          hasThreeInRowError={validation.threeInRowCells.has(key)}
          hasCountError={validation.countErrorCells.has(key)}
          hasConstraintError={constraintErrorCells.has(key)}
        />
      );
    },
    [moves, validation, constraintErrorCells],
  );

  const renderGap = useCallback(
    ({ gap: g, gapSize }: GapRenderProps) => {
      const constraint = activePuzzle?.constraints?.find((c) => {
        const gc = constraintToGapCoord(c);
        return gc?.x === g.x && gc?.y === g.y && gc?.edge === g.edge;
      });

      const hasError = validation.constraintErrorGaps.has(gapKey(g));
      const iconSize = Math.max(10, Math.floor(gapSize * 0.75));
      const wrapperClass = !isSolver
        ? GAP_WRAPPER.play
        : hasError
          ? GAP_WRAPPER.error
          : GAP_WRAPPER.solver;
      const iconClass = hasError
        ? GAP_ICON.error
        : constraint?.type === "="
          ? GAP_ICON.equal
          : constraint?.type === "x"
            ? GAP_ICON.cross
            : GAP_ICON.empty;

      return (
        <div
          className={wrapperClass}
          onClick={
            isSolver
              ? (e) => {
                  e.stopPropagation();
                  handleGapClick(g);
                }
              : undefined
          }
        >
          <div className={iconClass} style={{ fontSize: iconSize }}>
            {constraint?.type === "=" && <FaEquals />}
            {constraint?.type === "x" && <FaX />}
            {isSolver && !constraint && (
              <span className={g.edge === "v" ? "rotate-90" : undefined}>
                {g.edge === "v" ? "│" : "─"}
              </span>
            )}
          </div>
        </div>
      );
    },
    [
      activePuzzle?.constraints,
      handleGapClick,
      isSolver,
      validation.constraintErrorGaps,
    ],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!activePuzzle) return <EmptyGrid logo={MamboLogo} name="Mambo" />;

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 p-4">
      <GridWrapper
        rows={N}
        cols={N}
        gap={GAP}
        cellSize={cellSize}
        dragMode="cell"
        onPointerDown={handleCellClick}
        renderCell={renderCell}
        renderGap={renderGap}
      />
    </div>
  );
}
