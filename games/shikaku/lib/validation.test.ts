import { describe, expect, it } from "vitest";

import { validateBoard } from "./validation";
import { Rect, RectInfo } from "./types";

describe("validateBoard", () => {
  it("validates single rectangle board", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 1, y: 1 },
      },
    ];

    expect(validateBoard(2, 2, rects, infos)).toBe(true);
  });

  it("validates multiple rectangles", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        label: "B",
        x: 2,
        y: 0,
        w: 1,
        h: 2,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 1, y: 0 },
      },
      {
        label: "B",
        area: 2,
        anchor: { x: 2, y: 1 },
      },
    ];

    expect(validateBoard(3, 2, rects, infos)).toBe(true);
  });

  it("fails on overlap", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        label: "B",
        x: 1,
        y: 1,
        w: 2,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "B",
        area: 2,
        anchor: { x: 2, y: 1 },
      },
    ];

    expect(validateBoard(3, 2, rects, infos)).toBe(false);
  });

  it("fails on incomplete coverage", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(validateBoard(2, 2, rects, infos)).toBe(false);
  });

  it("fails when area mismatches", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 3,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(validateBoard(2, 2, rects, infos)).toBe(false);
  });

  it("fails when anchor is outside rectangle", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 1,
        anchor: { x: 1, y: 1 },
      },
    ];

    expect(validateBoard(2, 2, rects, infos)).toBe(false);
  });

  it("fails on unknown label", () => {
    const rects: Rect[] = [
      {
        label: "X",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(validateBoard(1, 1, rects, infos)).toBe(false);
  });

  it("fails on duplicate info labels", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
      {
        label: "A",
        area: 1,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(validateBoard(1, 1, rects, infos)).toBe(false);
  });

  it("fails on out-of-bounds rectangle", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 1,
        y: 1,
        w: 2,
        h: 2,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 4,
        anchor: { x: 1, y: 1 },
      },
    ];

    expect(validateBoard(2, 2, rects, infos)).toBe(false);
  });

  it("fails on zero-sized rectangle", () => {
    const rects: Rect[] = [
      {
        label: "A",
        x: 0,
        y: 0,
        w: 0,
        h: 1,
      },
    ];

    const infos: RectInfo[] = [
      {
        label: "A",
        area: 0,
        anchor: { x: 0, y: 0 },
      },
    ];

    expect(validateBoard(1, 1, rects, infos)).toBe(false);
  });
});
