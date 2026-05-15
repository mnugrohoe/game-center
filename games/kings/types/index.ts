export type CellState = 0 | 1 | 2; // 0=empty, 1=mark, 2=king
export type SolState = "" | "king" | "territory" | "blocked";

export interface Puzzle {
  label: string;
  size: number;
  regions: number[][];
}

export interface PuzzleMap {
  [key: string]: Puzzle;
}

export interface HistoryEntry {
  states: CellState[][];
  auto: boolean[][];
}

export interface GenerateResult {
  grid: number[][];
  solution: [number, number][];
}
