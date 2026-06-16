import { GameMetadata } from "@/shared/types";
import KingsLogo from "./components/Logo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";
export * from "./types";

export const meta: GameMetadata = {
  id: "kings",
  name: "Kings",
  description:
    "Tempatkan sejumlah Raja (Kings) di atas papan grid tanpa saling menyerang. Setiap baris, kolom, dan wilayah sub-board yang ditentukan hanya boleh berisi tepat satu Raja.",
  version: "1.0.0",
  tags: ["puzzle", "logic", "grid-based", "chess-puzzle", "n-queens"],
  icon: KingsLogo,
  rules: [
    "Tempatkan tepat SATU Raja di setiap baris, setiap kolom, dan setiap wilayah (sub-board) berwarna.",
    "Raja tidak boleh saling menyerang. Artinya, dua Raja tidak boleh berada di kotak yang bersebelahan, baik secara vertikal, horizontal, maupun diagonal (8 arah tetangga).",
    "Gunakan logika eliminasi untuk menandai kotak yang aman dan kotak yang mustahil ditempati oleh Raja.",
  ],
};
