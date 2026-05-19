/**
 * Kings puzzle region generator.
 * Uses shared RNG, grid algorithms, and the Kings solver.
 *
 * Generates a valid N×N region map where:
 *   - Every cell belongs to exactly one of N regions
 *   - Every region is connected (BFS-verified)
 *   - Every region has ≥ 2 cells
 *   - The puzzle has at least one valid king placement
 *
 * Difficulty axes (controlled by compactness + sizeVariance):
 *   - compactness: 1 = round blobs (easy to reason about), 0 = spiky tentacles (hard)
 *   - sizeVariance: 0 = all regions equal size, 1 = wildly unequal (creates traps)
 */

import { weightedRandom } from "@/shared/algorithms/rng";
import { isConnected, getRegionIds, makeGrid, cloneGrid } from "@/shared/algorithms/grid";
import { solveKings } from "./solver";
import type { RngFn, Grid2D, Coord } from "@/shared/types";

export interface GenerateResult {
  grid: Grid2D;
  solution: Coord[];
}

/**
 * Generates a valid Kings puzzle region grid.
 *
 * @param N           - Grid size (= number of regions = number of kings).
 * @param rng         - Seeded RNG (from mkRng) for reproducibility.
 * @param compactness - 0–1. Higher = rounder blob shapes (easier). Lower = spiky (harder).
 * @param sizeVariance - 0–1. Higher = more unequal region sizes (harder).
 * @returns { grid, solution } or null if generation failed after MAX_ATTEMPTS.
 */
export function generateKingsRegions(
  N: number,
  rng: RngFn,
  compactness = 0.6,
  sizeVariance = 0.3
): GenerateResult | null {
  const MAX_ATTEMPTS = 120;
  const DIRS: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid = makeGrid(N, N, -1);

    // ── Place seeds with minimum spacing ─────────────────────────────────────
    const seeds: Coord[] = [];
    const usedKeys = new Set<number>();
    let tries = 0;
    const minDist = Math.max(1, Math.floor(N / (Math.sqrt(N) + 1)));

    while (seeds.length < N && tries < 800) {
      tries++;
      const r = Math.floor(rng() * N);
      const c = Math.floor(rng() * N);
      const key = r * N + c;
      if (usedKeys.has(key)) continue;
      // Enforce spacing unless we're crowded for space
      const tooClose = seeds.some(([sr, sc]) =>
        Math.abs(sr - r) + Math.abs(sc - c) < minDist
      );
      if (tooClose && seeds.length < N * 0.6) continue;
      usedKeys.add(key);
      seeds.push([r, c]);
    }
    if (seeds.length < N) continue;

    // Mark seeds
    seeds.forEach(([r, c], i) => { grid[r][c] = i; });

    // ── Voronoi expansion with size targets ───────────────────────────────────
    const queues: Coord[][] = seeds.map(seed => [seed]);
    const totalCells = N * N;
    const baseSize = totalCells / N;

    // Compute target sizes — sizeVariance controls spread from equal
    const rawTargets = Array.from({ length: N }, () => {
      const spread = sizeVariance * baseSize * 0.9;
      return Math.max(1, Math.round(baseSize + (rng() - 0.5) * 2 * spread));
    });
    const sumT = rawTargets.reduce((a, b) => a + b, 0);
    const targets = rawTargets.map(t => Math.max(1, Math.round((t / sumT) * totalCells)));
    const sizes = Array(N).fill(1); // 1 per seed already placed

    let filled = N;
    let iters = 0;

    while (filled < totalCells && iters++ < totalCells * 20) {
      // Pick region weighted by how far it is from its target
      const weights = Array.from({ length: N }, (_, i) =>
        queues[i].length === 0 ? 0 : Math.max(0.05, targets[i] - sizes[i])
      );
      if (weights.every(w => w === 0)) break;

      const reg = weightedRandom(weights, rng);
      if (!queues[reg].length) continue;

      // Compactness: high → pick from back of queue (recently added = compact growth)
      //              low  → pick randomly (sprawling growth)
      const qLen = queues[reg].length;
      const cellIdx = rng() < compactness
        ? qLen - 1 - Math.floor(rng() * Math.min(3, qLen))
        : Math.floor(rng() * qLen);

      const [r, c] = queues[reg].splice(cellIdx, 1)[0];

      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === -1) {
          grid[nr][nc] = reg;
          queues[reg].push([nr, nc]);
          sizes[reg]++;
          filled++;
        }
      }
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    if (grid.flat().some(v => v === -1)) continue;

    const regIds = getRegionIds(grid);
    let valid = true;

    for (const reg of regIds) {
      const cells: Coord[] = [];
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
          if (grid[r][c] === reg) cells.push([r, c]);

      if (cells.length < 2) { valid = false; break; }
      if (!isConnected(cells, grid, reg)) { valid = false; break; }
    }
    if (!valid) continue;

    // ── Solve ─────────────────────────────────────────────────────────────────
    const solution = solveKings(grid, N);
    if (solution) return { grid, solution };
  }

  return null;
}
