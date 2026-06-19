// shared/hooks/useGrid.ts
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CellCoord, CellKey } from "@/shared/components/ui/Grid";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type GridInteractionMode =
  | "none" // passive — no selection
  | "cell" // single hovered cell, persists on drag-end
  | "rect" // axis-aligned rectangle, persists on drag-end
  | "line" // strict H or V line from drag start
  | "paint" // free-paint every visited cell
  | "erase" // remove visited cells
  | "pathForward" // forward-only path, L-shape interpolation
  | "pathBacktracable" // path with backtrack + branch-cut
  | "swap"; // flow-free style: fixed endpoints, path between them

/** A single swap connection between two fixed endpoints. */
export type SwapPath = {
  id: CellKey;
  startPoint: CellCoord;
  endPoint: CellCoord;
  order: CellKey[];
  keySet: Set<CellKey>;
  isComplete: boolean;
  color: string;
};

/** Configure a swap pair before mounting. */
export type SwapEndpointPair = {
  start: CellCoord;
  end: CellCoord;
  color: string;
};

/**
 * A wall blocking movement between two **adjacent** cells. Swap paths can
 * never cross a wall — extension stops at the cell just before it, the
 * same way it stops when blocked by another path.
 *
 * `(r1, c1)` and `(r2, c2)` must be 4-directionally adjacent (Manhattan
 * distance of exactly 1). Order doesn't matter — `{r1:0,c1:0,r2:0,c2:1}`
 * and `{r1:0,c1:1,r2:0,c2:0}` describe the same wall.
 *
 * @example
 * ```ts
 * // Wall between cell (2,3) and the cell directly below it, (2,4).
 * const wall: Wall = { r1: 2, c1: 3, r2: 2, c2: 4 };
 * ```
 */
export type Wall = {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
};

/**
 * Builds the same direction-independent edge key as {@link wallEdgeKey},
 * but directly from two `"x-y"` cell keys instead of a `Wall` object —
 * used in the path-extension hot loop to avoid round-tripping through
 * `keyToCoord`.
 */
