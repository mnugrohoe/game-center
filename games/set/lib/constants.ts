// constants.ts
import { ColorToken, CountToken, SymbolToken, TextureToken } from "./types";

export const SYMBOLS: SymbolToken[] = ["diamond", "hourglass", "love"] as const;
export const COLORS: ColorToken[] = ["red", "green", "purple"] as const;
export const TEXTURES: TextureToken[] = [
  "outline",
  "striped",
  "solid",
] as const;
export const COUNTS: CountToken[] = [1, 2, 3] as const;
export const COLOR_MAP: Record<ColorToken, string> = {
  red: "#d84c4c",
  green: "#43b581",
  purple: "#69359c",
} as const;
