import { describe, expect, it } from "vitest";
import { solveShikaku } from "./solver";
import type { RectInfo } from "./types";
import { ShikakuPuzzle } from "./generator";
import { checkShikakuAnchor } from "./validation";

describe("solveShikaku", () => {
  it("solves a simple 2x2 puzzle", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 2,
        anchor: { x: 0, y: 1 },
      },
    ];

    const solution = solveShikaku(2, 2, infos);

    expect(solution).toHaveLength(2);

    const totalArea = solution.reduce((s, r) => s + r.w * r.h, 0);
    expect(totalArea).toBe(4);

    for (const rect of solution) {
      expect(
        checkShikakuAnchor(rect, {
          width: 2,
          height: 2,
          infos,
        } as ShikakuPuzzle),
      ).toBe(true);
    }
  });

  it("solves a 3x2 puzzle", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 4,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 2,
        anchor: { x: 2, y: 0 },
      },
    ];

    const solution = solveShikaku(3, 2, infos);

    expect(solution).toHaveLength(2);

    expect(solution.reduce((s, r) => s + r.w * r.h, 0)).toBe(6);
  });

  it("throws when no solution exists", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 3,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow();
  });
});

describe("solveShikaku validation", () => {
  it("rejects invalid width", () => {
    expect(() => solveShikaku(0, 2, [])).toThrow("invalid width");
  });

  it("rejects invalid height", () => {
    expect(() => solveShikaku(2, 0, [])).toThrow("invalid height");
  });

  it("rejects empty puzzle", () => {
    expect(() => solveShikaku(2, 2, [])).toThrow("empty puzzle");
  });

  it("rejects duplicate labels", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "A",
        area: 2,
        anchor: { x: 1, y: 1 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("duplicate label: A");
  });

  it("rejects duplicate anchors", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("duplicate anchor: 0,0");
  });

  it("rejects area mismatch", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("area mismatch: 1/4");
  });

  it("rejects anchor out of bounds", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 4,
        anchor: { x: 5, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("anchor out of bounds: A");
  });

  it("rejects invalid area", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 0,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(1, 1, infos)).toThrow("invalid area: A");
  });

  it("rejects area larger than board", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 10,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("area too large: A");
  });

  it("throws unsatisfiable region when clue has no candidates", () => {
    const infos: RectInfo[] = [
      {
        id: "A",
        area: 4,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 5,
        anchor: { x: 1, y: 1 },
      },
    ];

    expect(() => solveShikaku(3, 3, infos)).toThrow(/unsatisfiable region/);
  });
});
