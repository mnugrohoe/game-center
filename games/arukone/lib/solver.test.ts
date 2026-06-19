// solver.test.ts
import { solveArukone } from "./solver";

// ── helpers ───────────────────────────────────────────────────────────────────

function grid(entries: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [k, String(v)]),
  );
}

function expectPath(result: string[] | null) {
  return {
    toBeNull: () => expect(result).toBeNull(),
    toVisitAllCells: (rows: number, cols: number) => {
      expect(result).not.toBeNull();
      expect(result!.length).toBe(rows * cols);
    },
    toStartAt: (cell: string) => {
      expect(result).not.toBeNull();
      expect(result![0]).toBe(cell);
    },
    toEndAt: (cell: string) => {
      expect(result).not.toBeNull();
      expect(result![result!.length - 1]).toBe(cell);
    },
    toPassThrough: (cell: string, before: string) => {
      expect(result).not.toBeNull();
      const iCell = result!.indexOf(cell);
      const iBefore = result!.indexOf(before);
      expect(iCell).toBeGreaterThanOrEqual(0);
      expect(iBefore).toBeGreaterThanOrEqual(0);
      expect(iCell).toBeLessThan(iBefore);
    },
    toBeValidHamiltonianPath: (rows: number, cols: number) => {
      expect(result).not.toBeNull();
      const path = result!;
      // covers all cells
      expect(path.length).toBe(rows * cols);
      // no duplicates
      expect(new Set(path).size).toBe(path.length);
      // each step is adjacent
      for (let i = 1; i < path.length; i++) {
        const [x1, y1] = path[i - 1].split("-").map(Number);
        const [x2, y2] = path[i].split("-").map(Number);
        const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
        expect(dist).toBe(1);
      }
    },
  };
}

// ── guard tests ───────────────────────────────────────────────────────────────

describe("solveArukone — guards", () => {
  test("returns null for empty grid", () => {
    expectPath(
      solveArukone({ rows: 3, cols: 3, grid: {}, walls: [] }),
    ).toBeNull();
  });

  test("returns null if no clue starts at 1", () => {
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: grid({ "0-0": 2, "1-1": 4 }),
        walls: [],
      }),
    ).toBeNull();
  });

  test("returns null for duplicate clue values", () => {
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: grid({ "0-0": 1, "1-0": 1, "0-1": 2 }),
        walls: [],
      }),
    ).toBeNull();
  });

  test("returns null if maxClue exceeds totalCells", () => {
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: grid({ "0-0": 1, "1-1": 99 }),
        walls: [],
      }),
    ).toBeNull();
  });

  test("returns null for non-integer clue values", () => {
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: { "0-0": "1", "1-1": "2.5" },
        walls: [],
      }),
    ).toBeNull();
  });

  test("returns null if clues are not strictly ascending", () => {
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: grid({ "0-0": 1, "1-0": 3, "0-1": 2 }),
        walls: [],
      }),
    ).toBeNull();
  });
});

// ── basic correctness ─────────────────────────────────────────────────────────