function cellKeysToEdgeKey(keyA: CellKey, keyB: CellKey): string {
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

/**
 * Normalizes a `Wall` into the same direction-independent edge key format
 * produced by {@link cellKeysToEdgeKey}, so a wall declared in `{r, c}`
 * terms matches lookups made against `"x-y"` path keys during extension.
 *
 * **Important**: `Wall.r`/`Wall.c` map onto `CellCoord.y`/`CellCoord.x`
 * respectively (row → y, column → x) — the same convention as the rest of
 * this module. Calling this with raw `(r, c)` pairs (instead of `(x, y)`)
 * is what keeps `Wall` ergonomic to author by hand while staying
 * lookup-compatible with everything else here.
 */
function wallToEdgeKey(w: Wall): string {
  const keyA = cellKey({ x: w.c1, y: w.r1 });
  const keyB = cellKey({ x: w.c2, y: w.r2 });
  return cellKeysToEdgeKey(keyA, keyB);
}

/**
 * Converts a `GapCoord` (as used by `GridWrapper`'s `renderGap`) into the
 * `Wall` it represents — the wall between the cell at `(x, y)` and its
 * neighbor across that gap.
 *
 * Lets you build walls interactively: render gaps as toggleable buttons,
 * collect the ones the player/editor has activated, map them through this,
 * and pass the result to `initWalls`.
 *
 * @example
 * ```ts
 * const activeGaps: GapCoord[] = [{ x: 2, y: 3, edge: "v" }];
 * initWalls(activeGaps.map(gapToWall));
 * ```
 */
export function gapToWall(gap: {
  x: number;
  y: number;
  edge: "h" | "v";
}): Wall {
  return gap.edge === "v"
    ? { r1: gap.y, c1: gap.x, r2: gap.y, c2: gap.x + 1 } // wall to the right
    : { r1: gap.y, c1: gap.x, r2: gap.y + 1, c2: gap.x }; // wall below
}

/**
 * Builds a direction-independent `Set` of wall edge keys from a list of
 * `Wall` declarations, suitable for O(1) lookup during path extension.
 *
 * Walls that aren't between 4-directionally-adjacent cells are skipped —
 * a wall only ever blocks a single step, never a jump, so anything else
 * is treated as a malformed declaration and silently ignored.
 */
function buildWallSet(walls: Wall[]): Set<string> {
  const set = new Set<string>();
  for (const w of walls) {
    const dist = Math.abs(w.r1 - w.r2) + Math.abs(w.c1 - w.c2);
    if (dist !== 1) continue;
    set.add(wallToEdgeKey(w));
  }
  return set;
}

type MoveAxis = "x" | "y" | null;

type GridState = {
  dragStartCoord: CellCoord | null;
  dragCurrentCoord: CellCoord | null;
  activeCellKeys: Set<CellKey>;
  activeCellOrder: CellKey[];
  lastProcessedKey: CellKey | null;
};

// ─────────────────────────────────────────────
// Pure geometry helpers
// ─────────────────────────────────────────────

/**
 * Converts a cell coordinate into a unique grid key.
 *
 * @param coord Cell coordinate
 * @returns Grid key in format `"x-y"`
 */
export const cellKey = (coord: CellCoord): CellKey => `${coord.x}-${coord.y}`;

/**
 * Converts a grid key into coordinates.
 *
 * @param key Grid key in format `"x-y"`
 * @returns Parsed coordinate
 */
export function keyToCoord(key: CellKey): CellCoord {
  const [x, y] = key.split("-").map(Number);
  return { x, y };
}

/**
 * Builds a grid key directly from row/column numbers without needing to
 * construct a `CellCoord` object first. Equivalent to `cellKey({ x, y })`.
 *
 * @param x Column index
 * @param y Row index
 * @returns Grid key in format `"x-y"`
 */
export function coordToKey(x: number, y: number): CellKey {
  return `${x}-${y}`;
}

function getMoveAxis(from: CellKey, to: CellKey): MoveAxis {
  const [x1, y1] = from.split("-").map(Number);
  const [x2, y2] = to.split("-").map(Number);
  return Math.abs(x2 - x1) >= Math.abs(y2 - y1) ? "x" : "y";
}

/**
 * Walk from `from` → `to` step-by-step, preferring `preferredAxis` for the
 * first leg of any L-shape. Returns intermediate keys excluding `from`,
 * including `to`.
 */
function walkPath(
  from: CellKey,
  to: CellKey,
  preferredAxis: MoveAxis,
): CellKey[] {
  const [x1, y1] = from.split("-").map(Number);
  const [x2, y2] = to.split("-").map(Number);

  const path: CellKey[] = [];
  let x = x1;
  let y = y1;
  const sx = Math.sign(x2 - x1);
  const sy = Math.sign(y2 - y1);
  const preferX =
    preferredAxis === "x" || Math.abs(x2 - x1) >= Math.abs(y2 - y1);

  while (x !== x2 || y !== y2) {
    if (preferX) {
      if (x !== x2) x += sx;
      else y += sy;
    } else {
      if (y !== y2) y += sy;
      else x += sx;
    }
    path.push(`${x}-${y}`);
  }
  return path;
}

function buildRectKeys(a: CellCoord, b: CellCoord): Set<CellKey> {
  const keys = new Set<CellKey>();
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) keys.add(`${x}-${y}`);
  return keys;
}

// ─────────────────────────────────────────────
// Generic path helpers (operate on copies)
// ─────────────────────────────────────────────

function pathAddForward(
  keySet: Set<CellKey>,
  order: CellKey[],
  targetKey: CellKey,
  preferredAxis: MoveAxis,
): { keySet: Set<CellKey>; order: CellKey[] } {
  if (keySet.has(targetKey)) return { keySet, order };

  const newSet = new Set(keySet);
  const newOrder = [...order];

  if (newOrder.length === 0) {
    newSet.add(targetKey);
    newOrder.push(targetKey);
    return { keySet: newSet, order: newOrder };
  }

  const fromKey = newOrder[newOrder.length - 1];
  for (const k of walkPath(fromKey, targetKey, preferredAxis)) {
    if (!newSet.has(k)) {
      newSet.add(k);
      newOrder.push(k);
    }
  }

  return { keySet: newSet, order: newOrder };
}

