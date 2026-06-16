import { describe, it, expect } from "vitest";
import { SET_TIERS, generateSetParams, setParamsGenerator } from "./difficulty";

describe("setParamsGenerator (provider)", () => {
  it("bersifat sepenuhnya deterministik jika dipicu menggunakan seed yang sama (byTier)", () => {
    const a = setParamsGenerator.byTier(2, 12345);
    const b = setParamsGenerator.byTier(2, 12345);

    expect(a).toEqual(b);
  });

  it("mematuhi batas kapasitas tumpukan kartu (card pool boundaries) di setiap tier", () => {
    SET_TIERS.forEach((tier, idx) => {
      // Menguji beberapa mutasi seed untuk memastikan kepatuhan fungsi clamp RNG
      const seeds = [111, 555, 999, 12345];

      seeds.forEach((seed) => {
        const params = setParamsGenerator.byTier(idx, seed);

        // Memastikan totalCards selalu berada di dalam koridor batas min & max bawaan tier
        expect(params.totalCards).toBeGreaterThanOrEqual(tier.minCards);
        expect(params.totalCards).toBeLessThanOrEqual(tier.maxCards);
      });
    });
  });

  it("menjaga parameter nilai desimal entropy tetap berada dalam rentang valid 0 sampai 1", () => {
    for (let score = 1; score <= 9; score++) {
      for (let seedOffset = 0; seedOffset < 10; seedOffset++) {
        const params = generateSetParams(score, 100 + seedOffset);
        expect(params.entropy).toBeGreaterThanOrEqual(0.1);
        expect(params.entropy).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it("menjaga parameter nilai desimal visualNoise tetap berada dalam rentang valid 0 sampai 1", () => {
    for (let score = 1; score <= 9; score++) {
      for (let seedOffset = 0; seedOffset < 10; seedOffset++) {
        const params = generateSetParams(score, 100 + seedOffset);
        expect(params.visualNoise).toBeGreaterThanOrEqual(0.05);
        expect(params.visualNoise).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it("mengaktifkan countdown timer secara tepat hanya pada tier tingkat tinggi", () => {
    // Tier rendah (Skor 1 - 4, indeks 0 - 3) tidak boleh mengaktifkan batas waktu (timer)
    for (let score = 1; score <= 4; score++) {
      const params = generateSetParams(score, 123);
      expect(params.timer).toBeUndefined();
    }

    // Tier tinggi (Skor 5 - 9, indeks 4 ke atas) wajib mengaktifkan countdown timer dinamis
    for (let score = 5; score <= 9; score++) {
      const params = generateSetParams(score, 123);
      expect(params.timer).toBeDefined();
      expect(params.timer).toBeGreaterThanOrEqual(45);
      expect(params.timer).toBeLessThanOrEqual(180);
    }
  });

  it("menjamin tren progresi parameter meningkat seiring bertambahnya skor kesulitan", () => {
    // Menggunakan beberapa sampel seed untuk mengambil rata-rata tren progresi (menghindari anomali fluktuasi acak tunggal)
    const sampleSeeds = [100, 200, 300, 400, 500];

    let totalEasyEntropy = 0,
      totalHardEntropy = 0;
    let totalEasyNoise = 0,
      totalHardNoise = 0;
    let totalEasyTargetSets = 0,
      totalHardTargetSets = 0;
    let totalEasyOverlap = 0,
      totalHardOverlap = 0;
    let totalEasyPenalty = 0,
      totalHardPenalty = 0;

    sampleSeeds.forEach((seed) => {
      const easy = generateSetParams(1, seed); // Beginner
      const hard = generateSetParams(9, seed); // Nightmare

      totalEasyEntropy += easy.entropy;
      totalHardEntropy += hard.entropy;

      totalEasyNoise += easy.visualNoise;
      totalHardNoise += hard.visualNoise;

      totalEasyTargetSets += easy.targetSets;
      totalHardTargetSets += hard.targetSets;

      totalEasyOverlap += easy.overlapFactor;
      totalHardOverlap += hard.overlapFactor;

      totalEasyPenalty += easy.hintPenalty;
      totalHardPenalty += hard.hintPenalty;
    });

    const samplesCount = sampleSeeds.length;

    // Memastikan nilai rata-rata akumulasi parameter tingkat Nightmare jauh lebih tinggi daripada Beginner
    expect(totalHardEntropy / samplesCount).toBeGreaterThan(
      totalEasyEntropy / samplesCount,
    );
    expect(totalHardNoise / samplesCount).toBeGreaterThan(
      totalEasyNoise / samplesCount,
    );
    expect(totalHardTargetSets / samplesCount).toBeGreaterThan(
      totalEasyTargetSets / samplesCount,
    );
    expect(totalHardOverlap / samplesCount).toBeGreaterThan(
      totalEasyOverlap / samplesCount,
    );
    expect(totalHardPenalty / samplesCount).toBeGreaterThan(
      totalEasyPenalty / samplesCount,
    );
  });
});
