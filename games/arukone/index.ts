import { GameMetadata } from "@/shared/types";
import ArukoneLogo from "./components/Logo";

/**
 * Barrel index
 */
export * from "./lib";
export * from "./hooks";
export * from "./components";
// export * from "./types";

export const meta: GameMetadata = {
  id: "arukone",
  name: "Arukone",
  description:
    "Hubungkan angka-angka secara berurutan dari 1 hingga N menjadi satu garis kontinu. Untuk memecahkan teka-teki, garis kamu harus menjelajahi dan menutup seluruh petak grid tanpa ada yang terlewat.",
  version: "1.0.0",
  tags: ["puzzle", "logic", "grid-based", "path-finding", "nikoli"],
  icon: ArukoneLogo,
  rules: [
    "Tarik garis lurus (horizontal/vertikal) untuk menghubungkan angka secara berurutan, mulai dari 1, 2, 3, hingga endpoint N.",
    "Setiap petak kotak di dalam grid WAJIB dilewati tepat satu kali oleh garis.",
    "Teka-teki selesai jika seluruh papan grid tertutup sempurna tanpa ada kotak kosong yang tersisa saat garis mencapai angka N.",
  ],
};
