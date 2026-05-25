/**
 * Shikaku solver using shared backtracking algorithm
 */

import { backtrack } from "@/shared/algorithms";
import type { Rect, RectInfo } from "./types";
import { gridKey, overlaps, paintCells } from "./utils";

type Candidate = Rect & {
  cells: Uint16Array;
};

/**
 * Input validation
 */
function validateInputs(
  width: number,
  height: number,
  infos: RectInfo[],
): void {
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("invalid width");
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("invalid height");
  }

  if (infos.length === 0) {
    throw new Error("empty puzzle");
  }

  const boardArea = width * height;

  let totalArea = 0;

  const labels = new Set<string>();
  const anchors = new Set<string>();

  for (const info of infos) {
    if (!info.label) {
      throw new Error("missing label");
    }

    if (labels.has(info.label)) {
      throw new Error(`duplicate label: ${info.label}`);
    }

    labels.add(info.label);

    if (!Number.isInteger(info.area) || info.area <= 0) {
      throw new Error(`invalid area: ${info.label}`);
    }

    totalArea += info.area;

    if (info.area > boardArea) {
      throw new Error(`area too large: ${info.label}`);
    }

    const { x, y } = info.anchor;

    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= width ||
      y >= height
    ) {
      throw new Error(`anchor out of bounds: ${info.label}`);
    }

    const k = `${x},${y}`;

    if (anchors.has(k)) {
      throw new Error(`duplicate anchor: ${k}`);
    }

    anchors.add(k);
  }

  if (totalArea !== boardArea) {
    throw new Error(`area mismatch: ${totalArea}/${boardArea}`);
  }
}

/**
 * Generate all valid rectangle candidates
 */
function candidatesFor(
  width: number,
  height: number,
  info: RectInfo,
  all: RectInfo[],
): Candidate[] {
  const out: Candidate[] = [];

  const target = info.area;

  const ax = info.anchor.x;
  const ay = info.anchor.y;

  for (let rw = 1; rw <= target; rw++) {
    if (target % rw !== 0) continue;

    const rh = target / rw;

    if (rw > width || rh > height) continue;

    const startX = Math.max(0, ax - rw + 1);
    const endX = Math.min(ax, width - rw);

    const startY = Math.max(0, ay - rh + 1);
    const endY = Math.min(ay, height - rh);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const x2 = x + rw;
        const y2 = y + rh;

        let valid = true;

        // no foreign anchors
        for (let i = 0; i < all.length; i++) {
          const other = all[i];

          if (other === info) continue;

          const ox = other.anchor.x;
          const oy = other.anchor.y;

          if (ox >= x && ox < x2 && oy >= y && oy < y2) {
            valid = false;
            break;
          }
        }

        if (!valid) continue;

        const cells = new Uint16Array(target);

        let ptr = 0;

        for (let yy = y; yy < y2; yy++) {
          for (let xx = x; xx < x2; xx++) {
            cells[ptr++] = gridKey(xx, yy, width);
          }
        }

        out.push({
          label: info.label,
          x,
          y,
          w: rw,
          h: rh,
          cells,
        });
      }
    }
  }

  return out;
}

/**
 * Solve Shikaku puzzle using shared backtracking with MRV heuristic
 *
 * @throws Error if puzzle is invalid or has no solution
 */
export function solveShikaku(
  width: number,
  height: number,
  infos: RectInfo[],
): Rect[] {
  validateInputs(width, height, infos);

  const used = new Uint8Array(width * height);

  const candidates = infos.map((info) =>
    candidatesFor(width, height, info, infos),
  );

  // impossible regions
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].length === 0) {
      throw new Error(`unsatisfiable region: ${infos[i].label}`);
    }
  }

  // MRV ordering: sort by number of candidates (fewer first)
  const order = [...infos.keys()].sort(
    (a, b) => candidates[a].length - candidates[b].length,
  );

  const solution: Rect[] = new Array(infos.length);

  const result = backtrack<Candidate, Rect[]>({
    totalSteps: order.length,

    candidates: (step: number) => {
      const idx = order[step];
      return candidates[idx];
    },

    isValid: (choice: Candidate) => {
      return !overlaps(choice.cells, used);
    },

    apply: (choice: Candidate, step: number) => {
      paintCells(choice.cells, used, 1);
      solution[step] = {
        label: choice.label,
        x: choice.x,
        y: choice.y,
        w: choice.w,
        h: choice.h,
      };
    },

    undo: (choice: Candidate) => {
      paintCells(choice.cells, used, 0);
    },

    buildSolution: () => solution,
  });

  if (!result.found) {
    throw new Error("no solution");
  }

  return result.solution!;
}
