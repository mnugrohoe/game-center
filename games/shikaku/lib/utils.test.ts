import { describe, it, expect } from "vitest";
import {
  area,
  isValidRect,
  getLabel,
  gridKey,
  overlaps,
  paintCells,
} from "./utils";

describe("utils", () => {
  describe("area()", () => {
    it("calculates area correctly", () => {
      expect(area({ w: 2, h: 3 })).toBe(6);
      expect(area({ w: 1, h: 1 })).toBe(1);
      expect(area({ w: 10, h: 5 })).toBe(50);
    });
  });

  describe("isValidRect()", () => {
    it("validates rect with sufficient area", () => {
      expect(isValidRect({ w: 2, h: 2 }, 4)).toBe(true);
      expect(isValidRect({ w: 3, h: 2 }, 6)).toBe(true);
    });

    it("rejects rect with zero dimensions", () => {
      expect(isValidRect({ w: 0, h: 2 }, 1)).toBe(false);
      expect(isValidRect({ w: 2, h: 0 }, 1)).toBe(false);
    });

    it("rejects rect with insufficient area", () => {
      expect(isValidRect({ w: 2, h: 2 }, 5)).toBe(false);
    });
  });

  describe("getLabel()", () => {
    it("returns labels for valid indices", () => {
      expect(getLabel(0)).toBe("0");
      expect(getLabel(9)).toBe("9");
      expect(getLabel(10)).toBe("A");
      expect(getLabel(35)).toBe("Z");
      expect(getLabel(36)).toBe("a");
    });

    it("returns R{n} for out-of-range indices", () => {
      expect(getLabel(100)).toBe("R100");
      expect(getLabel(1000)).toBe("R1000");
    });
  });

  describe("gridKey()", () => {
    it("calculates grid key correctly", () => {
      expect(gridKey(0, 0, 10)).toBe(0);
      expect(gridKey(5, 0, 10)).toBe(5);
      expect(gridKey(0, 1, 10)).toBe(10);
      expect(gridKey(3, 2, 10)).toBe(23);
    });
  });

  describe("overlaps()", () => {
    it("detects overlaps", () => {
      const used = new Uint8Array(10);
      used[0] = 1;
      used[5] = 1;

      const cells = new Uint16Array([0, 1, 2]);
      expect(overlaps(cells, used)).toBe(true);
    });

    it("returns false when no overlaps", () => {
      const used = new Uint8Array(10);
      used[0] = 1;
      used[5] = 1;

      const cells = new Uint16Array([2, 3, 4]);
      expect(overlaps(cells, used)).toBe(false);
    });
  });

  describe("paintCells()", () => {
    it("marks cells as used", () => {
      const used = new Uint8Array(10);
      const cells = new Uint16Array([0, 2, 4]);

      paintCells(cells, used, 1);

      expect(used[0]).toBe(1);
      expect(used[1]).toBe(0);
      expect(used[2]).toBe(1);
      expect(used[4]).toBe(1);
    });

    it("marks cells as unused", () => {
      const used = new Uint8Array(10);
      used[0] = 1;
      used[2] = 1;
      used[4] = 1;

      const cells = new Uint16Array([0, 2, 4]);

      paintCells(cells, used, 0);

      expect(used[0]).toBe(0);
      expect(used[2]).toBe(0);
      expect(used[4]).toBe(0);
    });
  });
});
