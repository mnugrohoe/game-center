"use client";

import { useState, useCallback } from "react";
import useGameBoard, { UseGameBoardReturn } from "@/shared/hooks/useGameBoard";
import { TowerPuzzle } from "../lib/generator";
import { CellCoord } from "@/shared/components/ui/Grid";

type PlayState = {
  sequence: number[];
  submitted: boolean;
  feedback: { correct: number; misplaced: number };
};

export type UseTowerBoardReturn = UseGameBoardReturn<TowerPuzzle, PlayState> & {
  submitGuess: () => void;
  placeColor: (colorValue: number) => void;
  eraseCell: (coord: CellCoord) => void;
  clearRow: () => void;
  copyHistoryRow: (historicalSequence: number[]) => void;
  getCurrentAttemptIdx: () => number;
  revealHint: () => void;
  revealedHints: (number | null)[];
  isHintExhausted: boolean;
  resetBoard: (freshPlayState?: PlayState[]) => void;
  swapCells: (startCoord: CellCoord, endCoord: CellCoord) => void;
};

export default function useTowerBoard(): UseTowerBoardReturn {
  const base = useGameBoard<TowerPuzzle, PlayState>();
  const puzzleData = base.puzzle.value;
  const targetLength = puzzleData?.targetSequence?.length ?? 4;

  const [revealedHints, setRevealedHints] = useState<(number | null)[]>(
    Array(targetLength).fill(null),
  );

  const getCurrentAttemptIdx = useCallback(() => {
    return base.playState.value.filter((row) => row?.submitted).length;
  }, [base.playState.value]);

  const resetBoard = useCallback(
    (freshPlayState?: PlayState[]) => {
      base.resetBoard(freshPlayState);
      setRevealedHints(Array(targetLength).fill(null));
    },
    [base, targetLength],
  );

  const updateCurrentRowSequence = useCallback(
    (updater: (currentSeq: number[]) => number[]) => {
      const currentAttemptIdx = getCurrentAttemptIdx();
      const updatedStateArray = [...base.playState.value];

      if (!updatedStateArray[currentAttemptIdx]) {
        updatedStateArray[currentAttemptIdx] = {
          sequence: Array(targetLength).fill(-1),
          submitted: false,
          feedback: { correct: 0, misplaced: 0 },
        };
      }

      const currentSequence = [
        ...updatedStateArray[currentAttemptIdx].sequence,
      ];
      updatedStateArray[currentAttemptIdx] = {
        ...updatedStateArray[currentAttemptIdx],
        sequence: updater(currentSequence),
      };

      base.playState.setValue(updatedStateArray);
    },
    [base.playState, getCurrentAttemptIdx, targetLength],
  );

  const placeColor = useCallback(
    (colorValue: number) => {
      updateCurrentRowSequence((prev) => {
        const nextSeq = [...prev];
        const emptyIdx = nextSeq.findIndex((v) => v === -1);
        if (emptyIdx !== -1) nextSeq[emptyIdx] = colorValue;
        return nextSeq;
      });
    },
    [updateCurrentRowSequence],
  );

  const eraseCell = useCallback(
    (coord: CellCoord) => {
      // coord.x is the slot index inside the active row
      updateCurrentRowSequence((prev) => {
        const nextSeq = [...prev];
        nextSeq[coord.x] = -1;
        return nextSeq;
      });
    },
    [updateCurrentRowSequence],
  );

  const clearRow = useCallback(() => {
    updateCurrentRowSequence(() => Array(targetLength).fill(-1));
  }, [updateCurrentRowSequence, targetLength]);

  const copyHistoryRow = useCallback(
    (historicalSequence: number[]) => {
      updateCurrentRowSequence(() => [...historicalSequence]);
    },
    [updateCurrentRowSequence],
  );

  const swapCells = useCallback(
    (startCoord: CellCoord, endCoord: CellCoord) => {
      const currentAttemptIdx = getCurrentAttemptIdx();

      // Safety rule: Swapping is only valid within the same, active row workspace
      if (
        startCoord.y !== currentAttemptIdx ||
        endCoord.y !== currentAttemptIdx
      )
        return;
      if (startCoord.x === endCoord.x) return;

      updateCurrentRowSequence((prev) => {
        const nextSeq = [...prev];
        const temp = nextSeq[startCoord.x];
        nextSeq[startCoord.x] = nextSeq[endCoord.x];
        nextSeq[endCoord.x] = temp;
        return nextSeq;
      });
    },
    [getCurrentAttemptIdx, updateCurrentRowSequence],
  );

  const revealHint = useCallback(() => {
    if (!puzzleData) return;
    const unrevealedIndexes: number[] = [];
    revealedHints.forEach((val, idx) => {
      if (val === null) unrevealedIndexes.push(idx);
    });

    if (unrevealedIndexes.length === 0) return;
    const randomIdx =
      unrevealedIndexes[Math.floor(Math.random() * unrevealedIndexes.length)];
    const targetValue = puzzleData.targetSequence[randomIdx];

    setRevealedHints((prev) => {
      const updated = [...prev];
      updated[randomIdx] = targetValue;
      return updated;
    });
  }, [puzzleData, revealedHints]);

  const isHintExhausted = revealedHints.every((val) => val !== null);

  const submitGuess = useCallback(() => {
    if (!puzzleData) return;
    const currentAttemptIdx = getCurrentAttemptIdx();
    const target = puzzleData.targetSequence;
    const activeRow = base.playState.value[currentAttemptIdx];

    if (!activeRow || !activeRow.sequence) return;
    const guess = activeRow.sequence;
    if (guess.some((v) => v === -1)) return;

    let correct = 0;
    let misplaced = 0;
    const remainingTarget: number[] = [];
    const remainingGuess: number[] = [];

    guess.forEach((value, index) => {
      if (value === target[index]) {
        correct++;
      } else {
        remainingTarget.push(target[index]);
        remainingGuess.push(value);
      }
    });

    remainingGuess.forEach((value) => {
      const index = remainingTarget.indexOf(value);
      if (index !== -1) {
        misplaced++;
        remainingTarget.splice(index, 1);
      }
    });

    const updatedPlayState = [...base.playState.value];
    updatedPlayState[currentAttemptIdx] = {
      sequence: [...guess],
      submitted: true,
      feedback: { correct, misplaced },
    };

    base.playState.setValue(updatedPlayState);
  }, [puzzleData, base.playState, getCurrentAttemptIdx]);

  return {
    ...base,
    getCurrentAttemptIdx,
    placeColor,
    eraseCell,
    clearRow,
    copyHistoryRow,
    submitGuess,
    revealHint,
    revealedHints,
    isHintExhausted,
    resetBoard,
    swapCells,
  };
}
