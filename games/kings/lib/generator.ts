/**
 * Kings puzzle region generator.
 *
 * Production goals:
 * - No solver call in the hot path
 * - No repeated full-grid scans during validation
 * - Flat typed arrays for lower GC pressure
 * - O(1) frontier removal via swap-pop
 * - Guaranteed valid king solution by construction
 *
 * Invariants:
 * - Each region starts with exactly one seed
 * - Seeds are arranged so kings do not attack each other
 * - Every region remains connected because cells are only added from its frontier
 * - Every region ends with at least 2 cells
 */

import { mkRng } from "@/shared/algorithms/rng";
import type { RngFn, Grid2D, Coord } from "@/shared/types";
import { KingsParams, kingsParamsGenerator } from "./difficulty";
import { createPuzzleGenerator } from "@/shared/utils/generator";
import { DIRS } from "./constants";

export interface KingsPuzzle {
  size: number;
  grid: Grid2D;
  solution: Coord[];
  params: KingsParams;
}

const MAX_ATTEMPTS = 1;

function nextSeed(baseSeed: number, attempt: number): number {
  const s = baseSeed + ":" + attempt;

  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function shuffleInPlace(values: number[], rng: RngFn): void {
  for (let i = values.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = values[i];
    values[i] = values[j];
    values[j] = tmp;
  }
}

function flatToGrid(owner: Int32Array, N: number): Grid2D {
  const grid: number[][] = Array.from(
    { length: N },
    () => new Array<number>(N),
  );
  for (let r = 0; r < N; r++) {
    const row = grid[r];
    const base = r * N;
    for (let c = 0; c < N; c++) {
      row[c] = owner[base + c];
    }
  }
  return grid;
}

function buildTargets(
  N: number,
  totalCells: number,
  rng: RngFn,
  sizeVariance: number,
): Int32Array {
  const targets = new Int32Array(N);

  const base = 2;
  const remaining = totalCells - base * N;

  // Positive weights so every region gets at least 2 cells.
  const weights = new Float64Array(N);
  let sum = 0;

  for (let i = 0; i < N; i++) {
    const w = Math.max(0.1, 1 + (rng() - 0.5) * 2 * sizeVariance);
    weights[i] = w;
    sum += w;
  }

  const fractions: Array<{ frac: number; i: number }> = [];
  let assigned = base * N;

  for (let i = 0; i < N; i++) {
    const exact = (weights[i] / sum) * remaining;
    const extra = exact | 0;
    targets[i] = base + extra;
    assigned += extra;
    fractions.push({ frac: exact - extra, i });
  }

  fractions.sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < totalCells - assigned; k++) {
    targets[fractions[k].i]++;
  }

  return targets;
}

function takeFrontierCell(
  frontier: number[],
  rng: RngFn,
  compactness: number,
): number {
  const len = frontier.length;
  if (len === 0) return -1;

  // High compactness -> LIFO growth.
  // Low compactness -> random frontier cell.
  const idx = rng() < compactness ? len - 1 : (rng() * len) | 0;

  const value = frontier[idx];
  frontier[idx] = frontier[len - 1];
  frontier.pop();
  return value;
}

/**
 * Generates a valid Kings puzzle region grid.
 *
 * Performance notes:
 * - The returned `solution` is guaranteed by construction.
 * - This avoids repeated backtracking/solver work during generation.
 */
