import { describe, expect, it } from "vitest";
import { completeSet } from "./solver";
import { isValidSet, validFeature } from "./validator";
import { mkRng } from "@/shared/algorithms";
import { generateCard } from "./generator";

describe("validFeature", () => {
  it("returns true when all values are identical", () => {
    expect(validFeature(["red", "red", "red"])).toBe(true);
  });

  it("returns true when all values are unique", () => {
    expect(validFeature(["red", "green", "purple"])).toBe(true);
  });

  it("returns false for partially duplicated values", () => {
    expect(validFeature(["red", "red", "green"])).toBe(false);
  });

  it("works with numeric values", () => {
    expect(validFeature([1, 2, 3])).toBe(true);
    expect(validFeature([1, 1, 1])).toBe(true);
    expect(validFeature([1, 1, 2])).toBe(false);
  });

  it("works with boolean values", () => {
    expect(validFeature([true, true, true])).toBe(true);
    expect(validFeature([true, false, true])).toBe(false);
  });
});

describe("isValidSet", () => {
  it("returns true for a valid generated set", () => {
    const rng = mkRng(777);

    const a = generateCard(rng);
    const b = generateCard(rng);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("returns false when card count is not exactly 3", () => {
    const rng = mkRng(123);

    expect(isValidSet([])).toBe(false);
    expect(isValidSet([generateCard(rng)])).toBe(false);
    expect(isValidSet([generateCard(rng), generateCard(rng)])).toBe(false);
    expect(
      isValidSet([
        generateCard(rng),
        generateCard(rng),
        generateCard(rng),
        generateCard(rng),
      ]),
    ).toBe(false);
  });

  it("returns false for duplicate card IDs", () => {
    const rng = mkRng(999);
    const card = generateCard(rng);

    expect(isValidSet([card, card, card])).toBe(false);
  });

  it("returns false for invalid feature combinations", () => {
    const rng = mkRng(1);

    const a = generateCard(rng);
    const b = { ...a, id: "fake-duplicate" }; // force invalid same-features but different id
    const c = generateCard(rng);

    expect(isValidSet([a, b, c])).toBe(false);
  });

  it("validates all-different features correctly", () => {
    const rng = mkRng(42);

    const a = generateCard(rng);
    const b = generateCard(rng);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("validates all-identical features correctly", () => {
    const rng = mkRng(100);

    const a = generateCard(rng);
    const b = generateCard(rng);
    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("rejects mixed feature violations", () => {
    const rng = mkRng(5);

    const a = generateCard(rng);
    const b = { ...a }; // same full card
    const c = generateCard(rng);

    expect(isValidSet([a, b, c])).toBe(false);
  });
});
