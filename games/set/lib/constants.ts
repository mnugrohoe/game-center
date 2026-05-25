// constants.ts

import { SetColor, SetCount, SetSymbol, SetTexture } from "./types";

export const SYMBOLS: SetSymbol[] = ["diamond", "hourglass", "x"] as const;
export const COLORS: SetColor[] = ["red", "green", "purple"] as const;
export const TEXTURES: SetTexture[] = ["outline", "striped", "solid"] as const;
export const COUNTS: SetCount[] = [1, 2, 3] as const;
export const COLOR_MAP: Record<SetColor, string> = {
  red: "#d84c4c",
  green: "#43b581",
  purple: "#69359c",
} as const;
