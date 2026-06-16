import { GameMetadata } from "@/shared/types";
import MamboLogo from "./components/MamboLogo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";
export * from "./types";

export const meta: GameMetadata = {
  id: "mambo",
  name: "Mambo",
  description:
    "Isi papan grid genap dengan komponen Matahari (Sun) dan Bulan (Moon). Jaga keseimbangan jumlah komponen di setiap baris dan kolom, hindari deretan beruntun, serta patuhi batasan hubungan antar sel.",
  version: "1.0.0",
  tags: [
    "puzzle",
    "logic",
    "grid-based",
    "binary-puzzle",
    "constraint-satisfaction",
  ],
  icon: MamboLogo,
  rules: [
    "Setiap baris dan kolom harus memiliki jumlah Matahari (Sun) dan Bulan (Moon) yang sama rata (tepat setengah dari ukuran grid).",
    "Tidak boleh ada lebih dari dua komponen yang sama berderet secara berurutan (maksimal 2 in a row), baik secara horizontal maupun vertikal.",
    "Patuhi tanda pembatas (constraint) antar kotak: gunakan simbol Hubungan untuk memastikan dua kotak yang bertetangga bernilai sama (=) atau berlawanan (x).",
  ],
};
