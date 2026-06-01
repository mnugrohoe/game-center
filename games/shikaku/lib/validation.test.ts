import { describe, expect, it } from "vitest";

import { RectInfo, userRect } from "./types";
import { ShikakuPuzzle } from "./generator";
import { checkShikakuAnchor, checkShikakuComplete } from "./validation";

describe("checkAnchor", () => {
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

  const puzzle = {
    width: 3,
    height: 2,
    infos,
  } as ShikakuPuzzle;

  it("returns true when rectangle contains exactly one matching anchor", () => {
    expect(
      checkShikakuAnchor(
        {
          id: "A",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
        puzzle,
      ),
    ).toBe(true);
  });

  it("returns false when rectangle contains multiple anchors", () => {
    expect(
      checkShikakuAnchor(
        {
          id: "A",
          x: 0,
          y: 0,
          w: 3,
          h: 2,
        },
        puzzle,
      ),
    ).toBe(false);
  });

  it("returns false when area does not match anchor clue", () => {
    expect(
      checkShikakuAnchor(
        {
          id: "A",
          x: 0,
          y: 0,
          w: 1,
          h: 2,
        },
        puzzle,
      ),
    ).toBe(false);
  });
});

describe("checkComplete", () => {
  const puzzle = {
    width: 2,
    height: 2,
    infos: [
      {
        id: "A",
        area: 2,
        anchor: { x: 0, y: 0 },
      },
      {
        id: "B",
        area: 2,
        anchor: { x: 1, y: 1 },
      },
    ],
  } as ShikakuPuzzle;

  it("returns true for a complete valid solution", () => {
    const rects: userRect[] = [
      {
        id: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 1,
        validAnchor: true,
      },
      {
        id: "B",
        x: 0,
        y: 1,
        w: 2,
        h: 1,
        validAnchor: true,
      },
    ];

    expect(checkShikakuComplete(rects, puzzle)).toBe(true);
  });

  it("returns false when rectangle count does not match clues", () => {
    const rects: userRect[] = [
      {
        id: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 1,
        validAnchor: true,
      },
    ];

    expect(checkShikakuComplete(rects, puzzle)).toBe(false);
  });

  it("returns false when any rectangle has invalid anchor", () => {
    const rects: userRect[] = [
      {
        id: "A",
        x: 0,
        y: 0,
        w: 2,
        h: 1,
        validAnchor: true,
      },
      {
        id: "B",
        x: 0,
        y: 1,
        w: 2,
        h: 1,
        validAnchor: false,
      },
    ];

    expect(checkShikakuComplete(rects, puzzle)).toBe(false);
  });

  it("returns false when board is not fully covered", () => {
    const rects: userRect[] = [
      {
        id: "A",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        validAnchor: true,
      },
      {
        id: "B",
        x: 1,
        y: 1,
        w: 1,
        h: 1,
        validAnchor: true,
      },
    ];

    expect(checkShikakuComplete(rects, puzzle)).toBe(false);
  });
});
