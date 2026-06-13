import { describe, it, expect } from "vitest";
import { solveShikaku } from "./solver";
import { generateShikakuBoard } from "./generator"; // Meminjam generator murni agar data 5x5 valid mutlak
import { mkRng } from "@/shared/algorithms";
import type { RectInfo } from "./types";

describe("solveShikaku", () => {
  // ─── SCENARIO 1: SUCCESSFUL SOLVING ─────────────────────────────────────────

  it("should successfully solve a simple 2x2 grid", () => {
    const infos: RectInfo[] = [
      { id: "A", area: 2, anchor: { x: 0, y: 0 } },
      { id: "B", area: 2, anchor: { x: 1, y: 1 } },
    ];

    const result = solveShikaku(2, 2, infos);
    expect(result).toHaveLength(2);

    const rectA = result.find((r) => r.id === "A");
    const rectB = result.find((r) => r.id === "B");

    expect(rectA).toEqual({ id: "A", x: 0, y: 0, w: 1, h: 2 });
    expect(rectB).toEqual({ id: "B", x: 1, y: 0, w: 1, h: 2 });
  });

  it("should successfully solve a standard 5x5 grid puzzle", () => {
    // Membuat board 5x5 yang dijamin valid menggunakan mesin generatormu sendiri
    const rng = mkRng(125);
    const validBoard = generateShikakuBoard(5, 5, 5, rng, {
      minArea: 2,
      compactness: 0.3,
    });

    // Transformasikan hasil board generator menjadi RectInfo input solver
    const infos: RectInfo[] = validBoard.map((rect, idx) => ({
      id: String(idx),
      area: rect.w * rect.h,
      // Letakkan anchor aman di pojok kiri atas masing-masing partisi rectangle
      anchor: { x: rect.x, y: rect.y },
    }));

    const result = solveShikaku(5, 5, infos);
    expect(result).toHaveLength(5);

    // Validasi cakupan spasial grid
    const gridCheck = new Uint8Array(5 * 5);
    for (const rect of result) {
      const sourceInfo = infos.find((i) => i.id === rect.id);
      expect(rect.w * rect.h).toBe(sourceInfo?.area);

      for (let y = rect.y; y < rect.y + rect.h; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
          const cell = y * 5 + x;
          expect(gridCheck[cell]).toBe(0); // Tidak boleh tumpang tindih
          gridCheck[cell] = 1;
        }
      }
    }
    expect(gridCheck.every((cell) => cell === 1)).toBe(true);
  });

  // ─── SCENARIO 2: INPUT VALIDATION (ERROR HANDLING) ──────────────────────────

  describe("Input Validations", () => {
    it("should throw error if width or height is invalid", () => {
      const validInfos: RectInfo[] = [
        { id: "A", area: 4, anchor: { x: 0, y: 0 } },
      ];
      expect(() => solveShikaku(0, 4, validInfos)).toThrow("invalid width");
      expect(() => solveShikaku(4, -1, validInfos)).toThrow("invalid height");
    });

    it("should throw error if puzzle infos array is empty", () => {
      expect(() => solveShikaku(4, 4, [])).toThrow("empty puzzle");
    });

    it("should throw error if total areas do not match the board dimensions", () => {
      const infos: RectInfo[] = [
        { id: "A", area: 5, anchor: { x: 0, y: 0 } },
        { id: "B", area: 5, anchor: { x: 2, y: 2 } },
      ];
      expect(() => solveShikaku(3, 3, infos)).toThrow("area mismatch: 10/9");
    });

    it("should throw error if an anchor is out of bounds", () => {
      const infos: RectInfo[] = [{ id: "A", area: 4, anchor: { x: 2, y: 0 } }];
      expect(() => solveShikaku(2, 2, infos)).toThrow(
        "anchor out of bounds: A",
      );
    });

    it("should throw error if there are duplicate labels or anchors", () => {
      const duplicateLabels: RectInfo[] = [
        { id: "A", area: 2, anchor: { x: 0, y: 0 } },
        { id: "A", area: 2, anchor: { x: 0, y: 1 } },
      ];
      expect(() => solveShikaku(2, 2, duplicateLabels)).toThrow(
        "duplicate label: A",
      );

      const duplicateAnchors: RectInfo[] = [
        { id: "A", area: 2, anchor: { x: 0, y: 0 } },
        { id: "B", area: 2, anchor: { x: 0, y: 0 } },
      ];
      expect(() => solveShikaku(2, 2, duplicateAnchors)).toThrow(
        "duplicate anchor: 0,0",
      );
    });
  });

  // ─── SCENARIO 3: UNSATISFIABLE PUZZLES ──────────────────────────────────────

  describe("Unsatisfiable Puzzles", () => {
    it("should throw error if a region cannot formulate any valid candidate geometry", () => {
      const infos: RectInfo[] = [{ id: "A", area: 4, anchor: { x: 0, y: 0 } }];
      expect(() => solveShikaku(1, 3, infos)).toThrow("area too large: A");
    });

    it("should throw error if a single region has zero candidates due to nearby anchors", () => {
      const infos: RectInfo[] = [
        { id: "A", area: 3, anchor: { x: 0, y: 0 } },
        { id: "B", area: 1, anchor: { x: 1, y: 0 } },
      ];
      expect(() => solveShikaku(2, 2, infos)).toThrow(
        "unsatisfiable region: A",
      );
    });

    it("should throw error if backtracking finishes without finding a valid solution", () => {
      const infos: RectInfo[] = [
        { id: "A", area: 2, anchor: { x: 0, y: 0 } },
        { id: "B", area: 2, anchor: { x: 0, y: 1 } },
      ];
      // Solver mendeteksi kebuntuan awal pada struktur allCandidates karena
      // salah satu region terhimpit/terkurung oleh posisi anchor lainnya.
      expect(() => solveShikaku(1, 4, infos)).toThrow("unsatisfiable region");
    });
  });
});
