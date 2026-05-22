// constants.ts

import { SetCard, SetColor, SetSymbol, SetTexture } from "./types";

export const SYMBOLS: SetSymbol[] = ["diamond", "hourglass", "x"];

export const COLORS: SetColor[] = ["red", "green", "purple"];

export const TEXTURES: SetTexture[] = ["outline", "striped", "solid"];

export const COUNTS = [1, 2, 3] as const;

export const ALL_CARDS: SetCard[] = [];

let id = 0;

for (const symbol of SYMBOLS)
  for (const color of COLORS)
    for (const texture of TEXTURES)
      for (const count of COUNTS) {
        ALL_CARDS.push({
          id: `set-${id++}`,

          symbol,
          color,
          texture,
          count,
        });
      }

export const COLOR_MAP: Record<SetColor, string> = {
  red: "#d84c4c",
  green: "#43b581",
  purple: "#69359c",
};
