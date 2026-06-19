// games/set/lib/constants.test.ts

import { describe, expect, it } from "vitest";

import { COLORS, COLOR_MAP, COUNTS, SYMBOLS, TEXTURES } from "./constants";

describe("SYMBOLS", () => {
  it("contains exactly 3 symbols", () => {
    expect(SYMBOLS).toEqual(["diamond", "hourglass", "love"]);
  });

  it("contains unique values", () => {
    expect(new Set(SYMBOLS).size).toBe(SYMBOLS.length);
  });
});

describe("COLORS", () => {
  it("contains exactly 3 colors", () => {
    expect(COLORS).toEqual(["red", "green", "purple"]);
  });

  it("contains unique values", () => {
    expect(new Set(COLORS).size).toBe(COLORS.length);
  });
});

describe("TEXTURES", () => {
  it("contains exactly 3 textures", () => {
    expect(TEXTURES).toEqual(["outline", "striped", "solid"]);
  });

  it("contains unique values", () => {
    expect(new Set(TEXTURES).size).toBe(TEXTURES.length);
  });
});

describe("COUNTS", () => {
  it("contains values 1 through 3", () => {
    expect(COUNTS).toEqual([1, 2, 3]);
  });

  it("contains unique values", () => {
    expect(new Set(COUNTS).size).toBe(COUNTS.length);
  });
});

describe("COLOR_MAP", () => {
  it("contains all colors", () => {
    for (const color of COLORS) {
      expect(COLOR_MAP[color]).toBeDefined();
    }
  });

  it("maps to valid hex colors", () => {
    for (const value of Object.values(COLOR_MAP)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("uses unique color values", () => {
    const values = Object.values(COLOR_MAP);

    expect(new Set(values).size).toBe(values.length);
  });
});
