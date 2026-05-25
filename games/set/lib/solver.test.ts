import { describe, expect, it } from "vitest";
import { mkRng } from "@/shared/algorithms";

import { generateCard } from "./generator";
import { completeSet, findAllSets, cardSignature } from "./solver";
import { isValidSet } from "./validator";

describe("cardSignature", () => {
  it("produces deterministic signature", () => {
    const rng = mkRng(1);

    const card = generateCard(rng);

    const sig1 = cardSignature(card);
    const sig2 = cardSignature(card);

    expect(sig1).toBe(sig2);
  });

  it("includes all feature fields", () => {
    const rng = mkRng(2);

    const card = generateCard(rng);

    const sig = cardSignature(card);

    expect(sig.split("-").length).toBe(4);
  });
});

describe("findAllSets", () => {
  it("returns valid sets only", () => {
    const rng = mkRng(10);

    const board = Array.from({ length: 10 }, () => generateCard(rng));

    const sets = findAllSets(board);

    for (const set of sets) {
      expect(isValidSet(set)).toBe(true);
    }
  });

  it("never returns invalid combinations", () => {
    const rng = mkRng(20);

    const board = Array.from({ length: 12 }, () => generateCard(rng));

    const sets = findAllSets(board);

    expect(sets.every((s) => isValidSet(s))).toBe(true);
  });

  it("returns empty or valid list (no crashes)", () => {
    const rng = mkRng(30);

    const board = Array.from({ length: 5 }, () => generateCard(rng));

    expect(() => findAllSets(board)).not.toThrow();
  });
});

describe("completeSet", () => {
  it("creates a valid SET from two cards", () => {
    const rng = mkRng(100);

    const a = generateCard(rng);
    const b = generateCard(rng);

    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBe(true);
  });

  it("is deterministic for same inputs", () => {
    const rng = mkRng(200);

    const a = generateCard(rng);
    const b = generateCard(rng);

    const c1 = completeSet(a, b);
    const c2 = completeSet(a, b);

    expect(c1).toEqual(c2);
  });

  it("completion respects SET rules", () => {
    const rng = mkRng(300);

    const a = generateCard(rng);
    const b = generateCard(rng);

    const c = completeSet(a, b);

    // all features must satisfy SET property
    expect(isValidSet([a, b, c])).toBe(true);
  });
});
