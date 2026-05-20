import type { GenerateResult } from "./types";

// ─── Puzzle Parameters ────────────────────────────────────────────────────────

export interface PuzzleParams {
  N: number;
  compactness: number; // 1=round blobs (easy), 0=spiky tentacles (hard)
  sizeVariance: number; // 0=equal sizes (easy), 1=wildly unequal (hard)
  label: string;
}

export function diffScoreToParams(
  score: number,
  rng: () => number,
): PuzzleParams {
  const baseN = 4 + (score - 1) * (9 / 8);
  const nVariance = (rng() - 0.5) * 1.2;
  const N = Math.max(4, Math.min(13, Math.round(baseN + nVariance)));
  const compactness = Math.max(0.1, Math.min(0.95, 0.9 - (score - 1) * 0.09));
  const sizeVariance = Math.max(0.0, Math.min(1.0, (score - 1) * 0.12));
  const labels = [
    "Trivial",
    "Very Easy",
    "Easy",
    "Moderate",
    "Medium",
    "Tricky",
    "Hard",
    "Very Hard",
    "Brutal",
  ];
  const label = labels[Math.max(0, Math.min(8, Math.round(score) - 1))];
  return { N, compactness, sizeVariance, label };
}

export function seedFromLevel(level: number): number {
  return ((level * 2654435761) ^ 0xdeadbeef) >>> 0;
}

export function seedFromDiff(tierIdx: number, entropy: number): number {
  return ((tierIdx * 999983 + entropy * 2654435761) ^ 0xabcdef12) >>> 0;
}

// ─── Solver ───────────────────────────────────────────────────────────────────

export function solveGrid(
  grid: number[][],
  N: number,
): [number, number][] | null {
  const numRegs = new Set(grid.flat()).size;
  const regionCells: [number, number][][] = Array.from(
    { length: numRegs },
    () => [],
  );
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) regionCells[grid[r][c]].push([r, c]);

  const kings: [number, number][] = [];
  const usedRow = new Set<number>(),
    usedCol = new Set<number>(),
    usedReg = new Set<number>();

  function conflicts(r: number, c: number): boolean {
    if (usedRow.has(r) || usedCol.has(c) || usedReg.has(grid[r][c]))
      return true;
    for (const [kr, kc] of kings)
      if (Math.abs(kr - r) <= 1 && Math.abs(kc - c) <= 1) return true;
    return false;
  }

  function bt(regIdx: number): boolean {
    if (regIdx === numRegs) return true;
    for (const [r, c] of regionCells[regIdx]) {
      if (!conflicts(r, c)) {
        kings.push([r, c]);
        usedRow.add(r);
        usedCol.add(c);
        usedReg.add(regIdx);
        if (bt(regIdx + 1)) return true;
        kings.pop();
        usedRow.delete(r);
        usedCol.delete(c);
        usedReg.delete(regIdx);
      }
    }
    return false;
  }

  return bt(0) ? [...kings] : null;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateRegions(
  N: number,
  rng: () => number,
  compactness = 0.6,
  sizeVariance = 0.3,
): GenerateResult | null {
  const MAX_ATTEMPTS = 120;
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid: number[][] = Array.from({ length: N }, () => Array(N).fill(-1));
    const seeds: [number, number][] = [];
    const used = new Set<number>();
    let tries = 0;

    while (seeds.length < N && tries < 800) {
      tries++;
      const r = Math.floor(rng() * N),
        c = Math.floor(rng() * N);
      const key = r * N + c;
      const minDist = Math.max(1, Math.floor(N / (Math.sqrt(N) + 1)));
      if (used.has(key)) continue;
      const tooClose = seeds.some(
        ([sr, sc]) => Math.abs(sr - r) + Math.abs(sc - c) < minDist,
      );
      if (tooClose && seeds.length < N * 0.6) continue;
      used.add(key);
      seeds.push([r, c]);
    }
    if (seeds.length < N) continue;

    seeds.forEach(([r, c], i) => {
      grid[r][c] = i;
    });

    const queues: [number, number][][] = seeds.map(([r, c]) => [[r, c]]);
    const totalCells = N * N;
    const baseSize = totalCells / N;

    // Target sizes with controlled variance
    const targets = Array.from({ length: N }, () => {
      const spread = sizeVariance * baseSize * 0.9;
      return Math.max(1, Math.round(baseSize + (rng() - 0.5) * 2 * spread));
    });
    const sumT = targets.reduce((a, b) => a + b, 0);
    const normTargets = targets.map((t) =>
      Math.max(1, Math.round((t / sumT) * totalCells)),
    );
    const sizes = Array(N).fill(1);

    let filled = N;
    let iters = 0;

    while (filled < totalCells && iters++ < totalCells * 20) {
      // Weight regions by deficit from target
      const weights = Array.from({ length: N }, (_, i) => {
        if (!queues[i].length) return 0;
        return Math.max(0.05, normTargets[i] - sizes[i]);
      });
      const totalW = weights.reduce((a, b) => a + b, 0);
      if (totalW === 0) break;

      let pick = rng() * totalW;
      let reg = 0;
      for (let i = 0; i < N; i++) {
        pick -= weights[i];
        if (pick <= 0) {
          reg = i;
          break;
        }
      }
      if (!queues[reg].length) continue;

      // Compactness controls frontier selection
      let cellIdx: number;
      if (rng() < compactness) {
        cellIdx =
          queues[reg].length -
          1 -
          Math.floor(rng() * Math.min(3, queues[reg].length));
      } else {
        cellIdx = Math.floor(rng() * queues[reg].length);
      }
      const [r, c] = queues[reg].splice(cellIdx, 1)[0];

      for (const [dr, dc] of dirs) {
        const nr = r + dr,
          nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === -1) {
          grid[nr][nc] = reg;
          queues[reg].push([nr, nc]);
          sizes[reg]++;
          filled++;
        }
      }
    }

    if (grid.flat().some((v) => v === -1)) continue;

    // Validate connectivity + min size
    let valid = true;
    const regIds = [...new Set(grid.flat())].sort((a, b) => a - b);
    for (const reg of regIds) {
      if (!valid) break;
      const cells: [number, number][] = [];
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) if (grid[r][c] === reg) cells.push([r, c]);
      if (cells.length < 2) {
        valid = false;
        break;
      }
      const vis = new Set([cells[0][0] * N + cells[0][1]]);
      const q: [number, number][] = [cells[0]];
      while (q.length) {
        const [r, c] = q.shift()!;
        for (const [dr, dc] of dirs) {
          const nr = r + dr,
            nc = c + dc,
            k = nr * N + nc;
          if (
            nr >= 0 &&
            nr < N &&
            nc >= 0 &&
            nc < N &&
            grid[nr][nc] === reg &&
            !vis.has(k)
          ) {
            vis.add(k);
            q.push([nr, nc]);
          }
        }
      }
      if (vis.size !== cells.length) valid = false;
    }
    if (!valid) continue;

    const sol = solveGrid(grid, N);
    if (sol) return { grid, solution: sol };
  }
  return null;
}

