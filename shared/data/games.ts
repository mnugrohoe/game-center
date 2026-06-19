import { GameMetadata } from "@/shared/types";
import { meta as shikakuMeta } from "@/games/shikaku";
import { meta as setsMeta } from "@/games/set";
import { meta as kingsMeta } from "@/games/kings";
import { meta as mamboMeta } from "@/games/mambo";
import { meta as towerMeta } from "@/games/tower";
import { meta as arukoneMeta } from "@/games/arukone";

export const allGames: GameMetadata[] = [
  shikakuMeta,
  setsMeta,
  kingsMeta,
  mamboMeta,
  towerMeta,
  arukoneMeta,
];
