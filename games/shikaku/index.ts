import { GameMetadata } from "@/shared/types";
import ShikakuLogo from "./components/Logo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";

export const meta: GameMetadata = {
  id: "shikaku",
  name: "Shikaku",
  description:
    "Bagi seluruh papan (grid) menjadi beberapa area persegi atau persegi panjang. Setiap area harus berisi tepat satu angka yang menunjukkan total luas dari area tersebut.",
  version: "1.0.0",
  tags: ["puzzle", "logic", "grid-based", "nikoli", "math"],
  icon: ShikakuLogo,

  rules: [
    "Setiap kotak/persegi panjang hanya boleh berisi SATU angka.",
    "Jumlah total kotak kecil di dalam area harus SAMA dengan angka yang ada di dalamnya.",
    "Seluruh papan grid harus tertutup sempurna oleh area-area tersebut tanpa ada yang tumpang tindih.",
  ],
};
