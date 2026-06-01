import { describe, expect, it } from "vitest";
import { area, isValidRect, overlaps, pickAnchor } from "./utils";

describe("area", () => {
  it("calculates rectangle area", () => {
    expect(area({ w: 3, h: 4 })).toBe(12);
  });

  it("returns zero when width is zero", () => {
    expect(area({ w: 0, h: 5 })).toBe(0);
  });
});

describe("isValidRect", () => {
  it("returns true for valid rectangle", () => {
    expect(
      isValidRect(
        {
          w: 3,
          h: 2,
        },
        4,
      ),
    ).toBe(true);
  });

  it("returns false for zero width", () => {
    expect(
      isValidRect(
        {
          w: 0,
          h: 2,
        },
        1,
      ),
    ).toBe(false);
  });

  it("returns false for zero height", () => {
    expect(
      isValidRect(
        {
          w: 2,
          h: 0,
        },
        1,
      ),
    ).toBe(false);
  });

  it("returns false when area is below minimum", () => {
    expect(
      isValidRect(
        {
          w: 2,
          h: 2,
        },
        5,
      ),
    ).toBe(false);
  });

  it("accepts area equal to minimum", () => {
    expect(
      isValidRect(
        {
          w: 2,
          h: 2,
        },
        4,
      ),
    ).toBe(true);
  });
});

describe("pickAnchor", () => {
  const rect = {
    x: 10,
    y: 20,
    w: 8,
    h: 8,
  };

  describe("easy mode (ambiguity <= 0.33)", () => {
    it("picks anchor inside center region", () => {
      const rng = () => 0;

      const anchor = pickAnchor(rng, rect, 0);

      expect(anchor).toEqual({
        x: 12,
        y: 22,
      });
    });

    it("stays within center-biased bounds", () => {
      const rng = () => 0.999;

      const anchor = pickAnchor(rng, rect, 0.2);

      expect(anchor.x).toBeGreaterThanOrEqual(12);
      expect(anchor.x).toBeLessThan(16);

      expect(anchor.y).toBeGreaterThanOrEqual(22);
      expect(anchor.y).toBeLessThan(16 + 12);
    });
  });

  describe("medium mode (0.33 < ambiguity <= 0.66)", () => {
    it("selects fully random position", () => {
      const values = [0.5, 0.25];
      let i = 0;

      const rng = () => values[i++];

      expect(pickAnchor(rng, rect, 0.5)).toEqual({
        x: 14,
        y: 22,
      });
    });

    it("can select top-left cell", () => {
      const rng = () => 0;

      expect(pickAnchor(rng, rect, 0.5)).toEqual({
        x: 10,
        y: 20,
      });
    });
  });

  describe("hard mode (ambiguity > 0.66)", () => {
    it("selects top edge", () => {
      const values = [0.0, 0.5];
      let i = 0;

      const rng = () => values[i++];

      expect(pickAnchor(rng, rect, 1)).toEqual({
        x: 14,
        y: 20,
      });
    });

    it("selects bottom edge", () => {
      const values = [0.3, 0.5];
      let i = 0;

      const rng = () => values[i++];

      expect(pickAnchor(rng, rect, 1)).toEqual({
        x: 14,
        y: 27,
      });
    });

    it("selects left edge", () => {
      const values = [0.6, 0.5];
      let i = 0;

      const rng = () => values[i++];

      expect(pickAnchor(rng, rect, 1)).toEqual({
        x: 10,
        y: 24,
      });
    });

    it("selects right edge", () => {
      const values = [0.9, 0.5];
      let i = 0;

      const rng = () => values[i++];

      expect(pickAnchor(rng, rect, 1)).toEqual({
        x: 17,
        y: 24,
      });
    });
  });

  it("handles 1x1 rectangle", () => {
    const anchor = pickAnchor(
      () => 0,
      {
        x: 5,
        y: 7,
        w: 1,
        h: 1,
      },
      0.5,
    );

    expect(anchor).toEqual({
      x: 5,
      y: 7,
    });
  });
});

describe("overlaps", () => {
  it("returns true for overlapping rectangles", () => {
    expect(
      overlaps(
        {
          x: 0,
          y: 0,
          w: 3,
          h: 3,
        },
        {
          x: 2,
          y: 2,
          w: 3,
          h: 3,
        },
      ),
    ).toBe(true);
  });

  it("returns false for separated rectangles", () => {
    expect(
      overlaps(
        {
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
        {
          x: 5,
          y: 5,
          w: 2,
          h: 2,
        },
      ),
    ).toBe(false);
  });

  it("returns false when touching horizontally", () => {
    expect(
      overlaps(
        {
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
        {
          x: 2,
          y: 0,
          w: 2,
          h: 2,
        },
      ),
    ).toBe(false);
  });

  it("returns false when touching vertically", () => {
    expect(
      overlaps(
        {
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
        {
          x: 0,
          y: 2,
          w: 2,
          h: 2,
        },
      ),
    ).toBe(false);
  });

  it("returns true when one rectangle is fully inside another", () => {
    expect(
      overlaps(
        {
          x: 0,
          y: 0,
          w: 10,
          h: 10,
        },
        {
          x: 3,
          y: 3,
          w: 2,
          h: 2,
        },
      ),
    ).toBe(true);
  });

  it("is symmetric", () => {
    const a = {
      x: 1,
      y: 1,
      w: 4,
      h: 4,
    };

    const b = {
      x: 3,
      y: 3,
      w: 4,
      h: 4,
    };

    expect(overlaps(a, b)).toBe(overlaps(b, a));
  });
});