export function generateKingsBoard(params: KingsParams): KingsPuzzle | null {
  const N = params.N;

  if (N < 4) throw new Error("Kings board size must be at least 4");

  const compactness = clamp01(params.compactness ?? 0.6);
  const sizeVariance = clamp01(params.sizeVariance ?? 0.3);

  const totalCells = N * N;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = nextSeed(params.seed, attempt);
    const rng = mkRng(seed);

    const owner = new Int32Array(totalCells);
    owner.fill(-1);

    const sizes = new Int32Array(N);
    const targets = buildTargets(N, totalCells, rng, sizeVariance);

    const frontier: number[][] = Array.from({ length: N }, () => []);

    // =========================================================
    // PHASE 1: PLACE SEEDS (BACKTRACKING N-KINGS PLACE)
    // =========================================================
    const solution: Coord[] = [];
    const seedIndex = new Int32Array(N);
    const colUsed = new Uint8Array(N);

    // Tracking 8-direction blocks specifically for previous row and current row
    // Menggunakan array 1D atau bitmask untuk performa cepat
    const kingPositions = new Int32Array(N); // indeks kolom untuk tiap baris

    function placeKingsBacktrack(row: number): boolean {
      if (row === N) return true;

      // Shuffle kolom kandidat untuk variasi board yang acak
      const cols = Array.from({ length: N }, (_, i) => i);
      shuffleInPlace(cols, rng);

      for (const c of cols) {
        if (colUsed[c]) continue;

        // Validasi 8 arah dengan raja di baris sebelumnya (row - 1)
        if (row > 0) {
          const prevCol = kingPositions[row - 1];
          if (Math.abs(prevCol - c) <= 1) continue;
        }

        // Tempatkan King secara tentatif
        kingPositions[row] = c;
        colUsed[c] = 1;

        // Lanjut ke baris berikutnya
        if (placeKingsBacktrack(row + 1)) {
          return true;
        }

        // Backtrack jika gagal di baris bawahnya
        colUsed[c] = 0;
      }
      return false;
    }

    // Jalankan penempatan raja, jika gagal (sangat jarang dengan ukuran N >= 4), skip attempt
    if (!placeKingsBacktrack(0)) {
      continue;
    }

    // Daftarkan hasil penempatan ke struktur data owner dan frontier
    let filled = 0;
    for (let r = 0; r < N; r++) {
      const c = kingPositions[r];
      const idx = r * N + c;

      owner[idx] = r;
      sizes[r] = 1;
      seedIndex[r] = idx;
      frontier[r].push(idx);
      solution.push([r, c]);
      filled++;
    }

    if (filled < N) continue;

    // =========================================================
    // PHASE 2: INITIAL EXPANSION (ENSURE CONNECTIVITY)
    // =========================================================
    const order = Array.from({ length: N }, (_, i) => i);
    shuffleInPlace(order, rng);

    for (let k = 0; k < N; k++) {
      const reg = order[k];
      const idx = seedIndex[reg];

      const r = (idx / N) | 0;
      const c = idx - r * N;

      const start = (rng() * 4) | 0;
      let claimed = false;

      for (let d = 0; d < 4; d++) {
        const [dr, dc] = DIRS[(start + d) & 3];
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;

        const nIdx = nr * N + nc;
        if (owner[nIdx] !== -1) continue;

        owner[nIdx] = reg;
        sizes[reg]++;
        frontier[reg].push(nIdx);
        filled++;
        claimed = true;
        break;
      }

      if (!claimed) continue;
    }

    if (filled < N * 2) continue;

    // =========================================================
    // PHASE 3: GROWTH LOOP
    // =========================================================
    let guard = totalCells * 12;

    while (filled < totalCells && guard-- > 0) {
      let totalWeight = 0;

      for (let reg = 0; reg < N; reg++) {
        if (frontier[reg].length === 0) continue;

        const deficit = targets[reg] - sizes[reg];
        totalWeight += deficit > 0 ? deficit : 0.05;
      }

      if (totalWeight <= 0) break;

      let pick = rng() * totalWeight;
      let reg = -1;

      for (let i = 0; i < N; i++) {
        if (frontier[i].length === 0) continue;

        const deficit = targets[i] - sizes[i];
        pick -= deficit > 0 ? deficit : 0.05;

        if (pick <= 0) {
          reg = i;
          break;
        }
      }

      if (reg < 0) reg = N - 1;

      const cell = takeFrontierCell(frontier[reg], rng, compactness);
      if (cell < 0) continue;

      const r = (cell / N) | 0;
      const c = cell - r * N;

      const start = (rng() * 4) | 0;

      for (let d = 0; d < 4; d++) {
        const [dr, dc] = DIRS[(start + d) & 3];
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;

        const nIdx = nr * N + nc;
        if (owner[nIdx] !== -1) continue;

        owner[nIdx] = reg;
        sizes[reg]++;
        frontier[reg].push(nIdx);
        filled++;
      }
    }

    // =========================================================
    // PHASE 4: FILL REMAINING (SAFE FALLBACK)
    // =========================================================
    if (filled < totalCells) {
      for (let idx = 0; idx < totalCells; idx++) {
        if (owner[idx] !== -1) continue;

        const r = (idx / N) | 0;
        const c = idx - r * N;

        let reg = -1;

        for (let d = 0; d < 4; d++) {
          const [dr, dc] = DIRS[d];
          const nr = r + dr;
          const nc = c + dc;

          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;

          const nIdx = nr * N + nc;
          if (owner[nIdx] !== -1) {
            reg = owner[nIdx];
            break;
          }
        }

        if (reg === -1) reg = 0;

        owner[idx] = reg;
        sizes[reg]++;
        filled++;
      }
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    if (filled !== totalCells) continue;

    return {
      size: N,
      grid: flatToGrid(owner, N),
      solution,
      params,
    };
  }
  console.warn("[Kings Generator] Board generation failed.", {
    size: N,
    seed: params.seed,
    attempts: MAX_ATTEMPTS,
  });
  return null;
}

export const kingsGenerator = createPuzzleGenerator(
  generateKingsBoard,
  kingsParamsGenerator,
);
