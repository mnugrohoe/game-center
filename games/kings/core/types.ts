export type CellState = 0 | 1 | 2;

export type Position = [number, number];

export interface Tier {
  name: string;
  icon: string;
  diffScore: number;
  minGrid: number;
  maxGrid: number;
  color: string;
  dim: string;
  bright: string;
}

export interface GenerateResult {
  grid: number[][];
  solution: Position[];
}

export interface GameState {
  grid: number[][];
  solution: Position[];
  size: number;
  cellStates: CellState[][];
  autoLocked: boolean[][];
}

export interface HistoryState {
  states: CellState[][];
  locked: boolean[][];
}

export type SolState = "" | "king" | "territory" | "blocked";

export interface StatusConfig {
  bg: string;
  border: string;
  color: string;
}

export type StatusType = "edit" | "ok" | "err" | "solve";

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
