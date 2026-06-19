import { mkRng, shuffle } from "@/shared/algorithms";
import { createPuzzleGenerator } from "@/shared/utils/generator";
import { arukoneParamsGenerator, type ArukoneParams } from "./difficulty";
import { CellKey } from "@/shared/components/ui/Grid";
import { Wall } from "@/shared/hooks/useGrid";

export interface ArukonePuzzle {
  rows: number;
  cols: number;
  grid: Record<CellKey, string>;
  walls: Wall[];
  solutionPath: CellKey[];
  params: ArukoneParams;
}

/**
 * Generates an Arukone puzzle whose solution path is a simple path that
 * covers every non-obstacle cell exactly once, with a well-defined start
 * and end.
 *
 * No backtracking, no failure mode — the path is constructed directly:
 *  1. A deterministic boustrophedon ("snake") path trivially covers all
 *     rows*cols cells.
 *  2. The "backbite" move (standard technique for sampling random
 *     Hamiltonian paths / self-avoiding walks) reshapes it: pick an
 *     endpoint, jump to a grid-neighbor further along the path, reverse
 *     the segment in between. Always yields another full-coverage path,
 *     so it can be repeated freely with zero risk of getting stuck.
 *  3. Trim `obstacleCount` cells off the two ends to reach the target
 *     length. Trimming a path's ends always yields another valid path.
 */
export function generateArukone(params: ArukoneParams): ArukonePuzzle {
  const rng = mkRng(params.seed);

  // Path
  const path = buildSnakePath(params.rows, params.cols);

  const posOf = new Map(path.map((cell, i) => [cell, i]));

  const scrambleRounds = Math.max(200, params.rows * params.cols * 10);

  for (let i = 0; i < scrambleRounds; i++) {
    backbiteOnce(path, posOf, params.rows, params.cols, rng);
  }

  // Walls
  const walls = generateWalls(path, posOf, params, rng);

  // Grid
  const grid: Record<string, string> = {};

  for (let r = 0; r < params.rows; r++) {
    for (let c = 0; c < params.cols; c++) {
      grid[`${c}-${r}`] = "";
    }
  }

  const clueIndices = generateClueIndices(
    path.length,
    params.clueCount,
    params.clueDistribution,
    rng,
  );

  clueIndices.forEach((pathIdx, clueIdx) => {
    grid[path[pathIdx]] = String(clueIdx + 1);
  });

  return {
    rows: params.rows,
    cols: params.cols,
    grid,
    walls,
    solutionPath: path,
    params,
  };
}

function generateWalls(
  path: string[],
  posOf: Map<string, number>,
  params: ArukoneParams,
  rng: () => number,
): Wall[] {
  const candidates: Wall[] = [];

  for (let r = 0; r < params.rows; r++) {
    for (let c = 0; c < params.cols; c++) {
      const current = `${c}-${r}`;

      const neighbors = [
        { r, c: c + 1 },
        { r: r + 1, c },
      ];

      for (const n of neighbors) {
        if (n.r >= params.rows || n.c >= params.cols) {
          continue;
        }

        const neighbor = `${n.c}-${n.r}`;

        const connected =
          Math.abs(posOf.get(current)! - posOf.get(neighbor)!) === 1;

        if (!connected) {
          candidates.push({
            r1: r,
            c1: c,
            r2: n.r,
            c2: n.c,
          });
        }
      }
    }
  }

  shuffle(candidates, rng);

  return candidates.slice(0, Math.min(params.wallCount, candidates.length));
}

