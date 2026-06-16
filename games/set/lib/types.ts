// types.ts

export type SymbolToken = "diamond" | "hourglass" | "love";
export type ColorToken = "red" | "green" | "purple";
export type TextureToken = "outline" | "striped" | "solid";
export type CountToken = 1 | 2 | 3;
export interface CardType {
  id: string;
  symbol: SymbolToken;
  color: ColorToken;
  texture: TextureToken;
  count: CountToken;
}

export interface Difficulty {
  name: string;
  symbol: string;
  boardCols: number;
  boardRows: number;
  targetSets: number;
  overlapFactor: number;
  maxExtraSets: number;
  nearMissTarget: number;
  entropy: number;
  visualNoise: number;
  timer?: number;
  hintPenalty?: number;
}
