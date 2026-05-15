# Refactor Plan (Kings) — Progress

## Step 0 — Baseline understanding

- [x] Scanned relevant Kings files (hook + components)

## Step 1 — Performance: memoize conflictMap

- [ ] Update `games/kings/hooks/useKingsGame.ts` to compute a `conflictMap` (and/or `hasAnyConflict`) without per-cell recomputation in render.
- [ ] Update `games/kings/components/Board.tsx` (and any other board rendering) to use `conflictMap` instead of calling `game.hasConflict(...)` per cell.

## Step 2 — Logic cleanup: unify move application/history/autoLocked

- [ ] Refactor `useKingsGame.ts` to apply moves through a single internal function to avoid nested `setState` calls.

## Step 3 — UI unification: remove/replace monolithic `KingsGame.tsx`

- [ ] Ensure `app/kings/page.tsx` and/or generator flow uses the provider-based UI.
- [ ] Replace monolithic `games/kings/components/KingsGame.tsx` with a thin wrapper that composes `KingGameProvider` + existing presentational components.

## Step 4 — Validation

- [ ] Run lint/typecheck
- [ ] Smoke test kings game page in browser
