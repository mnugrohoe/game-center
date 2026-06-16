# useGameBoard

Generic React hook for managing game board state with optional delta-based undo/redo support.

The hook acts as a lightweight state layer and does not contain any game-specific logic. Validation rules, scoring systems, hints, and win conditions should be implemented separately by the consuming game module.

---

## Features

- Puzzle state management
- Custom puzzle state management
- Move state management
- Attempt tracking
- Undo / Redo support
- Delta-based history engine
- Fully generic and type-safe
- Can be used with or without history support

---

## Import

```tsx
import useGameBoard from "@/hooks/useGameBoard";
```

---

## Basic Usage

```tsx
const board = useGameBoard<PuzzleData, MoveData>();

board.playState.setValue(newMoves);

board.attempt.setValue((prev) => prev + 1);
```

---

## Function Signature

```tsx
const board = useGameBoard<
  TPuzzle,
  TMove,
  TDeltaInfo,
  TValue
>(
  initialMoves?,
  applyDelta?,
  maxHistory?
);
```

### Parameters

| Parameter      | Type                                   | Default     | Description                                 |
| -------------- | -------------------------------------- | ----------- | ------------------------------------------- |
| `initialMoves` | `TMove \| null`                        | `null`      | Initial move state                          |
| `applyDelta`   | `(currentMoves, info, value) => TMove` | `undefined` | Delta application handler used by undo/redo |
| `maxHistory`   | `number`                               | `100`       | Maximum number of stored history entries    |

---

## Returned API

### puzzle

Stores the original puzzle data.

```tsx
board.puzzle.value;
board.puzzle.setValue(nextPuzzle);
```

---

### customPuzzle

Stores user-generated or customized puzzle data.

```tsx
board.customPuzzle.value;
board.customPuzzle.setValue(nextCustomPuzzle);
```

---

### moves

Stores the active board state.

```tsx
board.playState.value;
board.playState.setValue(nextMoves);
```

---

### attempt

Tracks attempt count.

```tsx
board.attempt.value;
board.attempt.setValue((prev) => prev + 1);
```

---

### undo

Reverts the most recent delta operation.

```tsx
board.undo();
```

---

### redo

Reapplies a previously reverted delta operation.

```tsx
board.redo();
```

---

### canUndo

Indicates whether an undo action is currently available.

```tsx
board.canUndo;
```

---

### canRedo

Indicates whether a redo action is currently available.

```tsx
board.canRedo;
```

---

### recordDeltaMove

Applies a move while recording it into history.

```tsx
board.recordDeltaMove(info, nextValue, getPrevValue);
```

#### Parameters

| Parameter      | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| `info`         | Mutation metadata (coordinates, identifiers, etc.)             |
| `nextValue`    | New value to apply                                             |
| `getPrevValue` | Callback used to extract the previous value from current moves |

#### Example

```tsx
board.recordDeltaMove(
  {
    row: 3,
    col: 5,
  },
  9,
  (grid) => grid[3][5],
);
```

---

### resetBoard

Resets board state and clears history.

```tsx
board.resetBoard();
```

or

```tsx
board.resetBoard(freshMoves);
```

---

## Enabling Undo / Redo

Undo and redo functionality are available only when an `applyDelta` function is provided.

```tsx
const board = useGameBoard(initialMoves, (currentMoves, info, value) => {
  const next = [...currentMoves];

  next[info.row][info.col] = value;

  return next;
});
```

---

## Sudoku Example

```tsx
type CellValue = number;

type SudokuMoves = CellValue[][];

type SudokuDeltaInfo = {
  row: number;
  col: number;
};

const board = useGameBoard<SudokuPuzzle, SudokuMoves, SudokuDeltaInfo, number>(
  initialGrid,
  (grid, info, value) => {
    const next = grid.map((row) => [...row]);

    next[info.row][info.col] = value;

    return next;
  },
);
```

Record a move:

```tsx
board.recordDeltaMove(
  {
    row: 2,
    col: 5,
  },
  7,
  (grid) => grid[2][5],
);
```

Undo:

```tsx
board.undo();
```

Redo:

```tsx
board.redo();
```

---

## Using Without History Support

The hook can be used purely as a state container.

```tsx
const board = useGameBoard<PuzzleData, MoveData>(initialMoves);
```

In this mode:

```tsx
board.canUndo === false;
board.canRedo === false;
```

The following methods become no-ops:

```tsx
board.undo();
board.redo();
board.recordDeltaMove(...);
```

---

## Generic Parameters

| Generic      | Description                                |
| ------------ | ------------------------------------------ |
| `TPuzzle`    | Original puzzle structure                  |
| `TMove`      | Active move state structure                |
| `TDeltaInfo` | Metadata used to identify mutation targets |
| `TValue`     | Value stored at mutation targets           |

Example:

```tsx
useGameBoard<
  SudokuPuzzle,
  SudokuGrid,
  {
    row: number;
    col: number;
  },
  number
>();
```

---

## Architecture

```text
Puzzle Data
     │
     ▼
 useGameBoard
     │
     ├── puzzle
     ├── customPuzzle
     ├── moves
     ├── attempt
     ├── undo / redo
     └── delta history
     │
     ▼
 UI Components
```

`useGameBoard` is intentionally game-agnostic and focuses solely on state orchestration and optional history management.
