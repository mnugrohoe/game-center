"use client";

import { useCallback, useState } from "react";

/**
 * Wraps a value together with its React state dispatcher.
 *
 * @template T Value type.
 */
export interface StateProp<T> {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Represents a single reversible state mutation.
 *
 * @template TDeltaInfo Metadata identifying the mutation target.
 * @template TValue Value type being changed.
 */
export interface DeltaItem<TDeltaInfo, TValue> {
  info: TDeltaInfo;
  prevVal: TValue;
  nextVal: TValue;
}

/**
 * Return contract for {@link useGameBoard}.
 *
 * @template TPuzzle Static puzzle definition.
 * @template TPlayState Active user play state item type.
 * @template TDeltaInfo Metadata identifying mutation targets.
 * @template TValue Value applied by delta operations.
 */
export interface UseGameBoardReturn<
  TPuzzle,
  TPlayState,
  TDeltaInfo = unknown,
  TValue = unknown,
> {
  puzzle: StateProp<TPuzzle | null>;
  customPuzzle: StateProp<Partial<TPuzzle> | null>;
  playState: StateProp<TPlayState[]>;
  attempt: StateProp<number>;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;

  recordDelta: (
    info: TDeltaInfo,
    nextVal: TValue,
    getPrevVal: (currentPlayState: TPlayState[]) => TValue,
  ) => void;

  resetBoard: (freshPlayState?: TPlayState[]) => void;
}

/**
 * Manages puzzle state, active play state, attempt tracking,
 * and optional delta-based undo/redo history.
 *
 * @template TPuzzle Static puzzle definition.
 * @template TPlayState Active user play state item type.
 * @template TDeltaInfo Metadata identifying mutation targets.
 * @template TValue Value applied by delta operations.
 *
 * @param initialPlayState Initial play state.
 * @param applyStateDelta Function responsible for applying a delta mutation.
 * @param maxHistory Maximum number of history entries retained.
 */
export default function useGameBoard<
  TPuzzle,
  TPlayState,
  TDeltaInfo = unknown,
  TValue = unknown,
>(
  initialPlayState: TPlayState[] = [],
  applyStateDelta?: (
    currentPlayState: TPlayState[],
    info: TDeltaInfo,
    valueToApply: TValue,
  ) => TPlayState[],
  maxHistory = 100,
): UseGameBoardReturn<TPuzzle, TPlayState, TDeltaInfo, TValue> {
  const [puzzle, setPuzzle] = useState<TPuzzle | null>(null);
  const [customPuzzle, setCustomPuzzle] = useState<Partial<TPuzzle> | null>(
    null,
  );

  const [attempt, setAttempt] = useState(1);
  const [playState, setPlayState] = useState<TPlayState[]>(initialPlayState);

  const [history, setHistory] = useState<DeltaItem<TDeltaInfo, TValue>[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  const recordDelta = useCallback(
    (
      info: TDeltaInfo,
      nextVal: TValue,
      getPrevVal: (currentPlayState: TPlayState[]) => TValue,
    ) => {
      if (!applyStateDelta) return;

      const prevVal = getPrevVal(playState);

      if (Object.is(prevVal, nextVal)) return;

      const activeHistory = history.slice(0, historyPointer + 1);

      setPlayState((currentPlayState) =>
        applyStateDelta(currentPlayState, info, nextVal),
      );

      const nextHistory = [
        ...activeHistory,
        {
          info,
          prevVal,
          nextVal,
        },
      ];

      if (nextHistory.length > maxHistory) {
        setHistory(nextHistory.slice(1));
      } else {
        setHistory(nextHistory);
        setHistoryPointer((prev) => prev + 1);
      }
    },
    [applyStateDelta, history, historyPointer, maxHistory, playState],
  );

  const undo = useCallback(() => {
    if (!applyStateDelta || historyPointer < 0) return;

    const delta = history[historyPointer];

    if (!delta) return;

    setPlayState((currentPlayState) =>
      applyStateDelta(currentPlayState, delta.info, delta.prevVal),
    );

    setHistoryPointer((prev) => prev - 1);
  }, [applyStateDelta, history, historyPointer]);

  const redo = useCallback(() => {
    if (!applyStateDelta) return;

    const nextPointer = historyPointer + 1;

    if (nextPointer >= history.length) return;

    const delta = history[nextPointer];

    if (!delta) return;

    setPlayState((currentPlayState) =>
      applyStateDelta(currentPlayState, delta.info, delta.nextVal),
    );

    setHistoryPointer(nextPointer);
  }, [applyStateDelta, history, historyPointer]);

  const resetBoard = useCallback(
    (freshPlayState?: TPlayState[]) => {
      setPlayState(freshPlayState ?? initialPlayState ?? []);
      setHistory([]);
      setHistoryPointer(-1);
      setAttempt(1);
    },
    [initialPlayState],
  );

  const isHistoryEnabled = typeof applyStateDelta === "function";

  const canUndo =
    isHistoryEnabled &&
    historyPointer >= 0 &&
    history[historyPointer] !== undefined;

  const canRedo =
    isHistoryEnabled &&
    historyPointer < history.length - 1 &&
    history[historyPointer + 1] !== undefined;

  return {
    puzzle: {
      value: puzzle,
      setValue: setPuzzle,
    },

    customPuzzle: {
      value: customPuzzle,
      setValue: setCustomPuzzle,
    },

    playState: {
      value: playState,
      setValue: setPlayState,
    },

    attempt: {
      value: attempt,
      setValue: setAttempt,
    },

    undo,
    redo,

    canUndo,
    canRedo,

    recordDelta,
    resetBoard,
  };
}
