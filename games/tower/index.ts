import { GameMetadata } from "@/shared/types";
import TowerLogo from "./components/Logo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";

export const meta: GameMetadata = {
  id: "tower",
  name: "Tower",
  description:
    "Pecahkan misteri susunan menara warna dengan menganalisis petunjuk akurasi posisi dan warna di setiap percobaan.",
  version: "1.0.0",
  tags: ["puzzle", "logic", "deduction", "color-matching", "mastermind"],
  icon: TowerLogo,
  rules: [
    "Tebak urutan kombinasi warna menara yang benar di setiap baris percobaan.",
    "Perhatikan indikator bantuan: 'Valid Position' menunjukkan jumlah warna yang sudah benar di posisi yang tepat.",
    "Perhatikan indikator bantuan: 'Valid Color' menunjukkan jumlah warna yang benar tetapi posisinya masih salah.",
    "Gunakan logika eliminasi dari feedback tersebut untuk menemukan urutan yang sempurna sebelum kesempatan habis.",
  ],
};
