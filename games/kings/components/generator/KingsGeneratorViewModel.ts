// Intentionally lightweight typing so ESLint doesn't complain about `any`.
// We avoid importing the full KingGame type graph here.
export type KingsGeneratorGameRef = {
  mode: "level" | "diff";
  setMode: (m: "level" | "diff") => void;
  currentLevel: number;
  currentTierIdx: number;
  selectedTier: number;
  generating: boolean;
  currentGrid: number[][] | null;
  currentN: number;
  cellPx: number;
  levelPct: (level: number) => number;
  handleChangeLevel: (level: number) => void;
  setSelectedTier: (tier: number) => void;
  generate: () => void;

  // Board interactions
  autoLocked: boolean[][];
  territory: boolean[][];
  cellStates: number[][];
  hasConflict: (
    states: unknown[][],
    grid: number[][],
    r: number,
    c: number,
    n: number,
  ) => boolean;

  handleLeft: (r: number, c: number) => void;
  handleDbl: (r: number, c: number) => void;
  handleRight: (e: React.MouseEvent, r: number, c: number) => void;

  numKings: number;
  hasAnyConflict: boolean;
  elapsed: number;
  won: boolean;

  resetPuzzle: () => void;
  clearMarks: () => void;
  undoMove: () => void;
  showHint: () => void;
  moveHistory: unknown[];
};
