import { describe, expect, it } from "vitest";

import { solveShikaku } from "./solver";
import { RectInfo } from "./types";

describe("solveShikaku", () => {
  it("solves single rectangle puzzle", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(solveShikaku(2, 2, infos)).toEqual([
      {
        label: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
    ]);
  });

  it("solves vertical split puzzle", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 3,
        anchor: { x: 0, y: 1 },
      },
      {
        label: "B",
        area: 3,
        anchor: { x: 1, y: 1 },
      },
    ];

    const result = solveShikaku(2, 3, infos);

    expect(result).toContainEqual({
      label: "A",
      x: 0,
      y: 0,
      w: 1,
      h: 3,
    });

    expect(result).toContainEqual({
      label: "B",
      x: 1,
      y: 0,
      w: 1,
      h: 3,
    });
  });

  it("solves horizontal split puzzle", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 3,
        anchor: { x: 1, y: 0 },
      },
      {
        label: "B",
        area: 3,
        anchor: { x: 1, y: 1 },
      },
    ];

    const result = solveShikaku(3, 2, infos);

    expect(result).toContainEqual({
      label: "A",
      x: 0,
      y: 0,
      w: 3,
      h: 1,
    });

    expect(result).toContainEqual({
      label: "B",
      x: 0,
      y: 1,
      w: 3,
      h: 1,
    });
  });

  it("solves mixed rectangle puzzle", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "B",
        area: 2,
        anchor: { x: 2, y: 0 },
      },
      {
        label: "C",
        area: 2,
        anchor: { x: 2, y: 1 },
      },
    ];

    const result = solveShikaku(4, 2, infos);

    expect(result).toContainEqual({
      label: "A",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    });

    expect(result).toContainEqual({
      label: "B",
      x: 2,
      y: 0,
      w: 2,
      h: 1,
    });

    expect(result).toContainEqual({
      label: "C",
      x: 2,
      y: 1,
      w: 2,
      h: 1,
    });
  });

  it("throws on area mismatch", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 3,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("area mismatch");
  });

  it("throws when area is too large", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 10,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("area too large");
  });

  it("throws on duplicate labels", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "A",
        area: 2,
        anchor: { x: 1, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("duplicate label");
  });

  it("throws on duplicate anchors", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "B",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("duplicate anchor");
  });

  it("throws on unsatisfiable region", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 3,
        anchor: { x: 1, y: 1 },
      },
      {
        label: "B",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(() => solveShikaku(2, 2, infos)).toThrow("unsatisfiable region");
  });

  it("handles 1x1 regions", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "B",
        area: 1,
        anchor: { x: 1, y: 0 },
      },
      {
        label: "C",
        area: 1,
        anchor: { x: 0, y: 1 },
      },
      {
        label: "D",
        area: 1,
        anchor: { x: 1, y: 1 },
      },
    ];

    const result = solveShikaku(2, 2, infos);

    expect(result).toHaveLength(4);
  });

  it("solves larger valid board", () => {
    const infos: RectInfo[] = [
      {
        label: "A",
        area: 6,
        anchor: { x: 1, y: 1 },
      },
      {
        label: "B",
        area: 3,
        anchor: { x: 3, y: 1 },
      },
      {
        label: "C",
        area: 3,
        anchor: { x: 2, y: 2 },
      },
    ];

    const result = solveShikaku(4, 3, infos);

    expect(result).toHaveLength(3);

    const total = result.reduce((a, r) => a + r.w * r.h, 0);

    expect(total).toBe(12);
  });
});