function pathStepBack(
  keySet: Set<CellKey>,
  order: CellKey[],
): { keySet: Set<CellKey>; order: CellKey[] } {
  if (order.length === 0) return { keySet, order };
  const newSet = new Set(keySet);
  const newOrder = [...order];
  const removed = newOrder.pop()!;
  newSet.delete(removed);
  return { keySet: newSet, order: newOrder };
}

function pathCutFrom(
  keySet: Set<CellKey>,
  order: CellKey[],
  index: number,
): { keySet: Set<CellKey>; order: CellKey[]; didCut: boolean } {
  if (index === -1 || index >= order.length - 1)
    return { keySet, order, didCut: false };

  const newSet = new Set(keySet);
  const newOrder = order.slice(0, index);
  for (const k of order.slice(index)) newSet.delete(k);
  return { keySet: newSet, order: newOrder, didCut: true };
}
// ─────────────────────────────────────────────
// Swap-mode helpers
// ─────────────────────────────────────────────

/**
 * Build an occupancy map: key → pathId, from all swap paths *except* `excludeId`.
 * Used to check collision when extending a path.
 */
function buildOccupancyMap(
  paths: Map<CellKey, SwapPath>,
  excludeId: CellKey,
): Map<CellKey, CellKey> {
  const map = new Map<CellKey, CellKey>();
  for (const [id, path] of paths) {
    if (id === excludeId) continue;
    for (const k of path.keySet) map.set(k, id);
  }
  return map;
}

/**
 * Attempt to extend `path` toward `targetKey` one step at a time.
 * Stops (does NOT jump) if the next step would land on a cell occupied
 * by another path, or if the step would cross a wall.
 *
 * Returns the new path state (may be unchanged if fully blocked).
 */
function swapExtendPath(
  path: SwapPath,
  targetKey: CellKey,
  occupancy: Map<CellKey, CellKey>,
  wallSet: Set<string>,
  preferredAxis: MoveAxis,
): SwapPath {
  if (path.order.length === 0) return path;

  const headKey = path.order[path.order.length - 1];
  if (headKey === targetKey) return path;

  // Walk the full ideal path but stop at the first blocked cell.
  const steps = walkPath(headKey, targetKey, preferredAxis);
  const newOrder = [...path.order];
  const newSet = new Set(path.keySet);
  const endKey = cellKey(path.endPoint);
  const isComplete = newOrder[newOrder.length - 1] === endKey;

  let prevKey = headKey;

  for (const k of steps) {
    // Blocked by another path? Stop here — cannot extend further.
    if (occupancy.has(k)) break;
    // Already in own path — shouldn't happen after cut, but guard anyway.
    if (newSet.has(k)) break;
    // A wall sits between the current head and this step — stop here too.
    if (wallSet.has(cellKeysToEdgeKey(prevKey, k))) break;
    // Reach end path
    if (isComplete) break;

    newSet.add(k);
    newOrder.push(k);
    prevKey = k;
  }

  return {
    ...path,
    order: newOrder,
    keySet: newSet,
    isComplete,
  };
}

/**
 * Cut a swap path back to `cutToKey` (inclusive) — used when the user
 * drags back over an earlier cell in the same path.
 */
