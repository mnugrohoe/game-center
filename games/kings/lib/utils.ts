import type { GenerateResult } from "../types";

// ─── Colors ──────────────────────────────────────────────────────────────────

export const REG_FILL = [
  "#162016","#161626","#261616","#262016",
  "#162022","#221a10","#1e1426","#141a22",
  "#22141a","#142018","#221414","#181c1c",
];

export const REG_BORDER_COLOR = [
  "rgba(74,158,106,0.5)","rgba(74,122,190,0.5)","rgba(190,74,74,0.5)","rgba(190,160,74,0.5)",
  "rgba(74,160,170,0.5)","rgba(170,140,74,0.5)","rgba(130,74,170,0.5)","rgba(74,110,160,0.5)",
  "rgba(160,74,110,0.5)","rgba(74,160,120,0.5)","rgba(160,100,74,0.5)","rgba(100,110,110,0.5)",
];

export const REGION_FILL_SOLVER = [
  "#1e2a1e","#1e1e2a","#2a1e1e","#2a241a",
  "#1a2426","#26201a","#22192a","#191f26",
  "#26191e","#1a261e","#261a1a","#1f2020",
];

export const REGION_BORDER_SOLVER = [
  "#4a8f4a","#4a4a8f","#8f4a4a","#8f7a2a",
  "#2a6f7a","#7a5a2a","#5f3a7a","#2a4f6f",
  "#6f2a4a","#2a6f4a","#6f3a2a","#3a4a4a",
];

// ─── Difficulty Tiers ─────────────────────────────────────────────────────────

export interface DiffTier {
  name: string;
  icon: string;
  diffScore: number;
  minGrid: number;
  maxGrid: number;
  color: string;
  dim: string;
  bright: string;
}

export const DIFF_TIERS: DiffTier[] = [
  { name:"Initiate", icon:"✦",  diffScore:1, minGrid:4,  maxGrid:5,  color:"#4a9e6a", dim:"#2a5e3a", bright:"#7ed4a0" },
  { name:"Squire",   icon:"⚔",  diffScore:2, minGrid:5,  maxGrid:6,  color:"#5a9e7a", dim:"#3a6e4a", bright:"#8adaaa" },
  { name:"Knight",   icon:"🛡",  diffScore:3, minGrid:6,  maxGrid:7,  color:"#4a7abe", dim:"#2a4a7e", bright:"#8ab4ee" },
  { name:"Baron",    icon:"⚜",  diffScore:4, minGrid:7,  maxGrid:8,  color:"#7a9a2a", dim:"#4a6a10", bright:"#b4d45a" },
  { name:"Lord",     icon:"👑",  diffScore:5, minGrid:7,  maxGrid:9,  color:"#a07a2a", dim:"#6a4a10", bright:"#d4aa5a" },
  { name:"King",     icon:"♚",  diffScore:6, minGrid:8,  maxGrid:10, color:"#9e4a9e", dim:"#5e2a6e", bright:"#cc80cc" },
  { name:"Warlord",  icon:"⚡",  diffScore:7, minGrid:9,  maxGrid:11, color:"#be4a4a", dim:"#7e1a1a", bright:"#ee8888" },
  { name:"Champion", icon:"🔱", diffScore:8, minGrid:10, maxGrid:12, color:"#cc6622", dim:"#8a3008", bright:"#ff9966" },
  { name:"Demon",    icon:"☠",  diffScore:9, minGrid:11, maxGrid:13, color:"#cc2222", dim:"#8a0808", bright:"#ff6666" },
];

// ─── RNG ─────────────────────────────────────────────────────────────────────

export function mkRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Wave Difficulty System ───────────────────────────────────────────────────
//
// Difficulty score 1–9 for a given level:
//   base  = log curve (1 at lvl1, ~7.5 at lvl1000)
//   wave  = 3 overlapping sine waves → oscillates up/down (the wave effect)
//   noise = per-level deterministic nudge so same level = same score
//
// The wave makes the difficulty non-monotonic: late levels can dip easy,
// early levels can briefly spike hard. But the log envelope ensures
// the overall difficulty still rises.