// ─── Region metrics ───────────────────────────────────────────────────────────

export interface RegionMetrics {
  minSize: number;
  maxSize: number;
  sizeCV: number; // coefficient of variation — higher = more unequal
  compactnessScore: number; // 0–1, lower = spikier = harder shape
}

export function measureRegions(grid: number[][], N: number): RegionMetrics {
  const sizes: Record<number, number> = {};
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      sizes[grid[r][c]] = (sizes[grid[r][c]] || 0) + 1;
  const vals = Object.values(sizes);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const stddev = Math.sqrt(
    vals.reduce((a, v) => a + (v - avg) ** 2, 0) / vals.length,
  );

  let compSum = 0;
  for (const reg of Object.keys(sizes).map(Number)) {
    const cells: [number, number][] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) if (grid[r][c] === reg) cells.push([r, c]);
    const rows = cells.map(([r]) => r),
      cols = cells.map(([, c]) => c);
    const rSpan = Math.max(...rows) - Math.min(...rows) + 1;
    const cSpan = Math.max(...cols) - Math.min(...cols) + 1;
    compSum += cells.length / (rSpan * cSpan);
  }

  return {
    minSize: Math.min(...vals),
    maxSize: Math.max(...vals),
    sizeCV: stddev / avg,
    compactnessScore: compSum / vals.length,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRegionBorders(
  regions: number[][],
  r: number,
  c: number,
  N: number,
) {
  const reg = regions[r][c];
  return {
    top: r === 0 || regions[r - 1][c] !== reg,
    bottom: r === N - 1 || regions[r + 1][c] !== reg,
    left: c === 0 || regions[r][c - 1] !== reg,
    right: c === N - 1 || regions[r][c + 1] !== reg,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
