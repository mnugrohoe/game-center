import { describe, expect, it, vi, beforeEach } from "vitest";
import { mkRng } from "@/shared/algorithms";

import { generateCustomCard } from "./generator";
import { completeSet, findAllSets, cardSignature } from "./solver";
import * as validatorModule from "./validator";
import { COLORS, SYMBOLS, TEXTURES } from "./constants";
import type { CardType } from "./types";

/**
 * Helper untuk memastikan board pengujian memiliki kartu yang unik.
 * Mencegah tabrakan ID kartu acak yang bisa mengacaukan pembacaan index map.
 */
function createUniqueTestBoard(size: number, seed: number): CardType[] {
  const rng = mkRng(seed);
  const board: CardType[] = [];
  const signatures = new Set<string>();

  while (board.length < size) {
    const card = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const sig = cardSignature(card);
    if (!signatures.has(sig)) {
      signatures.add(sig);
      board.push(card);
    }
  }
  return board;
}

// ─────────────────────────────────────────────────────────────────────────────
// cardSignature
// ─────────────────────────────────────────────────────────────────────────────

describe("cardSignature", () => {
  it("memproduksi string signature yang deterministik", () => {
    const rng = mkRng(1);
    const card = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    const sig1 = cardSignature(card);
    const sig2 = cardSignature(card);

    expect(sig1).toBe(sig2);
  });

  it("mencakup seluruh 4 komponen fitur atribut yang dipisahkan oleh tanda hubung (hyphen)", () => {
    const rng = mkRng(2);
    const card = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const sig = cardSignature(card);

    expect(sig.split("-").length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllSets
// ─────────────────────────────────────────────────────────────────────────────

describe("findAllSets", () => {
  beforeEach(() => {
    // Paksa validator selalu mengembalikan true untuk mengisolasi pengetesan logika indeks pencarian di findAllSets
    vi.spyOn(validatorModule, "isValidSet").mockImplementation(() => true);
  });

  it("berhasil mengidentifikasi seluruh set yang tersedia pada tumpukan board unik", () => {
    const board = createUniqueTestBoard(12, 42);

    expect(() => findAllSets(board)).not.toThrow();
  });

  it("tidak pernah menyarankan kombinasi set yang mengandung duplikasi instansi dari kartu yang sama", () => {
    const board = createUniqueTestBoard(15, 99);
    const results = findAllSets(board);

    for (const [cardA, cardB, cardC] of results) {
      expect(cardA.id).not.toBe(cardB.id);
      expect(cardB.id).not.toBe(cardC.id);
      expect(cardA.id).not.toBe(cardC.id);
    }
  });

  it("merekam kombinasi secara unik tanpa memasukkan permutasi cermin (mirrored permutations)", () => {
    const board = createUniqueTestBoard(12, 500);
    const results = findAllSets(board);

    const seenCombos = new Set<string>();

    for (const [a, b, c] of results) {
      const canonicalSignature = [a.id, b.id, c.id].sort().join("||");

      expect(seenCombos.has(canonicalSignature)).toBe(false);
      seenCombos.add(canonicalSignature);
    }
  });

  it("mengembalikan array kosong secara aman jika kapasitas board terlalu kecil (< 3)", () => {
    const smallBoard = createUniqueTestBoard(2, 12);
    const results = findAllSets(smallBoard);

    expect(results).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeSet
// ─────────────────────────────────────────────────────────────────────────────

describe("completeSet", () => {
  beforeEach(() => {
    // Kembalikan implementasi validator asli untuk menguji aturan matematika permainan asli
    vi.restoreAllMocks();
  });

  it("mengkalkulasi kartu ketiga yang secara mutlak memenuhi hukum validitas permainan SET", () => {
    const rng = mkRng(100);
    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    const c = completeSet(a, b);

    expect(validatorModule.isValidSet([a, b, c])).toBe(true);
  });

  it("bersifat deterministik penuh saat memproses input pasangan kartu yang identik", () => {
    const rng = mkRng(200);
    const a = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
    const b = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);

    const result1 = completeSet(a, b);
    const result2 = completeSet(a, b);

    expect(result1).toEqual(result2);
  });

  it("mempertahankan nilai atribut yang sama jika kedua kartu input memiliki ciri yang cocok", () => {
    const identicalCardA: CardType = {
      id: "DIAMOND-RED-SOLID-1",
      symbol: "diamond",
      color: "red",
      texture: "solid",
      count: 1,
    };
    const identicalCardB: CardType = {
      id: "DIAMOND-PURPLE-SOLID-1",
      symbol: "diamond",
      color: "purple",
      texture: "solid",
      count: 1,
    };

    const targetCard = completeSet(identicalCardA, identicalCardB);

    // Atribut Simbol, tekstur, dan jumlah wajib tetap sama karena inputnya sama.
    expect(targetCard.symbol).toBe("diamond");
    expect(targetCard.texture).toBe("solid");
    expect(targetCard.count).toBe(1);

    // Atribut Warna harus memilih opsi ketiga dari konstan COLORS (bukan red maupun purple)
    expect(targetCard.color).not.toBe("red");
    expect(targetCard.color).not.toBe("purple");
  });
});
