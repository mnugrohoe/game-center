import { describe, expect, it } from "vitest";
import { completeSet } from "./solver";
import { isValidSet, validFeature } from "./validator";
import { mkRng } from "@/shared/algorithms";
import { generateCustomCard } from "./generator";
import { COLORS, SYMBOLS, TEXTURES } from "./constants";
import type { CardType } from "./types";

describe("validFeature", () => {
  it("mengembalikan true jika semua nilai atribut identik (sama semua)", () => {
    expect(validFeature(["red", "red", "red"])).toBe(true);
  });

  it("mengembalikan true jika semua nilai atribut unik (beda semua)", () => {
    expect(validFeature(["red", "green", "purple"])).toBe(true);
  });

  it("mengembalikan false jika ditemukan nilai atribut duplikat parsial (dua sama, satu beda)", () => {
    expect(validFeature(["red", "red", "green"])).toBe(false);
  });

  it("berjalan dengan baik untuk nilai bertipe numerik (count)", () => {
    expect(validFeature([1, 2, 3])).toBe(true);
    expect(validFeature([1, 1, 1])).toBe(true);
    expect(validFeature([1, 1, 2])).toBe(false);
  });

  it("berjalan dengan baik untuk nilai bertipe boolean", () => {
    expect(validFeature([true, true, true])).toBe(true);
    expect(validFeature([true, false, true])).toBe(false);
  });
});

describe("isValidSet", () => {
  it("mengembalikan true untuk formasi kombinasi kartu valid yang dihasilkan solver", () => {
    const rng = mkRng(777);

    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("mengembalikan false jika jumlah kartu yang diperiksa tidak tepat berjumah 3", () => {
    const rng = mkRng(123);
    const card = () => generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    expect(isValidSet([])).toBe(false);
    expect(isValidSet([card()])).toBe(false);
    expect(isValidSet([card(), card()])).toBe(false);
    expect(isValidSet([card(), card(), card(), card()])).toBe(false);
  });

  it("mengembalikan false jika terdapat duplikasi kartu dengan ID yang sama di dalam barisan", () => {
    const rng = mkRng(999);
    const card = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    expect(isValidSet([card, card, card])).toBe(false);
  });

  it("mengembalikan false jika salah satu fitur merusak aturan permainan (dua warna sama, satu warna beda)", () => {
    const cardA: CardType = {
      id: "OVAL-RED-SOLID-1",
      symbol: "hourglass",
      color: "red",
      texture: "solid",
      count: 1,
    };
    const cardB: CardType = {
      id: "DIAMOND-RED-STRIPED-2",
      symbol: "diamond",
      color: "red", // Sama dengan cardA
      texture: "striped",
      count: 2,
    };
    const cardC: CardType = {
      id: "SQUIGGLE-GREEN-OPEN-3",
      symbol: "love",
      color: "green", // Berbeda sendiri (Pelanggaran: 2 merah, 1 hijau)
      texture: "outline",
      count: 3,
    };

    expect(isValidSet([cardA, cardB, cardC])).toBe(false);
  });

  it("memvalidasi dengan benar jika semua fitur bertipe serba-berbeda (all-different)", () => {
    const rng = mkRng(42);

    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("memvalidasi dengan benar jika beberapa fitur bertipe serba-sama (all-identical)", () => {
    const rng = mkRng(100);

    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("menolak keras manipulasi kartu tiruan yang merusak kesatuan struktur data permainan", () => {
    const rng = mkRng(5);

    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = { ...a }; // Duplikat objek penuh secara ilegal
    const c = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    expect(isValidSet([a, b, c])).toBe(false);
  });
});