function swapCutPathTo(path: SwapPath, cutToKey: CellKey): SwapPath {
  const index = path.order.indexOf(cutToKey);
  if (index === -1) return path;

  // Keep everything up to and including `cutToKey`.
  const newOrder = path.order.slice(0, index + 1);
  const newSet = new Set(newOrder);
  const endKey = cellKey(path.endPoint);

  return {
    ...path,
    order: newOrder,
    keySet: newSet,
    isComplete: newOrder[newOrder.length - 1] === endKey,
  };
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * Drives all grid selection/path/swap state for a puzzle board.
 *
 * This hook owns interaction *state* only — pointer geometry is resolved by
 * `GridWrapper`, which calls back into the functions returned here
 * (`processCellInteraction`, `handleClick`, `swapPointerDown`, etc).
 *
 * @param puzzleSize Grid dimensions, passed through unchanged in the return value.
 * @param initialMode Interaction mode to start in.
 *   @defaultValue `"cell"`
 *
 * @example
 * ```tsx
 * const grid = useGrid({ rows: 8, cols: 8 }, "pathBacktracable");
 *
 * <GridWrapper
 *   rows={grid.rows}
 *   cols={grid.cols}
 *   onPointerDown={(coord) => { grid.reset(); grid.processCellInteraction(coord, coord); }}
 *   onDrag={(p) => grid.processCellInteraction(p.currentCoord, p.startCoord ?? p.currentCoord)}
 *   onClick={grid.handleClick}
 *   onDoubleClick={grid.handleDoubleClick}
 *   onContextMenu={grid.handleContextMenu}
 *   renderCell={({ coord, cellSize }) => (
 *     <GridCell coord={coord} cellSize={cellSize}
 *       className={grid.selectedCellKeys.has(cellKey(coord)) ? "bg-blue-500" : ""} />
 *   )}
 * />
 * ```
 */
export function useGrid(
  puzzleSize: { rows: number; cols: number },
  initialMode: GridInteractionMode = "cell",
) {
  const [interactionMode, setInteractionMode] =
    useState<GridInteractionMode>(initialMode);

  const [gridState, setGridState] = useState<GridState>({
    dragStartCoord: null,
    dragCurrentCoord: null,
    activeCellKeys: new Set(),
    activeCellOrder: [],
    lastProcessedKey: null,
  });

  // ── Swap-mode state ──────────────────────────────────────────────────────
  /** All registered swap paths, keyed by their startPoint key. */
  const [swapPaths, setSwapPaths] = useState<Map<CellKey, SwapPath>>(new Map());
  /** Which path id is currently being dragged (if any). */
  const activeSwapPathIdRef = useRef<CellKey | null>(null);

  /**
   * Walls that block swap-path extension, pre-normalized into a
   * direction-independent edge-key `Set` for O(1) lookup. Populate via
   * `initWalls()` — typically once per puzzle, alongside `initSwapPaths`.
   */
  const [wallSet, setWallSet] = useState<Set<string>>(new Set());

  const lastMoveAxisRef = useRef<MoveAxis>(null);

  // ── reset ────────────────────────────────────────────────────────────────

  /** Clears drag state and the generic (`activeCellKeys`) selection. Does
   *  NOT touch `swapPaths` — call `initSwapPaths` again to reset those. */
  const reset = useCallback(() => {
    lastMoveAxisRef.current = null;
    activeSwapPathIdRef.current = null;
    setGridState({
      dragStartCoord: null,
      dragCurrentCoord: null,
      activeCellKeys: new Set(),
      activeCellOrder: [],
      lastProcessedKey: null,
    });
  }, []);

  /** Switches `interactionMode` and resets generic selection state. */
  const changeMode = useCallback(
    (mode: GridInteractionMode) => {
      setInteractionMode(mode);
      reset();
    },
    [reset],
  );

  // ── Swap: register endpoint pairs ────────────────────────────────────────

  /**
   * Declares all swap endpoint pairs for the current puzzle. Call once on
   * mount (or whenever the puzzle changes) — this fully replaces any
   * existing `swapPaths`.
   */
  const initSwapPaths = useCallback((pairs: SwapEndpointPair[]) => {
    const map = new Map<CellKey, SwapPath>();
    for (const pair of pairs) {
      const id = cellKey(pair.start);
      const startKey = cellKey(pair.start);
      map.set(id, {
        id,
        startPoint: pair.start,
        endPoint: pair.end,
        order: [startKey],
        keySet: new Set([startKey]),
        isComplete: false,
        color: pair.color,
      });
    }
    setSwapPaths(map);
  }, []);

  /**
   * Declares all walls for the current puzzle. Call once on mount (or
   * whenever the puzzle changes), typically alongside `initSwapPaths`.
   * Fully replaces any previously registered walls.
   *
   * Walls only affect **swap-mode path extension** (`swapDrag`) — they
   * have no effect on `cell`/`rect`/`paint`/etc. modes, since those don't
   * model adjacency the same way. If you need walls to also block those
   * modes, check `wallSet`/`isEdgeWalled` yourself inside your own
   * `renderCell`/click handlers.
   *
   * @example
   * ```ts
   * initWalls([
   *   { r1: 2, c1: 3, r2: 2, c2: 4 }, // blocks straight down from (3,2)
   *   { r1: 0, c1: 0, r2: 1, c2: 0 }, // blocks straight down from (0,0)
   * ]);
   * ```
   */
  const initWalls = useCallback((walls: Wall[]) => {
    setWallSet(buildWallSet(walls));
  }, []);

  /**
   * Checks whether a wall blocks movement between two adjacent cells.
   * Returns `false` (never blocks) for non-adjacent coordinate pairs.
   */
  const isEdgeWalled = useCallback(
    (a: CellCoord, b: CellCoord): boolean => {
      return wallSet.has(cellKeysToEdgeKey(cellKey(a), cellKey(b)));
    },
    [wallSet],
  );

  // ── Swap: pointer-down — decide which path to activate ───────────────────

  /**
   * Call from `onPointerDown` while `interactionMode === "swap"`.
   *
   * Resolution order:
   * 1. Coord is a registered start/end point → activate that path (cutting
   *    back to the tapped point first, if it's an endpoint reached mid-path).
   * 2. Coord lies on an existing path's body → activate that path, cut to it.
   * 3. Otherwise → no-op.
   *
   * @returns `true` if a path was activated, so the caller can skip other
   *   mode-specific pointerdown logic.
   */
  const swapPointerDown = useCallback(
    (coord: CellCoord): boolean => {
      if (interactionMode !== "swap") return false;

      const key = cellKey(coord);

      for (const [id, path] of swapPaths) {
        const isEndpoint =
          cellKey(path.startPoint) === key || cellKey(path.endPoint) === key;
        if (!isEndpoint) continue;

        activeSwapPathIdRef.current = id;
        setSwapPaths((prev) => {
          const next = new Map(prev);
          const p = next.get(id)!;
          const existingIndex = p.order.indexOf(key);
          if (existingIndex !== -1 && existingIndex < p.order.length - 1) {
            next.set(id, swapCutPathTo(p, key));
          }
          return next;
        });
        return true;
      }

      for (const [id, path] of swapPaths) {
        if (!path.keySet.has(key)) continue;
        activeSwapPathIdRef.current = id;
        setSwapPaths((prev) => {
          const next = new Map(prev);
          next.set(id, swapCutPathTo(prev.get(id)!, key));
          return next;
        });
        return true;
      }

      activeSwapPathIdRef.current = null;
      return false;
    },
    [interactionMode, swapPaths],
  );

  /**
   * Call from `onDrag`/`onDragStart` while `interactionMode === "swap"`.
   * Extends the currently-active swap path toward `coord`. Extension stops
   * (does not jump) at the first cell already occupied by another path.
   */
  const swapDrag = useCallback(
    (coord: CellCoord) => {
      if (interactionMode !== "swap") return;
      const id = activeSwapPathIdRef.current;
      if (!id) return;

      const targetKey = cellKey(coord);

      setSwapPaths((prev) => {
        const path = prev.get(id);
        if (!path) return prev;

        if (path.order[path.order.length - 1] === targetKey) return prev;

        // Target is an earlier cell in this same path → cut back to it.
        const ownIndex = path.order.indexOf(targetKey);
        if (ownIndex !== -1) {
          const next = new Map(prev);
          next.set(id, swapCutPathTo(path, targetKey));
          return next;
        }

        const occupancy = buildOccupancyMap(prev, id);
        const axis = lastMoveAxisRef.current;
        const extended = swapExtendPath(
          path,
          targetKey,
          occupancy,
          wallSet,
          axis,
        );

        if (path.order.length > 0) {
          lastMoveAxisRef.current = getMoveAxis(
            path.order[path.order.length - 1],
            targetKey,
          );
        }

        const next = new Map(prev);
        next.set(id, extended);
        return next;
      });
    },
    [interactionMode, wallSet],
  );

  /** Call from `onDragEnd`/`onPointerUp` while in `"swap"` mode. */
  const swapPointerUp = useCallback(() => {
    activeSwapPathIdRef.current = null;
  }, []);

  // ── Generic cell interaction (non-swap modes) ─────────────────────────────

  /**
   * Drives every non-`"swap"` interaction mode. Call from `onPointerDown`
   * (with `current === start`) and again from `onDrag`/`onDragEnd` as the
   * pointer moves, passing the live `startCoord` each time.
   *
   * Behavior is dispatched on `interactionMode` — see {@link GridInteractionMode}
   * for what each mode does.
   */
  const processCellInteraction = useCallback(
    (currentCoord: CellCoord, startCoord: CellCoord) => {
      const targetKey = cellKey(currentCoord);

      setGridState((prev) => {
        if (prev.lastProcessedKey === targetKey) return prev;

        const { activeCellKeys: keySet, activeCellOrder: order } = prev;

        switch (interactionMode) {
          case "cell": {
            // Always replace with just this cell; persists after drag-end.
            return {
              ...prev,
              activeCellKeys: new Set([targetKey]),
              activeCellOrder: [targetKey],
              dragCurrentCoord: currentCoord,
              lastProcessedKey: targetKey,
            };
          }

          case "rect": {
            // `activeCellKeys` is untouched here — live preview is derived
            // from dragStartCoord/dragCurrentCoord in `selectedCellKeys`.
            // Call `persistRectSelection()` on drag-end to bake it in.
            return {
              ...prev,
              dragCurrentCoord: currentCoord,
              lastProcessedKey: targetKey,
            };
          }

          case "paint": {
            if (keySet.has(targetKey))
              return { ...prev, lastProcessedKey: targetKey };
            return {
              ...prev,
              activeCellKeys: new Set(keySet).add(targetKey),
              activeCellOrder: [...order, targetKey],
              lastProcessedKey: targetKey,
            };
          }

          case "pathForward": {
            const prevAxis = lastMoveAxisRef.current;
            const { keySet: newSet, order: newOrder } = pathAddForward(
              keySet,
              order,
              targetKey,
              prevAxis,
            );
            if (order.length > 0) {
              lastMoveAxisRef.current = getMoveAxis(
                order[order.length - 1],
                targetKey,
              );
            }
            return {
              ...prev,
              activeCellKeys: newSet,
              activeCellOrder: newOrder,
              lastProcessedKey: targetKey,
            };
          }

          case "pathBacktracable": {
            const prevKey = prev.lastProcessedKey;
            const isBacktrack =
              order.length > 1 && targetKey === order[order.length - 2];

            if (isBacktrack) {
              const { keySet: newSet, order: newOrder } = pathStepBack(
                keySet,
                order,
              );
              return {
                ...prev,
                activeCellKeys: newSet,
                activeCellOrder: newOrder,
                lastProcessedKey: targetKey,
              };
            }

            const existingIndex = order.indexOf(targetKey);
            if (existingIndex !== -1 && existingIndex < order.length - 1) {
              const {
                keySet: newSet,
                order: newOrder,
                didCut,
              } = pathCutFrom(keySet, order, existingIndex);
              if (didCut) {
                return {
                  ...prev,
                  activeCellKeys: newSet,
                  activeCellOrder: newOrder,
                  lastProcessedKey: targetKey,
                };
              }
            }

            const prevAxis = prevKey
              ? getMoveAxis(prevKey, targetKey)
              : lastMoveAxisRef.current;
            const { keySet: newSet, order: newOrder } = pathAddForward(
              keySet,
              order,
              targetKey,
              prevAxis,
            );
            lastMoveAxisRef.current = prevAxis;
            return {
              ...prev,
              activeCellKeys: newSet,
              activeCellOrder: newOrder,
              lastProcessedKey: targetKey,
            };
          }

          case "erase": {
            if (!keySet.has(targetKey))
              return { ...prev, lastProcessedKey: targetKey };
            const newSet = new Set(keySet);
            newSet.delete(targetKey);
            return {
              ...prev,
              activeCellKeys: newSet,
              activeCellOrder: order.filter((k) => k !== targetKey),
              lastProcessedKey: targetKey,
            };
          }

          case "line": {
            const newSet = new Set<CellKey>();
            const newOrder: CellKey[] = [];

            if (startCoord.y === currentCoord.y) {
              const minX = Math.min(startCoord.x, currentCoord.x);
              const maxX = Math.max(startCoord.x, currentCoord.x);
              for (let x = minX; x <= maxX; x++) {
                const k = `${x}-${startCoord.y}` as CellKey;
                newSet.add(k);
                newOrder.push(k);
              }
            } else if (startCoord.x === currentCoord.x) {
              const minY = Math.min(startCoord.y, currentCoord.y);
              const maxY = Math.max(startCoord.y, currentCoord.y);
              for (let y = minY; y <= maxY; y++) {
                const k = `${startCoord.x}-${y}` as CellKey;
                newSet.add(k);
                newOrder.push(k);
              }
            }

            return {
              ...prev,
              activeCellKeys: newSet,
              activeCellOrder: newOrder,
              lastProcessedKey: targetKey,
            };
          }

          default:
            return prev;
        }
      });
    },
    [interactionMode],
  );

  /**
   * Bakes the live rect preview (`dragStartCoord` → `dragCurrentCoord`) into
   * `activeCellKeys` and clears drag state. Call this from `onDragEnd` only
   * while `interactionMode === "rect"`.
   */
  const persistRectSelection = useCallback(() => {
    setGridState((prev) => {
      if (!prev.dragStartCoord || !prev.dragCurrentCoord) return prev;
      const keys = buildRectKeys(prev.dragStartCoord, prev.dragCurrentCoord);
      return {
        ...prev,
        activeCellKeys: keys,
        activeCellOrder: [...keys],
        dragStartCoord: null,
        dragCurrentCoord: null,
      };
    });
  }, []);

  /**
   * Live rectangle preview derived from the current drag, expressed as a
   * top-left-anchored `{ x, y, w, h }` box. `null` when no drag is active.
   * Useful for rendering a single overlay rect instead of per-cell highlight.
   */
  const dragPreview = useMemo(() => {
    const { dragStartCoord, dragCurrentCoord } = gridState;
    if (!dragStartCoord || !dragCurrentCoord) return null;
    return {
      x: Math.min(dragStartCoord.x, dragCurrentCoord.x),
      y: Math.min(dragStartCoord.y, dragCurrentCoord.y),
      w: Math.abs(dragCurrentCoord.x - dragStartCoord.x) + 1,
      h: Math.abs(dragCurrentCoord.y - dragStartCoord.y) + 1,
    };
  }, [gridState]);

  // ── Derived selectedCellKeys ──────────────────────────────────────────────

  /** Cell keys that should render as "active"/highlighted for the current mode. */
  const selectedCellKeys = useMemo<Set<CellKey>>(() => {
    const { dragStartCoord, dragCurrentCoord, activeCellKeys } = gridState;

    switch (interactionMode) {
      case "rect":
        if (dragStartCoord && dragCurrentCoord)
          return buildRectKeys(
            dragStartCoord,
            dragCurrentCoord,
          ) as Set<CellKey>;
        return activeCellKeys;

      case "cell":
      case "paint":
      case "erase":
      case "line":
      case "pathForward":
      case "pathBacktracable":
        return activeCellKeys;

      case "swap":
        return new Set([...swapPaths.values()].flatMap((p) => [...p.keySet]));

      default:
        return new Set<CellKey>();
    }
  }, [gridState, interactionMode, swapPaths]);

  // ── Click / double-click / right-click actions ────────────────────────────
  //
  // These three act on the generic `activeCellKeys`/`activeCellOrder` slice
  // ONLY — they are independent of `interactionMode` and do not touch
  // `swapPaths`. If you need click-to-activate behavior for swap mode, use
  // `swapPointerDown` from `onPointerDown` instead; `onClick` still fires
  // afterward but `handleClick` below is safe to leave wired since it just
  // re-runs `processCellInteraction`, which already no-ops for `"swap"`.

  /**
   * Generic single-click handler. Delegates to `processCellInteraction`
   * with `start === current === coord`, so plain clicks behave like a
   * zero-length drag for whichever mode is active.
   *
   * Note: in `"rect"` mode a bare click only updates the live preview —
   * call `persistRectSelection()` afterward if you want a 1×1 click to
   * stick as a persisted selection.
   */
  const handleClick = useCallback(
    (coord: CellCoord) => {
      processCellInteraction(coord, coord);
    },
    [processCellInteraction],
  );

  /**
   * Toggles `coord` in `activeCellKeys`/`activeCellOrder`, independent of
   * `interactionMode`. Wire to `GridWrapper`'s `onDoubleClick` for a
   * "double-tap to mark/unmark" interaction layered on top of any mode.
   */
  const handleDoubleClick = useCallback((coord: CellCoord) => {
    const key = cellKey(coord);

    setGridState((prev) => {
      const nextSet = new Set(prev.activeCellKeys);

      if (nextSet.has(key)) {
        nextSet.delete(key);
        return {
          ...prev,
          activeCellKeys: nextSet,
          activeCellOrder: prev.activeCellOrder.filter((k) => k !== key),
        };
      }

      nextSet.add(key);
      return {
        ...prev,
        activeCellKeys: nextSet,
        activeCellOrder: [...prev.activeCellOrder, key],
      };
    });
  }, []);

  /**
   * Removes `coord` from `activeCellKeys`/`activeCellOrder` if present,
   * independent of `interactionMode`. Wire to `GridWrapper`'s
   * `onContextMenu` for a "right-click to erase" interaction.
   *
   * Calls `event.preventDefault()` to suppress the native browser context
   * menu — pass the event straight through from `GridWrapper`.
   */
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, coord: CellCoord) => {
      event.preventDefault();
      const key = cellKey(coord);

      setGridState((prev) => {
        if (!prev.activeCellKeys.has(key)) return prev;
        const nextSet = new Set(prev.activeCellKeys);
        nextSet.delete(key);
        return {
          ...prev,
          activeCellKeys: nextSet,
          activeCellOrder: prev.activeCellOrder.filter((k) => k !== key),
        };
      });
    },
    [],
  );

  // ── setDragCoords (manual override) ───────────────────────────────────────

  const setDragCoords = useCallback(
    (start: CellCoord | null, current: CellCoord | null) => {
      setGridState((prev) => ({
        ...prev,
        dragStartCoord: start,
        dragCurrentCoord: current,
      }));
    },
    [],
  );

  return {
    rows: puzzleSize.rows,
    cols: puzzleSize.cols,

    interactionMode,
    gridState,

    /** All cell keys that should appear "active" — use for simple highlight. */
    selectedCellKeys,

    /** Ordered path keys (path / line modes). */
    pathOrder: gridState.activeCellOrder,

    /** Live `{x,y,w,h}` box for the in-progress rect drag, or `null`. */
    dragPreview,

    // ── Swap ──────────────────────────────────────────────────────────────
    /** All registered swap paths. Render these for the pipe/snake visuals. */
    swapPaths,
    initSwapPaths,
    swapPointerDown,
    swapDrag,
    swapPointerUp,

    /** Normalized wall edge-key set — pass to `isEdgeWalled` for custom checks. */
    wallSet,
    initWalls,
    isEdgeWalled,

    // ── Generic ───────────────────────────────────────────────────────────
    changeMode,
    reset,
    processCellInteraction,
    persistRectSelection,
    setDragCoords,

    // ── Click family ──────────────────────────────────────────────────────
    handleClick,
    handleDoubleClick,
    handleContextMenu,
  };
}