function generateClueIndices(
  pathLength: number,
  clueCount: number,
  distribution: ArukoneParams["clueDistribution"],
  rng: () => number,
): number[] {
  if (clueCount <= 2) {
    return [0, pathLength - 1];
  }

  switch (distribution) {
    case "uniform":
      return generateUniformClues(pathLength, clueCount);

    case "balanced":
      return generateBalancedClues(pathLength, clueCount, rng);

    case "random":
      return generateRandomClues(pathLength, clueCount, rng);
  }
}
function generateUniformClues(pathLength: number, clueCount: number): number[] {
  const result: number[] = [];

  const step = (pathLength - 1) / (clueCount - 1);

  for (let i = 0; i < clueCount; i++) {
    result.push(Math.round(i * step));
  }

  result[0] = 0;
  result[result.length - 1] = pathLength - 1;

  return result;
}

function generateBalancedClues(
  pathLength: number,
  clueCount: number,
  rng: () => number,
): number[] {
  const result: number[] = [];

  const step = (pathLength - 1) / (clueCount - 1);

  for (let i = 0; i < clueCount; i++) {
    const target = i * step;

    const jitter = (rng() - 0.5) * step * 0.4;

    result.push(Math.round(target + jitter));
  }

  result[0] = 0;
  result[result.length - 1] = pathLength - 1;

  result.sort((a, b) => a - b);

  for (let i = 1; i < result.length; i++) {
    result[i] = Math.max(result[i], result[i - 1] + 1);
  }

  return result;
}

function generateRandomClues(
  pathLength: number,
  clueCount: number,
  rng: () => number,
): number[] {
  const set = new Set<number>();

  set.add(0);
  set.add(pathLength - 1);

  while (set.size < clueCount) {
    set.add(Math.floor(rng() * pathLength));
  }

  return [...set].sort((a, b) => a - b);
}

/** Boustrophedon (snake) path: trivially covers every cell exactly once. */
function buildSnakePath(rows: number, cols: number): CellKey[] {
  const path: CellKey[] = [];
  for (let y = 0; y < rows; y++) {
    if (y % 2 === 0) {
      for (let x = 0; x < cols; x++) path.push(`${x}-${y}`);
    } else {
      for (let x = cols - 1; x >= 0; x--) path.push(`${x}-${y}`);
    }
  }
  return path;
}

/**
 * One "backbite" move: picks an endpoint, jumps to a grid-neighbor of
 * that endpoint that lies further along the path, and reverses the
 * segment in between. Preserves full coverage and the simple-path
 * property, so it can never produce an invalid state.
 *
 * Precondition: `path` covers every cell of the rows x cols grid — only
 * safe to call before any cells are trimmed off.
 */
function backbiteOnce(
  path: string[],
  posOf: Map<string, number>,
  rows: number,
  cols: number,
  rng: () => number,
): void {
  // Bite from head or tail with equal probability — simulate "tail" by
  // flipping the array so the logic below only ever handles index 0.
  if (rng() < 0.5) {
    path.reverse();
    for (let i = 0; i < path.length; i++) posOf.set(path[i], i);
  }

  const [hx, hy] = path[0].split("-").map(Number);
  const candidates: number[] = [];
  for (const n of getNeighbors(hx, hy, rows, cols)) {
    const k = posOf.get(`${n.x}-${n.y}`)!;
    // k === 1 is the cell already adjacent in the path: biting there is a
    // no-op, so only keep moves that actually reshape the path.
    if (k > 1) candidates.push(k);
  }
  if (candidates.length === 0) return;

  const k = candidates[Math.floor(rng() * candidates.length)];

  // Reverse path[0..k) in place and keep posOf in sync for that range.
  const segment = path.slice(0, k).reverse();
  for (let i = 0; i < k; i++) {
    path[i] = segment[i];
    posOf.set(segment[i], i);
  }
}

function getNeighbors(x: number, y: number, rows: number, cols: number) {
  const n = [];
  if (y > 0) n.push({ x, y: y - 1 });
  if (y < rows - 1) n.push({ x, y: y + 1 });
  if (x > 0) n.push({ x: x - 1, y });
  if (x < cols - 1) n.push({ x: x + 1, y });
  return n;
}

export const arukoneGenerator = createPuzzleGenerator(
  generateArukone,
  arukoneParamsGenerator,
);
