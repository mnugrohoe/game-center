// shared/hooks/useGrid.ts
"use client";

import { useMemo, useRef, useState } from "react";
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
  /** Unique id — typically the key of the startPoint. */
  id: string;
  startPoint: CellCoord;
  endPoint: CellCoord;
  /** Ordered path keys "x-y", includes start and end. */
  order: string[];
  /** Fast lookup set. */
  keySet: Set<string>;
  /** Whether the path currently reaches from start all the way to end. */
  isComplete: boolean;
  /** Colour token (e.g. "red", "#f00") — for rendering. */
  color: string;
};

/** Configure a swap pair before mounting. */
export type SwapEndpointPair = {
  start: CellCoord;
  end: CellCoord;
  color: string;
};

type MoveAxis = "x" | "y" | null;

type GridState = {
  dragStartCoord: CellCoord | null;
  dragCurrentCoord: CellCoord | null;
  /** Active cells for non-swap modes — "x-y" keys. */
  activeCellKeys: Set<string>;
  activeCellOrder: string[];
  lastProcessedKey: string | null;
};

// ─────────────────────────────────────────────
// Pure geometry helpers
// ─────────────────────────────────────────────

export const cellKey = (c: CellCoord): string => `${c.x}-${c.y}`;

export function keyToCoord(k: string): CellCoord {
  const [x, y] = k.split("-").map(Number);
  return { x, y };
}
export function coordToKey(x: number, y: number): CellKey {
  return `${x}-${y}`;
}

function getMoveAxis(from: string, to: string): MoveAxis {
  const [x1, y1] = from.split("-").map(Number);
  const [x2, y2] = to.split("-").map(Number);
  return Math.abs(x2 - x1) >= Math.abs(y2 - y1) ? "x" : "y";
}

/**
 * Walk from `from` → `to` step-by-step, preferring `preferredAxis` for the
 * first leg of any L-shape. Returns intermediate keys excluding `from`,
 * including `to`.
 */
function walkPath(from: string, to: string, preferredAxis: MoveAxis): string[] {
  const [x1, y1] = from.split("-").map(Number);
  const [x2, y2] = to.split("-").map(Number);

  const path: string[] = [];
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

function buildRectKeys(a: CellCoord, b: CellCoord): Set<string> {
  const keys = new Set<string>();
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
  keySet: Set<string>,
  order: string[],
  targetKey: string,
  preferredAxis: MoveAxis,
): { keySet: Set<string>; order: string[] } {
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
  newSet.add(targetKey);
  newOrder.push(targetKey);
  return { keySet: newSet, order: newOrder };
}

function pathStepBack(
  keySet: Set<string>,
  order: string[],
): { keySet: Set<string>; order: string[] } {
  if (order.length === 0) return { keySet, order };
  const newSet = new Set(keySet);
  const newOrder = [...order];
  const removed = newOrder.pop()!;
  newSet.delete(removed);
  return { keySet: newSet, order: newOrder };
}

function pathCutFrom(
  keySet: Set<string>,
  order: string[],
  index: number,
): { keySet: Set<string>; order: string[]; didCut: boolean } {
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
  paths: Map<string, SwapPath>,
  excludeId: string,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [id, path] of paths) {
    if (id === excludeId) continue;
    for (const k of path.keySet) map.set(k, id);
  }
  return map;
}

/**
 * Attempt to extend `path` toward `targetKey` one step at a time.
 * Stops (does NOT jump) if the next step would land on a cell occupied
 * by another path or on a wall.
 *
 * Returns the new path state (may be unchanged if fully blocked).
 */
function swapExtendPath(
  path: SwapPath,
  targetKey: string,
  occupancy: Map<string, string>,
  preferredAxis: MoveAxis,
): SwapPath {
  if (path.order.length === 0) return path;

  const headKey = path.order[path.order.length - 1];
  if (headKey === targetKey) return path;

  // Walk the full ideal path but stop at the first blocked cell.
  const steps = walkPath(headKey, targetKey, preferredAxis);
  const newOrder = [...path.order];
  const newSet = new Set(path.keySet);

  for (const k of steps) {
    // Blocked by another path? Stop here — cannot extend further.
    if (occupancy.has(k)) break;
    // Already in own path — shouldn't happen after cut, but guard anyway.
    if (newSet.has(k)) break;
    newSet.add(k);
    newOrder.push(k);
  }

  const endKey = cellKey(path.endPoint);
  return {
    ...path,
    order: newOrder,
    keySet: newSet,
    isComplete: newOrder[newOrder.length - 1] === endKey,
  };
}

/**
 * Cut a swap path back to `cutToKey` (inclusive) — used when the user
 * drags back over an earlier cell in the same path.
 */
