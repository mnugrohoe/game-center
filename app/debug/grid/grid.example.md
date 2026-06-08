# Grid System Documentation

A reusable React grid interaction system for puzzle games such as:

- Shikaku
- Slitherlink
- Numberlink / Flow
- Nonogram
- Fill puzzles
- Rectangle selection tools
- Paint/trace style games

The system consists of:

1. `ResponsiveGrid` → rendering + pointer handling
2. `useGrid` → interaction state machine
3. `SwapPathOverlay` → path visualization for Flow-like games

---

# Architecture

```text
ResponsiveGrid
      │
      ▼
 Pointer Events
      │
      ▼
   useGrid
      │
      ├── cell
      ├── rect
      ├── line
      ├── paint
      ├── erase
      ├── pathForward
      ├── pathBacktracable
      └── swap
      │
      ▼
selectedCellKeys
pathOrder
swapPaths
```

---

# Basic Usage

## Create Grid State

```tsx
const grid = useGrid({
  rows: 10,
  cols: 10,
});
```

---

## Render Grid

```tsx
<ResponsiveGrid
  rows={grid.rows}
  cols={grid.cols}
  dragMode="cell"
  onPointerDown={(coord) => {
    grid.processCellInteraction(coord, coord);
  }}
  onDrag={(payload) => {
    if (payload.mode === "cell") {
      grid.processCellInteraction(payload.currentCoord, payload.currentCoord);
    }
  }}
  renderCell={({ coord, cellSize }) => {
    const key = `${coord.x}-${coord.y}`;

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        style={{
          background: grid.selectedCellKeys.has(key) ? "#60a5fa" : "#fff",
        }}
      />
    );
  }}
/>
```

---

# Interaction Modes

Change mode:

```tsx
grid.changeMode("paint");
```

---

## cell

Single selected cell.

```text
□ □ □
□ ■ □
□ □ □
```

Behavior:

- One cell selected
- Drag replaces selection
- Selection persists

```tsx
grid.changeMode("cell");
```

Use cases:

- Sudoku
- Cell picker
- Active cursor

---

## rect

Rectangle drag selection.

```text
■ ■ ■
■ ■ ■
■ ■ ■
```

Behavior:

- Drag start → drag end
- Live rectangle preview
- Must call `persistRectSelection()`

```tsx
grid.changeMode("rect");
```

Drag end:

```tsx
onDragEnd={() => {
  grid.persistRectSelection();
}}
```

Use cases:

- Shikaku
- Area selection
- Spreadsheet selection

---

## line

Horizontal or vertical line.

```text
□ □ □ □
■ ■ ■ ■
□ □ □ □
```

or

```text
□ ■ □
□ ■ □
□ ■ □
```

Behavior:

- Strict axis aligned
- No diagonals

```tsx
grid.changeMode("line");
```

Use cases:

- Line puzzles
- Segment drawing
- Bridges

---

## paint

Free paint mode.

```text
■ ■ □
□ ■ ■
□ □ ■
```

Behavior:

- Every visited cell becomes active
- Cannot remove

```tsx
grid.changeMode("paint");
```

Use cases:

- Nonograms
- Territory marking
- Fill tools

---

## erase

Remove painted cells.

```text
Before:
■ ■ ■

After:
■ □ ■
```

Behavior:

- Removes visited cells

```tsx
grid.changeMode("erase");
```

Use cases:

- Paint editor
- Puzzle corrections

---

## pathForward

Forward-only path.

```text
A → → →
      ↓
      ↓
```

Behavior:

- Cannot backtrack
- Cannot revisit cells
- Auto interpolates between cells

```tsx
grid.changeMode("pathForward");
```

Use cases:

- Snake
- Maze traces
- Directed paths

---

## pathBacktracable

Smart path mode.

```text
A → → →
      ↓
      ↓
```

Backtracking:

```text
A → →
```

Behavior:

- Can backtrack
- Revisiting older nodes trims path
- Supports branch cutting

```tsx
grid.changeMode("pathBacktracable");
```

Use cases:

