import { describe, expect, it } from "vitest";
import { generateCustomCard, generateSet, setGenerator } from "./generator";
import { SET_TIERS, type SetParams } from "./difficulty";
import { COLORS, SYMBOLS, TEXTURES } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Membuat data mockup SetParams tiruan untuk kebutuhan isolasi unit testing.
 */
function makeParams(partial: Partial<SetParams> = {}): SetParams {
  return {
    totalCards: 12,
    targetSets: 3,
    overlapFactor: 1.0,
    maxExtraSets: 2,
    nearMissTarget: 5,
    entropy: 0.5,
    visualNoise: 0.5,
    timer: undefined,
    hintPenalty: 10,
    tier: SET_TIERS[0],
    seed: 123,
    ...partial,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateCustomCard()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateCustomCard()", () => {
  it("menghasilkan properti kartu secara deterministik berdasarkan token ter-scope", () => {
    const pseudoRng = () => 0.5;
    const card = generateCustomCard(pseudoRng, SYMBOLS, COLORS, TEXTURES);

    expect(card.id).toBeDefined();
    expect(typeof card.id).toBe("string");
    expect(card.id.length).toBeGreaterThan(0);
    expect(SYMBOLS).toContain(card.symbol);
    expect(COLORS).toContain(card.color);
    expect(TEXTURES).toContain(card.texture);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateSet()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSet()", () => {
  it("memproduksi pool ukuran kartu yang presisi sesuai parameter totalCards", () => {
    const params = makeParams({ totalCards: 15 });
    const result = generateSet(params);

    expect(result.cards.length).toBe(15);
  });

  it("menjamin seluruh elemen unik tanpa ada mutasi tabrakan ID kartu ganda", () => {
    const params = makeParams({ totalCards: 12 });
    const result = generateSet(params);

    const individualIds = new Set(result.cards.map((c) => c.id));
    expect(individualIds.size).toBe(params.totalCards);
  });

  it("bersifat sepenuhnya deterministik jika dipicu menggunakan nilai seed yang sama", () => {
    const paramsA = makeParams({ seed: 4567 });
    const paramsB = makeParams({ seed: 4567 });

    const a = generateSet(paramsA);
    const b = generateSet(paramsB);

    expect(a).toEqual(b);
  });

  it("mengubah susunan struktural kartu saat nilai seed bertolak belakang", () => {
    const paramsA = makeParams({ seed: 777 });
    const paramsB = makeParams({ seed: 888 });

    const a = generateSet(paramsA);
    const b = generateSet(paramsB);

    expect(a.cards).not.toEqual(b.cards);
  });

  it("mengkalkulasi metrik profil penyebaran solusi set secara akurat", () => {
    const params = makeParams({ totalCards: 12, targetSets: 4 });
    const result = generateSet(params);

    expect(result.metrics.totalSets).toBe(result.sets.length);
    expect(result.metrics.deadCards).toBeLessThanOrEqual(result.cards.length);
    expect(result.metrics.overlapMax).toBeGreaterThanOrEqual(0);
  });

  it("visual debug: mencetak log data deck linear dan metrik solusi set aktif", () => {
    const params = makeParams({
      totalCards: 12,
      seed: 888,
    });

    const result = generateSet(params);

    console.log(
      "\n⚡=================== SET GENERATOR METRICS ===================⚡",
    );
    console.log(`Tier:      ${result.params.tier.name}`);
    console.log(`Seed:      ${result.params.seed}`);
    console.log(`Cards:     ${result.cards.length} kartu aktif di board`);
    console.log(
      `Found:     ${result.sets.length} total valid SET (Targeted: ${result.params.targetSets})`,
    );
    console.log(
      `Overlaps:  Avg ${result.metrics.overlapAverage.toFixed(2)} | Max ${result.metrics.overlapMax}`,
    );
    console.log(
      "-----------------------------------------------------------------",
    );

    // Cetak representasi ringkas kartu ke console
    const formattedCards = result.cards.map((card) => {
      const s = card.symbol.substring(0, 2).toUpperCase();
      const c = card.color.substring(0, 2).toUpperCase();
      const t = card.texture.substring(0, 3);
      return `${s}-${c}-${t}-${card.count}`;
    });
    console.log("Card Pool Layout Samples:", formattedCards);
    console.log(
      "=================================================================\n",
    );

    expect(result.cards.length).toBe(12);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setGenerator Profile Tests (.byLevel & .byTier)
// ─────────────────────────────────────────────────────────────────────────────

describe("setGenerator.byLevel()", () => {
  it("mampu memproduksi layout matrix melalui pemicu progresi level", () => {
    const result = setGenerator.byLevel(1);

    expect(result.cards.length).toBeGreaterThanOrEqual(12);
    expect(result.sets).toBeDefined();
  });

  it("menjaga konsistensi deterministik mutlak di level profile yang sama", () => {
    expect(setGenerator.byLevel(42)).toEqual(setGenerator.byLevel(42));
  });

  it("menaikkan batas kapasitas kartu maksimum pada stage late-game", () => {
    const lowLevelBoard = setGenerator.byLevel(1);
    const highLevelBoard = setGenerator.byLevel(500);

    expect(highLevelBoard.params.tier.maxCards).toBeGreaterThanOrEqual(
      lowLevelBoard.params.tier.minCards,
    );
  });
});

describe("setGenerator.byTier()", () => {
  it("menghasilkan matriks valid di seluruh daftar tier kesulitan tanpa crash", () => {
    for (let tierIdx = 0; tierIdx < SET_TIERS.length; tierIdx++) {
      const tier = SET_TIERS[tierIdx];
      const result = setGenerator.byTier(tierIdx, 9999);

      // Verifikasi kepatuhan rentang jumlah kartu per tier
      expect(result.cards.length).toBeGreaterThanOrEqual(tier.minCards);
      expect(result.cards.length).toBeLessThanOrEqual(tier.maxCards);
    }
  });

  it("meningkatkan kompleksitas solusi target seiring bertambahnya tingkat tier", () => {
    const easyTier = setGenerator.byTier(0, 123); // Beginner
    const hardTier = setGenerator.byTier(SET_TIERS.length - 1, 123); // Nightmare

    expect(hardTier.params.targetSets).toBeGreaterThan(
      easyTier.params.targetSets,
    );
    expect(hardTier.params.entropy).toBeGreaterThan(easyTier.params.entropy);
  });

  it("menjamin reliabilitas deterministik penuh dengan entry seed spesifik", () => {
    expect(setGenerator.byTier(3, 8881)).toEqual(setGenerator.byTier(3, 8881));
  });
});
