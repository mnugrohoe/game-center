import { ArukonePuzzle } from "./generator";

export interface ArukoneValidationResult {
  isComplete: boolean;
  isSequenceError: boolean;
  reachedClue: number;
  expectedNextClue: number | null;
  filledCellCount: number;
  requiredCellCount: number;
  error?: string;
}

/**
 * Helper untuk menstandarisasi output agar selalu konsisten
 */
const createResult = (
  overrides: Partial<ArukoneValidationResult> & { requiredCellCount: number },
): ArukoneValidationResult => ({
  isComplete: false,
  isSequenceError: false,
  reachedClue: 0,
  expectedNextClue: 1,
  filledCellCount: 0,
  error: undefined,
  ...overrides,
});

function wallKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function parseCoord(key: string) {
  const [x, y] = key.split("-").map(Number);
  return { x, y };
}

export function validateArukone(
  userPath: ArukonePuzzle["solutionPath"],
  grid: ArukonePuzzle["grid"],
  walls: ArukonePuzzle["walls"],
): ArukoneValidationResult {
  const requiredCellCount = Object.keys(grid).length;
  const filledCellCount = userPath.length;

  // 1. Empty state
  if (filledCellCount === 0) {
    return createResult({ requiredCellCount });
  }

  // 2. Build wall lookup
  const wallSet = new Set<string>();
  for (const wall of walls) {
    wallSet.add(wallKey(`${wall.c1}-${wall.r1}`, `${wall.c2}-${wall.r2}`));
  }

  // 3. Validate unique visits, movement, and walls
  const visited = new Set<string>();
  for (let i = 0; i < filledCellCount; i++) {
    const cell = userPath[i];

    if (visited.has(cell)) {
      return createResult({
        requiredCellCount,
        filledCellCount,
        error: `Cell ${cell} visited more than once`,
      });
    }
    visited.add(cell);

    if (i > 0) {
      const prev = userPath[i - 1];
      const p1 = parseCoord(prev);
      const p2 = parseCoord(cell);

      if (Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y) !== 1) {
        return createResult({
          requiredCellCount,
          filledCellCount,
          error: `Invalid move from ${prev} to ${cell}`,
        });
      }

      if (wallSet.has(wallKey(prev, cell))) {
        return createResult({
          requiredCellCount,
          filledCellCount,
          error: `Wall blocks move from ${prev} to ${cell}`,
        });
      }
    }
  }

  // 4. Validate clue sequence
  const maxClue = Math.max(
    ...Object.values(grid)
      .map(Number)
      .filter((n) => !isNaN(n)),
    0,
  );
  let expectedClue = 1;
  let reachedClue = 0;

  for (const cell of userPath) {
    const value = grid[cell];
    if (!value?.trim() || isNaN(Number(value))) continue;

    const clue = Number(value);
    if (clue !== expectedClue) {
      return createResult({
        requiredCellCount,
        filledCellCount,
        isSequenceError: true,
        reachedClue,
        expectedNextClue: expectedClue,
        error: `Expected clue ${expectedClue} but reached clue ${clue}`,
      });
    }
    reachedClue = clue;
    expectedClue++;
  }

  // 5. Final check
  const isComplete =
    reachedClue === maxClue && filledCellCount === requiredCellCount;
  let error: string | undefined;

  if (reachedClue === maxClue && filledCellCount < requiredCellCount) {
    error = "Some cells are still empty.";
  }

  return createResult({
    isComplete,
    reachedClue,
    expectedNextClue: reachedClue === maxClue ? null : reachedClue + 1,
    filledCellCount,
    requiredCellCount,
    error,
  });
}
