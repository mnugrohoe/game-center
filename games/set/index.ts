import { GameMetadata } from "@/shared/types";
import SetsLogo from "./components/Logo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";

export const meta: GameMetadata = {
  id: "sets",
  name: "Sets",
  description:
    "Temukan kombinasi 3 kartu (Set) dari papan permainan. Sebuah kombinasi dinyatakan sebagai 'Set' jika untuk setiap fitur kartu (jumlah, bentuk, warna, dan isian), ketiganya memiliki sifat yang sama semua atau berbeda semua.",
  version: "1.0.0",
  tags: ["puzzle", "logic", "pattern-recognition", "card-game", "math"],
  icon: SetsLogo,
  rules: [
    "Pilih tepat 3 kartu dari papan untuk diperiksa apakah mereka membentuk sebuah 'Set'.",
    "Periksa 4 fitur kartu: Jumlah simbol (1, 2, 3), Bentuk (diamond, love, hourglass), Warna (merah, hijau, ungu), dan Isian (solid, garis-garis, kosong).",
    "Untuk SETIAP fitur tersebut, ketiga kartu harus memiliki sifat yang SAMA SEMUA atau BERBEDA SEMUA. Jika ada satu fitur yang dua kartu sama tapi satu kartu berbeda, maka itu BUKAN sebuah Set.",
  ],
};