describe("solveArukone — basic correctness", () => {
  test("2x2: start=1 end=4, fills all cells", () => {
    const result = solveArukone({
      rows: 2,
      cols: 2,
      grid: grid({ "0-0": 1, "1-1": 4 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(2, 2);
    p.toStartAt("0-0");
    p.toEndAt("1-1");
  });

  test("3x3: consecutive clues 1→5→9", () => {
    const result = solveArukone({
      rows: 3,
      cols: 3,
      grid: grid({ "0-0": 1, "2-1": 5, "2-2": 9 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(3, 3);
    p.toStartAt("0-0");
    p.toEndAt("2-2");
    p.toPassThrough("2-1", "2-2");
  });

  test("path always starts at clue 1", () => {
    const result = solveArukone({
      rows: 2,
      cols: 3,
      grid: grid({ "1-1": 1, "0-0": 6 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toStartAt("1-1");
    p.toEndAt("0-0");
  });
});

// ── last clue endpoint ────────────────────────────────────────────────────────

describe("solveArukone — last clue must be endpoint", () => {
  test("6x6: last clue at specific cell must be final cell", () => {
    // clues: 1 at top-left, 9 at top-right — path must END at 9
    const result = solveArukone({
      rows: 6,
      cols: 6,
      grid: grid({ "0-0": 1, "5-0": 9 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(6, 6);
    p.toStartAt("0-0");
    p.toEndAt("5-0");
  });

  test("non-consecutive clues: 1,2,3,4,5,9 — path must end at clue 9", () => {
    const result = solveArukone({
      rows: 6,
      cols: 6,
      grid: grid({
        "2-0": 1, // top
        "0-5": 2,
        "2-5": 3,
        "0-3": 4, // from image
        "5-5": 5,
        "5-0": 9, // must be last
      }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(6, 6);
    p.toStartAt("2-0");
    p.toEndAt("5-0");
  });

  test("path ends at maxClue even when clues have gaps (1,3,7)", () => {
    const result = solveArukone({
      rows: 3,
      cols: 3,
      grid: grid({ "0-0": 1, "2-0": 3, "2-2": 7 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(3, 3);
    p.toStartAt("0-0");
    p.toEndAt("2-2");
  });
});

// ── clue ordering ─────────────────────────────────────────────────────────────

describe("solveArukone — clue ordering", () => {
  test("clues visited in ascending order", () => {
    const result = solveArukone({
      rows: 3,
      cols: 3,
      grid: grid({ "0-0": 1, "1-1": 4, "2-2": 7, "0-2": 9 }),
      walls: [],
    });
    expect(result).not.toBeNull();
    const path = result!;
    const i1 = path.indexOf("0-0");
    const i4 = path.indexOf("1-1");
    const i7 = path.indexOf("2-2");
    const i9 = path.indexOf("0-2");
    expect(i1).toBeLessThan(i4);
    expect(i4).toBeLessThan(i7);
    expect(i7).toBeLessThan(i9);
  });

  test("non-consecutive gaps skipped correctly (1,5,9)", () => {
    const result = solveArukone({
      rows: 3,
      cols: 3,
      grid: grid({ "0-0": 1, "2-1": 5, "0-2": 9 }),
      walls: [],
    });
    expect(result).not.toBeNull();
    const path = result!;
    expect(path.indexOf("0-0")).toBeLessThan(path.indexOf("2-1"));
    expect(path.indexOf("2-1")).toBeLessThan(path.indexOf("0-2"));
  });
});

// ── walls ─────────────────────────────────────────────────────────────────────

describe("solveArukone — walls", () => {
  test("wall blocks direct path, solver finds alternate route", () => {
    // 2x2, wall between (0,0)-(1,0) forces snake path
    const result = solveArukone({
      rows: 2,
      cols: 2,
      grid: grid({ "0-0": 1, "1-0": 4 }),
      walls: [{ r1: 0, c1: 0, r2: 0, c2: 1 }],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(2, 2);
    // direct neighbor blocked, must go around
    const path = result!;
    expect(path[1]).not.toBe("1-0"); // can't step directly right
  });

  test("returns null when walls make hamiltonian path impossible", () => {
    // 2x2 with walls isolating corner
    expectPath(
      solveArukone({
        rows: 2,
        cols: 2,
        grid: grid({ "0-0": 1, "1-1": 4 }),
        walls: [
          { r1: 0, c1: 0, r2: 0, c2: 1 }, // top wall
          { r1: 0, c1: 0, r2: 1, c2: 0 }, // left wall
        ],
      }),
    ).toBeNull();
  });

  test("path respects walls throughout", () => {
    const walls = [{ r1: 0, c1: 1, r2: 1, c2: 1 }];
    const result = solveArukone({
      rows: 3,
      cols: 3,
      grid: grid({ "0-0": 1, "2-2": 9 }),
      walls,
    });
    if (result) {
      // verify no step crosses the wall
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        const isBlockedEdge =
          (prev === "1-0" && curr === "1-1") ||
          (prev === "1-1" && curr === "1-0");
        expect(isBlockedEdge).toBe(false);
      }
    }
  });
});

// ── single clue (only 1) ──────────────────────────────────────────────────────

describe("solveArukone — single clue", () => {
  test("single clue=1 on 1x1 grid", () => {
    const result = solveArukone({
      rows: 1,
      cols: 1,
      grid: grid({ "0-0": 1 }),
      walls: [],
    });
    expect(result).not.toBeNull();
    expect(result).toEqual(["0-0"]);
  });

  test("single clue=1, path fills entire grid", () => {
    const result = solveArukone({
      rows: 2,
      cols: 2,
      grid: grid({ "0-0": 1 }),
      walls: [],
    });
    const p = expectPath(result);
    p.toBeValidHamiltonianPath(2, 2);
    p.toStartAt("0-0");
  });
});