function swapCutPathTo(path: SwapPath, cutToKey: string): SwapPath {
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

export function useGrid(puzzleSize: { rows: number; cols: number }) {
  const [interactionMode, setInteractionMode] =
    useState<GridInteractionMode>("cell");

  const [gridState, setGridState] = useState<GridState>({
    dragStartCoord: null,
    dragCurrentCoord: null,
    activeCellKeys: new Set(),
    activeCellOrder: [],
    lastProcessedKey: null,
  });

  // ── Swap-mode state ──────────────────────────────────────────────────────
  /** All registered swap paths, keyed by their startPoint key. */
  const [swapPaths, setSwapPaths] = useState<Map<string, SwapPath>>(new Map());
  /** Which path id is currently being dragged (if any). */
  const activeSwapPathIdRef = useRef<string | null>(null);

  const lastMoveAxisRef = useRef<MoveAxis>(null);

  // ── reset ────────────────────────────────────────────────────────────────
  function reset() {
    lastMoveAxisRef.current = null;
    activeSwapPathIdRef.current = null;
    setGridState({
      dragStartCoord: null,
      dragCurrentCoord: null,
      activeCellKeys: new Set(),
      activeCellOrder: [],
      lastProcessedKey: null,
    });
  }

  function changeMode(mode: GridInteractionMode) {
    setInteractionMode(mode);
    reset();
  }

  // ── Swap: register endpoint pairs ────────────────────────────────────────
  /**
   * Call once (or when puzzle changes) to declare all swap endpoint pairs.
   * Resets any existing paths.
   */
  function initSwapPaths(pairs: SwapEndpointPair[]) {
    const map = new Map<string, SwapPath>();
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
  }

  // ── Swap: pointer-down — decide which path to activate ───────────────────
  /**
   * Call from `onPointerDown`.
   * Returns `true` if a swap path was activated (so the caller can skip
   * other mode logic).
   */
  function swapPointerDown(coord: CellCoord): boolean {
    if (interactionMode !== "swap") return false;

    const key = cellKey(coord);

    // Clicked directly on a start or end point → activate that path.
    for (const [id, path] of swapPaths) {
      if (cellKey(path.startPoint) === key || cellKey(path.endPoint) === key) {
        activeSwapPathIdRef.current = id;

        // If tapping an endpoint that is already the head of the path, do
        // nothing (path is already at/beyond this point).
        // If tapping a point that is mid-path, cut back to that point.
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
    }

    // Clicked somewhere on an existing path body → activate that path and cut.
    for (const [id, path] of swapPaths) {
      if (path.keySet.has(key)) {
        activeSwapPathIdRef.current = id;
        setSwapPaths((prev) => {
          const next = new Map(prev);
          next.set(id, swapCutPathTo(prev.get(id)!, key));
          return next;
        });
        return true;
      }
    }

    // Clicked on an empty cell — no drag.
    activeSwapPathIdRef.current = null;
    return false;
  }

  /**
   * Call from `onDrag` / `onDragStart`.
   * Extends the active swap path toward `coord`, respecting collisions.
   */
  function swapDrag(coord: CellCoord) {
    if (interactionMode !== "swap") return;
    const id = activeSwapPathIdRef.current;
    if (!id) return;

    const targetKey = cellKey(coord);

    setSwapPaths((prev) => {
      const path = prev.get(id);
      if (!path) return prev;

      // Debounce.
      if (path.order[path.order.length - 1] === targetKey) return prev;

      // Is the target an earlier cell in this same path? → cut back.
      const ownIndex = path.order.indexOf(targetKey);
      if (ownIndex !== -1) {
        const next = new Map(prev);
        next.set(id, swapCutPathTo(path, targetKey));
        return next;
      }

      // Otherwise try to extend (blocked by other paths).
      const occupancy = buildOccupancyMap(prev, id);
      const axis = lastMoveAxisRef.current;
      const extended = swapExtendPath(path, targetKey, occupancy, axis);

      // Update axis for next step.
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
  }

  function swapPointerUp() {
    activeSwapPathIdRef.current = null;
  }

  // ── Generic cell interaction (non-swap modes) ─────────────────────────────
  function processCellInteraction(
    currentCoord: CellCoord,
    startCoord: CellCoord,
  ) {
    const targetKey = cellKey(currentCoord);

    setGridState((prev) => {
      if (prev.lastProcessedKey === targetKey) return prev;

      const { activeCellKeys: keySet, activeCellOrder: order } = prev;

      switch (interactionMode) {
        case "cell": {
          // Always replace with just this cell; persist after drag-end.
          const newSet = new Set<string>([targetKey]);
          return {
            ...prev,
            activeCellKeys: newSet,
            activeCellOrder: [targetKey],
            dragCurrentCoord: currentCoord,
            lastProcessedKey: targetKey,
          };
        }

        case "rect": {
          // activeCellKeys not used for rect — the derived `selectedCellKeys`
          // re-computes from dragStartCoord/dragCurrentCoord.
          // We do store the final rect in activeCellKeys on drag-end (handled
          // via persistRect flag below — caller passes startCoord).
          return {
            ...prev,
            dragCurrentCoord: currentCoord,
            lastProcessedKey: targetKey,
          };
        }

        case "paint": {
          const newSet = new Set(keySet);
          const newOrder = [...order];
          if (!newSet.has(targetKey)) {
            newSet.add(targetKey);
            newOrder.push(targetKey);
          }
          return {
            ...prev,
            activeCellKeys: newSet,
            activeCellOrder: newOrder,
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
          if (order.length > 0)
            lastMoveAxisRef.current = getMoveAxis(
              order[order.length - 1],
              targetKey,
            );
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
            if (didCut)
              return {
                ...prev,
                activeCellKeys: newSet,
                activeCellOrder: newOrder,
                lastProcessedKey: targetKey,
              };
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
          if (!keySet.has(targetKey)) return prev;
          const newSet = new Set(keySet);
          newSet.delete(targetKey);
          const newOrder = order.filter((k) => k !== targetKey);
          return {
            ...prev,
            activeCellKeys: newSet,
            activeCellOrder: newOrder,
            lastProcessedKey: targetKey,
          };
        }

        case "line": {
          const newSet = new Set<string>();
          const newOrder: string[] = [];
          if (startCoord.y === currentCoord.y) {
            const minX = Math.min(startCoord.x, currentCoord.x);
            const maxX = Math.max(startCoord.x, currentCoord.x);
            for (let x = minX; x <= maxX; x++) {
              const k = `${x}-${startCoord.y}`;
              newSet.add(k);
              newOrder.push(k);
            }
          } else if (startCoord.x === currentCoord.x) {
            const minY = Math.min(startCoord.y, currentCoord.y);
            const maxY = Math.max(startCoord.y, currentCoord.y);
            for (let y = minY; y <= maxY; y++) {
              const k = `${startCoord.x}-${y}`;
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
  }

  /**
   * Call this on drag-end for `rect` mode to persist the final rectangle
   * into `activeCellKeys`.
   */
  function persistRectSelection() {
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
  }

  const dragPreview = useMemo(() => {
    const { dragStartCoord, dragCurrentCoord } = gridState;
    if (!dragStartCoord || !dragCurrentCoord) return null;
    const x = Math.min(dragStartCoord.x, dragCurrentCoord.x);
    const y = Math.min(dragStartCoord.y, dragCurrentCoord.y);
    return {
      x,
      y,
      w: Math.abs(dragCurrentCoord.x - dragStartCoord.x) + 1,
      h: Math.abs(dragCurrentCoord.y - dragStartCoord.y) + 1,
    };
  }, [gridState]);

  // ── Derived selectedCellKeys ──────────────────────────────────────────────
  const selectedCellKeys = useMemo<Set<string>>(() => {
    const { dragStartCoord, dragCurrentCoord, activeCellKeys } = gridState;

    switch (interactionMode) {
      case "rect":
        // During drag: live rect preview; after drag: persisted activeCellKeys.
        if (dragStartCoord && dragCurrentCoord)
          return buildRectKeys(dragStartCoord, dragCurrentCoord);
        return activeCellKeys; // persisted

      case "cell":
        return activeCellKeys; // persisted single cell

      case "paint":
      case "erase":
      case "line":
      case "pathForward":
      case "pathBacktracable":
        return activeCellKeys;

      case "swap":
        // Merge all swap path keys for easy per-cell lookup.
        // (Games will usually access swapPaths directly for colour.)
        return new Set([...swapPaths.values()].flatMap((p) => [...p.keySet]));

      default:
        return new Set();
    }
  }, [gridState, interactionMode, swapPaths]);

  return {
    rows: puzzleSize.rows,
    cols: puzzleSize.cols,

    interactionMode,
    gridState,

    /** All cell keys that should appear "active" — use for simple highlight. */
    selectedCellKeys,

    /** Ordered path keys (path / line modes). */
    pathOrder: gridState.activeCellOrder,

    // ── Swap ────────────────────────────────────────────────────────────────
    /** All registered swap paths. Render these for the pipe/snake visuals. */
    swapPaths,
    initSwapPaths,
    swapPointerDown,
    swapDrag,
    swapPointerUp,

    // ── Generic ─────────────────────────────────────────────────────────────
    changeMode,
    reset,
    processCellInteraction,
    persistRectSelection,

    dragPreview,
    setDragCoords: (start: CellCoord | null, current: CellCoord | null) => {
      setGridState((prev) => ({
        ...prev,
        dragStartCoord: start,
        dragCurrentCoord: current,
      }));
    },
  };
}
