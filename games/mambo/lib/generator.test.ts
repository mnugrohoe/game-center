/**
 * games/mambo/lib/generator.test.ts
 */
import { describe, expect, it } from "vitest";
import { generateMamboBoard, mamboGenerator } from "./generator";
import { MAMBO_TIERS, mamboParamsGenerator } from "./difficulty";
import type { MamboParams } from "../types";

// Create clean, reproducible test parameters using your standard layout patterns
const makeParams = (overrides: Partial<MamboParams> = {}): MamboParams => ({
  gridSize: 6,
  targetInitCount: 12,
  targetLinksCount: 10,
  tier: MAMBO_TIERS[2], // Fog tier
  seed: 123,
  ...overrides,
});

describe("generateMamboBoard", () => {
  it("enforces an even grid size matrix automatically via its guard clause", () => {
    const result = generateMamboBoard(makeParams({ gridSize: 5 })); // 5 is odd

    expect(result).not.toBeNull();
    expect(result!.size).toBe(6); // Automatically bumped to 6
  });

  it("generates a valid structural board payload layout matching parameters", () => {
    const result = generateMamboBoard(makeParams({ gridSize: 6, seed: 12345 }));

    expect(result).not.toBeNull();
    expect(result!.puzzle).toHaveLength(6);
    expect(result!.solution).toHaveLength(6);
    expect(result!.size).toBe(6);
  });

  it("produces an exact number of revealed starting clues matching targetInitCount", () => {
    const targetInitCount = 14;
    const result = generateMamboBoard(
      makeParams({ gridSize: 6, targetInitCount, seed: 777 }),
    );

    let actualClues = 0;
    for (const row of result!.puzzle) {
      for (const cell of row) {
        if (cell !== 0) actualClues++;
      }
    }
    expect(actualClues).toBe(targetInitCount);
  });

  it("produces an exact number of relationship links matching targetLinksCount", () => {
    const targetLinksCount = 15;
    const result = generateMamboBoard(
      makeParams({ gridSize: 6, targetLinksCount, seed: 888 }),
    );

    expect(result!.constraints).toHaveLength(targetLinksCount);
  });

  it("ensures all generated constraint connections stay orthogonally inside edge coordinates", () => {
    const size = 6;
    const result = generateMamboBoard(
      makeParams({ gridSize: size, seed: 999 }),
    );

    for (const link of result!.constraints) {
      // Must be adjacent coordinates on the matrix
      const distance =
        Math.abs(link.r1 - link.r2) + Math.abs(link.c1 - link.c2);
      expect(distance).toBe(1);

      // Verify layout boundaries
      expect(link.r1).toBeLessThan(size);
      expect(link.c1).toBeLessThan(size);
      expect(link.r2).toBeLessThan(size);
      expect(link.c2).toBeLessThan(size);
    }
  });

  it("is completely deterministic given the same parameters and seed instance", () => {
    const params = makeParams({ seed: 5555 });

    expect(generateMamboBoard(params)).toEqual(generateMamboBoard(params));
  });

  it("varies board layouts perfectly when provided different seed inputs", () => {
    const a = generateMamboBoard(makeParams({ seed: 1111 }));
    const b = generateMamboBoard(makeParams({ seed: 2222 }));

    expect(a).not.toEqual(b);
  });
});

