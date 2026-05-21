// types.ts

export type SetSymbol = "diamond" | "hourglass" | "x";

export type SetColor = "red" | "green" | "purple";

export type SetTexture = "outline" | "striped" | "solid";

export interface SetCard {
  id: string;

  symbol: SetSymbol;
  color: SetColor;
  texture: SetTexture;

  count: 1 | 2 | 3;
}

export interface Difficulty {
  name: string;
  symbol: string;

  boardCols: number;
  boardRows: number;

  ensureSets: number;

  allowNearMiss: boolean;

  timer?: number;
  hintPenalty?: number;
}
