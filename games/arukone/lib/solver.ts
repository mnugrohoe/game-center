import { CellKey } from "@/shared/components/ui/Grid";
import { Wall } from "@/shared/hooks/useGrid";
import { ArukonePuzzle } from "./generator";

export interface SolveArukoneProps {
  rows: ArukonePuzzle["rows"];
  cols: ArukonePuzzle["cols"];
  grid: ArukonePuzzle["grid"];
  walls: ArukonePuzzle["walls"];
}

export function solveArukone({
  rows,
  cols,
  grid,
  walls,
}: SolveArukoneProps): CellKey[] | null {
  const totalCells = rows * cols;

  const clues = Object.entries(grid)
    .filter(([, value]) => value !== "")
    .map(([cell, value]) => ({
      cell: cell as CellKey,
      value: Number(value),
    }))
    .sort((a, b) => a.value - b.value);

  if (clues.length === 0) return null;

  const start = clues[0];
  if (start.value !== 1) return null;

  const maxClue = clues[clues.length - 1].value;

  const clueMap = new Map<CellKey, number>();
  for (const clue of clues) {
    clueMap.set(clue.cell, clue.value);
  }

  // set of clue values that actually exist in the grid
  const clueValues = new Set(clues.map((c) => c.value));

  const wallSet = buildWallSet(walls);
  const visited = new Set<CellKey>();
  const path: CellKey[] = [];

  const nextExistingClue = (after: number): number => {
    let next = after + 1;
    while (next <= maxClue && !clueValues.has(next)) {
      next++;
    }
    return next; // will be > maxClue if none found — signals completion
  };

  const dfs = (current: CellKey, expectedClue: number): boolean => {
    visited.add(current);
    path.push(current);

    const clueValue = clueMap.get(current);
    let nextExpected = expectedClue;

    if (clueValue !== undefined && clueValue === expectedClue) {
      nextExpected = nextExistingClue(expectedClue);
    }

    if (path.length === totalCells) {
      if (nextExpected > maxClue) {
        const lastCell = path[path.length - 1];
        const lastClueCell = [...clueMap.entries()].find(
          ([, v]) => v === maxClue,
        )?.[0];
        if (lastClueCell && lastCell !== lastClueCell) {
          visited.delete(current);
          path.pop();
          return false;
        }
        return true;
      }
      visited.delete(current);
      path.pop();
      return false;
    }

    const neighbors = getValidNeighbors(current, rows, cols, wallSet)
      .filter((n) => !visited.has(n))
      .filter((n) => {
        const clue = clueMap.get(n);
        if (clue === undefined) return true;
        // only allow the exact next expected clue, block all others
        return clue === nextExpected;
      });

    neighbors.sort(
      (a, b) =>
        availableDegree(a, rows, cols, wallSet, visited) -
        availableDegree(b, rows, cols, wallSet, visited),
    );

    for (const next of neighbors) {
      if (!isConnectedAfterMove(next, rows, cols, wallSet, visited)) {
        continue;
      }
      if (dfs(next, nextExpected)) {
        return true;
      }
    }

    visited.delete(current);
    path.pop();
    return false;
  };

  const success = dfs(start.cell, 1);
  return success ? [...path] : null;
}

function wallKey(a: CellKey, b: CellKey): string {
  return [a, b].sort().join("|");
}

function buildWallSet(walls: Wall[]): Set<string> {
  const set = new Set<string>();

  for (const wall of walls) {
    const a = `${wall.c1}-${wall.r1}` as CellKey;
    const b = `${wall.c2}-${wall.r2}` as CellKey;

    set.add(wallKey(a, b));
  }

  return set;
}

function getValidNeighbors(
  cell: CellKey,
  rows: number,
  cols: number,
  wallSet: Set<string>,
): CellKey[] {
  const [x, y] = cell.split("-").map(Number);

  const result: CellKey[] = [];

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
      continue;
    }

    const next = `${nx}-${ny}` as CellKey;

    if (wallSet.has(wallKey(cell, next))) {
      continue;
    }

    result.push(next);
  }

  return result;
}

function availableDegree(
  cell: CellKey,
  rows: number,
  cols: number,
  wallSet: Set<string>,
  visited: Set<CellKey>,
): number {
  return getValidNeighbors(cell, rows, cols, wallSet).filter(
    (n) => !visited.has(n),
  ).length;
}

function isConnectedAfterMove(
  nextMove: CellKey,
  rows: number,
  cols: number,
  wallSet: Set<string>,
  visited: Set<CellKey>,
): boolean {
  const blocked = new Set<CellKey>(visited);
  blocked.add(nextMove);

  let start: CellKey | null = null;

  outer: for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = `${x}-${y}` as CellKey;

      if (!blocked.has(cell)) {
        start = cell;
        break outer;
      }
    }
  }

  if (!start) {
    return true;
  }

  const queue: CellKey[] = [start];
  const seen = new Set<CellKey>([start]);

  while (queue.length) {
    const current = queue.pop()!;

    for (const neighbor of getValidNeighbors(current, rows, cols, wallSet)) {
      if (blocked.has(neighbor)) {
        continue;
      }

      if (seen.has(neighbor)) {
        continue;
      }

      seen.add(neighbor);
      queue.push(neighbor);
    }
  }

  let remaining = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = `${x}-${y}` as CellKey;

      if (!blocked.has(cell)) {
        remaining++;
      }
    }
  }

  return seen.size === remaining;
}