describe("mamboGenerator.byLevel", () => {
  it("generates functional valid puzzles across all sample game levels", () => {
    const logs = [];

    for (let level = 1; level <= 20; level++) {
      const result = mamboGenerator.byLevel(level);

      expect(result).not.toBeNull();
      expect(result!.size % 2).toBe(0);
      expect(result!.solution.length).toBe(result!.size);

      // Map out clean tabular presentation snapshots
      if (level <= 10) {
        // Count clues dynamically
        let clueCount = 0;
        result!.puzzle.forEach((row) =>
          row.forEach((cell) => {
            if (cell !== 0) clueCount++;
          }),
        );

        logs.push({
          "Game Level": level,
          Tier: result!.params.tier.name,
          "Grid Size": `${result!.size}x${result!.size}`,
          "Clues Count": clueCount,
          Constraints: result!.constraints.length,
          Seed: result!.params.seed,
        });
      }
    }

    console.log("\n--- MAMBO BY LEVEL PREVIEW ---");
    console.table(logs);
  });

  it("is deterministic when executing identical byLevel requests", () => {
    expect(mamboGenerator.byLevel(12)).toEqual(mamboGenerator.byLevel(12));
  });

  it("respects calculated dynamic level parameters perfectly", () => {
    const level = 15;

    const params = mamboParamsGenerator.byLevel(level);
    const result = mamboGenerator.byLevel(level);

    expect(result!.size).toBe(params.gridSize);
  });
});

describe("mamboGenerator.byTier", () => {
  it("generates operational board puzzles for all defined difficulty tiers", () => {
    const logs = [];

    for (let tierIdx = 0; tierIdx < MAMBO_TIERS.length; tierIdx++) {
      const result = mamboGenerator.byTier(tierIdx, 12345);

      expect(result).not.toBeNull();
      expect(result!.constraints.length).toBeGreaterThanOrEqual(0);

      let clueCount = 0;
      result!.puzzle.forEach((row) =>
        row.forEach((cell) => {
          if (cell !== 0) clueCount++;
        }),
      );

      logs.push({
        "Tier Index": tierIdx,
        "Tier Name": result!.params.tier.name,
        "Grid Size": `${result!.size}x${result!.size}`,
        "Clues (Pre-filled)": clueCount,
        "Constraints (=/x)": result!.constraints.length,
        "Seed Passed": result!.params.seed,
      });
    }

    console.log("\n--- MAMBO ALL TIERS MATRIX ---");
    console.table(logs);
  });

  it("is completely deterministic across byTier calls given identical seeds", () => {
    const lastTierIdx = MAMBO_TIERS.length - 1;

    expect(mamboGenerator.byTier(lastTierIdx, 99999)).toEqual(
      mamboGenerator.byTier(lastTierIdx, 99999),
    );
  });

  it("scales board grid size layouts upward as difficulty tiers escalate", () => {
    const easyBoard = mamboGenerator.byTier(0, 55555); // Dusk tier (4x4)
    const hardBoard = mamboGenerator.byTier(MAMBO_TIERS.length - 1, 55555); // Zenith tier (10x10)

    expect(hardBoard!.size).toBeGreaterThan(easyBoard!.size);
  });
});

// describe("visual representation logging", () => {
//   it("logs a complete diagnostic snapshot of a generated puzzle layout", () => {
//     const board = mamboGenerator.byLevel(3); // Level 3 sample
//     expect(board).not.toBeNull();
//     console.log(JSON.stringify(board, null, 2));
//     // Mapping helper for clean visual feedback in terminal logs
//     const glyphs: Record<number, string> = { 0: " · ", 1: " ☀ ", 2: " ◑ " };

//     const formattedPuzzle = board!.puzzle
//       .map((row) => row.map((cell) => glyphs[cell]).join(""))
//       .join("\n");

//     const formattedSolution = board!.solution
//       .map((row) => row.map((cell) => glyphs[cell]).join(""))
//       .join("\n");

//     console.log(`\n=========================================`);
//     console.log(`  MAMBO VISUAL DIAGNOSTIC (LEVEL 3)      `);
//     console.log(`=========================================`);
//     console.log(
//       `Size: ${board!.size}x${board!.size} | Seed: ${board!.params.seed}`,
//     );
//     console.log(`Constraints Count: ${board!.constraints.length}`);
//     console.log(`-----------------------------------------`);
//     console.log(`STARTING PUZZLE LAYOUT:\n`);
//     console.log(formattedPuzzle);
//     console.log(`-----------------------------------------`);
//     console.log(`COMPLETED SOLUTION MATRIX:\n`);
//     console.log(formattedSolution);
//     console.log(`=========================================\n`);
//   });
// });