export function levelToDiffScore(level: number): number {
  const base = 1 + 6.5 * Math.log(level) / Math.log(1000);
  const wave =
    0.9 * Math.sin(level * 0.31 + 1.1) +
    0.5 * Math.sin(level * 0.07 + 2.3) +
    0.3 * Math.sin(level * 0.013 + 0.7);
  const rng = mkRng((level * 2654435761) ^ 0xc0ffee);
  const noise = (rng() - 0.5) * 1.2;
  return Math.max(1, Math.min(9, base + wave + noise));
}

export function diffScoreToTierIdx(score: number): number {
  return Math.max(0, Math.min(8, Math.round(score) - 1));
}

export function levelToTierIdx(level: number): number {
  return diffScoreToTierIdx(levelToDiffScore(level));
}

// ─── Puzzle Parameters ────────────────────────────────────────────────────────

export interface PuzzleParams {
  N: number;
  compactness: number; // 1=round blobs (easy), 0=spiky tentacles (hard)
  sizeVariance: number; // 0=equal sizes (easy), 1=wildly unequal (hard)
  label: string;
}

export function diffScoreToParams(score: number, rng: () => number): PuzzleParams {
  const baseN = 4 + (score - 1) * (9 / 8);
  const nVariance = (rng() - 0.5) * 1.2;
  const N = Math.max(4, Math.min(13, Math.round(baseN + nVariance)));
  const compactness = Math.max(0.1, Math.min(0.95, 0.9 - (score - 1) * 0.09));
  const sizeVariance = Math.max(0.0, Math.min(1.0, (score - 1) * 0.12));
  const labels = ["Trivial","Very Easy","Easy","Moderate","Medium","Tricky","Hard","Very Hard","Brutal"];
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

export function solveGrid(grid: number[][], N: number): [number, number][] | null {
  const numRegs = new Set(grid.flat()).size;
  const regionCells: [number, number][][] = Array.from({length: numRegs}, () => []);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      regionCells[grid[r][c]].push([r, c]);

  const kings: [number, number][] = [];
  const usedRow = new Set<number>(), usedCol = new Set<number>(), usedReg = new Set<number>();

  function conflicts(r: number, c: number): boolean {
    if (usedRow.has(r) || usedCol.has(c) || usedReg.has(grid[r][c])) return true;
    for (const [kr, kc] of kings) if (Math.abs(kr - r) <= 1 && Math.abs(kc - c) <= 1) return true;
    return false;
  }

  function bt(regIdx: number): boolean {
    if (regIdx === numRegs) return true;
    for (const [r, c] of regionCells[regIdx]) {
      if (!conflicts(r, c)) {
        kings.push([r, c]);
        usedRow.add(r); usedCol.add(c); usedReg.add(regIdx);
        if (bt(regIdx + 1)) return true;
        kings.pop(); usedRow.delete(r); usedCol.delete(c); usedReg.delete(regIdx);
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
  sizeVariance = 0.3
): GenerateResult | null {
  const MAX_ATTEMPTS = 120;
  const dirs: [number,number][] = [[-1,0],[1,0],[0,-1],[0,1]];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid: number[][] = Array.from({length:N}, () => Array(N).fill(-1));
    const seeds: [number,number][] = [];
    const used = new Set<number>();
    let tries = 0;

    while (seeds.length < N && tries < 800) {
      tries++;
      const r = Math.floor(rng() * N), c = Math.floor(rng() * N);
      const key = r * N + c;
      const minDist = Math.max(1, Math.floor(N / (Math.sqrt(N) + 1)));
      if (used.has(key)) continue;
      const tooClose = seeds.some(([sr, sc]) =>
        Math.abs(sr - r) + Math.abs(sc - c) < minDist
      );
      if (tooClose && seeds.length < N * 0.6) continue;
      used.add(key);
      seeds.push([r, c]);
    }
    if (seeds.length < N) continue;

    seeds.forEach(([r, c], i) => { grid[r][c] = i; });

    const queues: [number,number][][] = seeds.map(([r, c]) => [[r, c]]);
    const totalCells = N * N;
    const baseSize = totalCells / N;

    // Target sizes with controlled variance
    const targets = Array.from({length: N}, () => {
      const spread = sizeVariance * baseSize * 0.9;
      return Math.max(1, Math.round(baseSize + (rng() - 0.5) * 2 * spread));
    });
    const sumT = targets.reduce((a, b) => a + b, 0);
    const normTargets = targets.map(t => Math.max(1, Math.round((t / sumT) * totalCells)));
    const sizes = Array(N).fill(1);

    let filled = N;
    let iters = 0;

    while (filled < totalCells && iters++ < totalCells * 20) {
      // Weight regions by deficit from target
      const weights = Array.from({length: N}, (_, i) => {
        if (!queues[i].length) return 0;
        return Math.max(0.05, normTargets[i] - sizes[i]);
      });
      const totalW = weights.reduce((a, b) => a + b, 0);
      if (totalW === 0) break;

      let pick = rng() * totalW;
      let reg = 0;
      for (let i = 0; i < N; i++) { pick -= weights[i]; if (pick <= 0) { reg = i; break; } }
      if (!queues[reg].length) continue;

      // Compactness controls frontier selection
      let cellIdx: number;
      if (rng() < compactness) {
        cellIdx = queues[reg].length - 1 - Math.floor(rng() * Math.min(3, queues[reg].length));
      } else {
        cellIdx = Math.floor(rng() * queues[reg].length);
      }
      const [r, c] = queues[reg].splice(cellIdx, 1)[0];

      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === -1) {
          grid[nr][nc] = reg;
          queues[reg].push([nr, nc]);
          sizes[reg]++;
          filled++;
        }
      }
    }

    if (grid.flat().some(v => v === -1)) continue;

    // Validate connectivity + min size
    let valid = true;
    const regIds = [...new Set(grid.flat())].sort((a,b)=>a-b);
    for (const reg of regIds) {
      if (!valid) break;
      const cells: [number,number][] = [];
      for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (grid[r][c]===reg) cells.push([r,c]);
      if (cells.length < 2) { valid = false; break; }
      const vis = new Set([cells[0][0] * N + cells[0][1]]);
      const q: [number,number][] = [cells[0]];
      while (q.length) {
        const [r,c] = q.shift()!;
        for (const [dr,dc] of dirs) {
          const nr=r+dr, nc=c+dc, k=nr*N+nc;
          if (nr>=0&&nr<N&&nc>=0&&nc<N&&grid[nr][nc]===reg&&!vis.has(k)) {
            vis.add(k); q.push([nr,nc]);
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
  sizeCV: number;        // coefficient of variation — higher = more unequal
  compactnessScore: number; // 0–1, lower = spikier = harder shape
}

export function measureRegions(grid: number[][], N: number): RegionMetrics {
  const sizes: Record<number, number> = {};
  for (let r=0;r<N;r++) for (let c=0;c<N;c++)
    sizes[grid[r][c]] = (sizes[grid[r][c]]||0) + 1;
  const vals = Object.values(sizes);
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
  const stddev = Math.sqrt(vals.reduce((a,v)=>a+(v-avg)**2,0) / vals.length);

  let compSum = 0;
  for (const reg of Object.keys(sizes).map(Number)) {
    const cells: [number,number][] = [];
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (grid[r][c]===reg) cells.push([r,c]);
    const rows = cells.map(([r])=>r), cols = cells.map(([,c])=>c);
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

export function getRegionBorders(regions: number[][], r: number, c: number, N: number) {
  const reg = regions[r][c];
  return {
    top:    r === 0 || regions[r-1][c] !== reg,
    bottom: r === N-1 || regions[r+1][c] !== reg,
    left:   c === 0 || regions[r][c-1] !== reg,
    right:  c === N-1 || regions[r][c+1] !== reg,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