- Slitherlink
- Trace puzzles
- Maze solving

---

## swap

Flow / Numberlink mode.

```text
R ───── R

B ───── B
```

Behavior:

- Fixed endpoints
- Paths cannot overlap
- Backtracking supported
- Path cutting supported
- Completion detection

```tsx
grid.changeMode("swap");
```

Initialize endpoints:

```tsx
grid.initSwapPaths([
  {
    start: { x: 0, y: 0 },
    end: { x: 5, y: 5 },
    color: "red",
  },
  {
    start: { x: 2, y: 2 },
    end: { x: 8, y: 3 },
    color: "blue",
  },
]);
```

---

# selectedCellKeys

All active cells.

```tsx
grid.selectedCellKeys.has("2-3");
```

Format:

```text
x-y
```

Example:

```text
0-0
1-0
2-0
```

---

# pathOrder

Ordered path.

```tsx
grid.pathOrder;
```

Example:

```ts
["0-0", "1-0", "2-0", "2-1"];
```

Useful for:

- Snake rendering
- Path validation
- Direction analysis

---

# Swap Paths

Access all paths:

```tsx
grid.swapPaths;
```

Each path:

```ts
{
  id: string;
  startPoint: CellCoord;
  endPoint: CellCoord;
  order: string[];
  keySet: Set<string>;
  isComplete: boolean;
  color: string;
}
```

Example:

```ts
{
  id: "0-0",
  order: [
    "0-0",
    "1-0",
    "2-0",
    "2-1"
  ],
  isComplete: false,
  color: "red"
}
```

---

# Rendering Swap Paths

Use `SwapPathOverlay`.

```tsx
<div className="relative">
  <ResponsiveGrid ... />

  <SwapPathOverlay
    cellSize={48}
    gap={0}
    segments={[...grid.swapPaths.values()].map((path) => ({
      order: path.order,
      color: path.color,
      showEndpoints: true,
    }))}
  />
</div>
```

Features:

- Rounded corners
- SVG rendering
- Endpoint circles
- Multiple paths
- Flow-like appearance

---

# Coordinate System

```text
(0,0) ──► x

  │
  │
  ▼

  y
```

Example:

```text
(0,0) (1,0) (2,0)

(0,1) (1,1) (2,1)

(0,2) (1,2) (2,2)
```

---

# Helper Functions

## cellKey

```tsx
cellKey({
  x: 2,
  y: 3,
});
```

Result:

```text
"2-3"
```

---

## keyToCoord

```tsx
keyToCoord("2-3");
```

Result:

```ts
{
  x: 2,
  y: 3
}
```

---

# Recommended Puzzle Mapping

| Puzzle Type | Mode             |
| ----------- | ---------------- |
| Shikaku     | rect             |
| Sudoku      | cell             |
| Nonogram    | paint            |
| Fillomino   | paint            |
| Slitherlink | pathBacktracable |
| Maze Trace  | pathForward      |
| Bridges     | line             |
| Numberlink  | swap             |
| Flow Free   | swap             |

---

# Typical Game Pattern

```tsx
const grid = useGrid({
  rows: puzzle.height,
  cols: puzzle.width,
});

grid.changeMode("swap");

grid.initSwapPaths(puzzle.endpoints);

return (
  <div className="relative">
    <ResponsiveGrid
      rows={grid.rows}
      cols={grid.cols}
      dragMode="cell"
      onPointerDown={(coord) => {
        grid.swapPointerDown(coord);
      }}
      onDrag={(payload) => {
        if (payload.mode === "cell") {
          grid.swapDrag(payload.currentCoord);
        }
      }}
      onDragEnd={() => {
        grid.swapPointerUp();
      }}
      renderCell={renderCell}
    />

    <SwapPathOverlay
      cellSize={48}
      gap={0}
      segments={[...grid.swapPaths.values()].map((path) => ({
        order: path.order,
        color: path.color,
        showEndpoints: true,
      }))}
    />
  </div>
);
```

This pattern covers most puzzle games built on top of the grid system.
