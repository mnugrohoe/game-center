"use client";

import { useMemo, useState } from "react";
import {
  FaEraser,
  FaQuestion,
  FaRegCopy,
  FaWandSparkles,
  FaX,
} from "react-icons/fa6";
import { FaLevelDownAlt } from "react-icons/fa";
import { COLOR_POOL, TowerDiffTier } from "../lib/difficulty";

interface BoardRow {
  grid: number[];
  submitted: boolean;
  feedback: {
    correct: number;
    misplaced: number;
  };
}

function ColorPeg({
  value,
  size = "h-5 w-5",
}: {
  value: number;
  size?: string;
}) {
  return (
    <div
      className={`tower-block rounded-full ${size}`}
      style={{
        backgroundColor:
          value > 0 ? COLOR_POOL[(value - 1) % COLOR_POOL.length] : "#314158",
      }}
    />
  );
}

function HiddenPeg({ failed = false }: { failed?: boolean }) {
  return (
    <div
      className={`tower-block rounded-full h-5 w-5 flex items-center justify-center ${
        failed ? "bg-slate-700 text-red-700" : "bg-slate-700 text-slate-400"
      }`}
    >
      {failed ? (
        <FaX className="w-3 h-3" />
      ) : (
        <FaQuestion className="w-3 h-3" />
      )}
    </div>
  );
}

function FeedbackDots({
  correct,
  misplaced,
}: {
  correct: number;
  misplaced: number;
}) {
  return (
    <div className="grid grid-rows-2 grid-flow-col gap-1">
      {Array.from({ length: correct }).map((_, i) => (
        <div
          key={`c-${i}`}
          className="tower-block rounded-full h-1.5 w-1.5 bg-slate-300 border border-slate-700"
        />
      ))}

      {Array.from({ length: misplaced }).map((_, i) => (
        <div
          key={`m-${i}`}
          className="tower-block rounded-full h-1.5 w-1.5 bg-transparent border border-slate-700"
        />
      ))}
    </div>
  );
}

export default function TowerBoard({
  target,
  tier,
}: {
  target: number[];
  tier: TowerDiffTier;
}) {
  const MAX_ATTEMPT = target.length * 2;

  const EMPTY_BOARD = useMemo<BoardRow[]>(
    () =>
      Array.from({ length: MAX_ATTEMPT }, () => ({
        grid: Array(target.length).fill(0),
        submitted: false,
        feedback: {
          correct: 0,
          misplaced: 0,
        },
      })),
    [MAX_ATTEMPT, target.length],
  );

  const [board, setBoard] = useState<BoardRow[]>(EMPTY_BOARD);
  const [attempt, setAttempt] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [reveal, setReveal] = useState<number[]>(Array(target.length).fill(0));

  const updateCurrentRow = (updater: (grid: number[]) => number[]) => {
    setBoard((prev) =>
      prev.map((row, index) =>
        index === attempt
          ? {
              ...row,
              grid: updater([...row.grid]),
            }
          : row,
      ),
    );
  };

  const handlePlace = (color: number) => {
    updateCurrentRow((grid) => {
      const emptyIndex = grid.findIndex((v) => v === 0);

      if (emptyIndex !== -1) {
        grid[emptyIndex] = color;
      }

      return grid;
    });
  };

  const handleEraseCell = (cellIndex: number) => {
    updateCurrentRow((grid) => {
      grid[cellIndex] = 0;
      return grid;
    });
  };

  const handleEraseRow = () => {
    updateCurrentRow((grid) => grid.map(() => 0));
  };

  const handleCopy = (rowIndex: number) => {
    setBoard((prev) =>
      prev.map((row, index) =>
        index === attempt
          ? {
              ...row,
              grid: [...prev[rowIndex].grid],
              submitted: false,
              feedback: {
                correct: 0,
                misplaced: 0,
              },
            }
          : row,
      ),
    );
  };

  const handleReveal = () => {
    setReveal((prev) => {
      const hiddenIndexes = prev
        .map((value, index) => (value === 0 ? index : -1))
        .filter((index) => index !== -1);

      if (hiddenIndexes.length === 0) return prev;

      const randomIndex =
        hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];

      const newReveal = [...prev];
      newReveal[randomIndex] = target[randomIndex];

      return newReveal;
    });
  };

  const checkFeedback = (guess: number[]) => {
    let correct = 0;
    let misplaced = 0;

    const remainingTarget: number[] = [];
    const remainingGuess: number[] = [];

    guess.forEach((value, index) => {
      if (value === target[index]) {
        correct++;
        return;
      }

      remainingTarget.push(target[index]);
      remainingGuess.push(value);
    });

    remainingGuess.forEach((value) => {
      const index = remainingTarget.indexOf(value);

      if (index === -1) return;

      misplaced++;
      remainingTarget.splice(index, 1);
    });

    return { correct, misplaced };
  };

  const handleSubmit = () => {
    const row = board[attempt];

    const isValid = row.grid.every((value) => value > 0);

    if (!isValid) return;

    const feedback = checkFeedback(row.grid);

    setBoard((prev) =>
      prev.map((item, index) =>
        index === attempt
          ? {
              ...item,
              submitted: true,
              feedback,
            }
          : item,
      ),
    );

    if (feedback.correct === target.length) {
      setIsSolved(true);
      return;
    }

    const nextAttempt = attempt + 1;

    if (nextAttempt >= MAX_ATTEMPT) {
      setIsFailed(true);
      return;
    }

    setAttempt(nextAttempt);
  };

  const renderRevealPeg = (value: number, index: number) => {
    if (isSolved) {
      return <ColorPeg key={index} value={target[index]} />;
    }

    if (value > 0) {
      return <ColorPeg key={index} value={value} />;
    }

    return <HiddenPeg key={index} failed={isFailed} />;
  };

  return (
    <div className="tower-board flex flex-col items-center divide-y divide-slate-700">
      {/* Reveal */}
      <div className="flex gap-2 items-center justify-center py-1">
        {reveal.map(renderRevealPeg)}
      </div>

      {/* Board */}
      {[...board].reverse().map((row, reverseIndex) => {
        const rowIndex = board.length - 1 - reverseIndex;
        const isCurrentRow = attempt === rowIndex && !row.submitted;
        const canCopy = attempt > rowIndex;

        return (
          <div
            key={rowIndex}
            className="tower-row flex items-center gap-2 py-1"
          >
            {/* Left Actions */}
            <div className="flex gap-2 items-center w-8 h-5 justify-end text-slate-300">
              <div className="group h-full w-full">
                <button
                  onClick={() => handleCopy(rowIndex)}
                  className={`cursor-pointer items-center justify-end h-full w-full ${
                    canCopy ? "hidden group-hover:flex" : "hidden"
                  }`}
                >
                  <FaRegCopy className="w-4 h-4" />
                </button>
              </div>

              {isCurrentRow && (
                <button
                  onClick={handleEraseRow}
                  className="cursor-pointer flex items-center justify-start h-full w-full"
                >
                  <FaEraser />
                </button>
              )}
            </div>

            {/* Cells */}
            {row.grid.map((cell, cellIndex) => (
              <button
                key={cellIndex}
                onClick={() => handleEraseCell(cellIndex)}
                disabled={!isCurrentRow}
                className="cursor-pointer disabled:cursor-auto"
              >
                <ColorPeg value={cell} />
              </button>
            ))}

            {/* Right Actions */}
            <div className="flex gap-2 items-center w-8">
              {isCurrentRow && (
                <button
                  onClick={handleSubmit}
                  className="cursor-pointer flex items-center justify-start h-full w-full"
                >
                  <FaLevelDownAlt className="rotate-90" />
                </button>
              )}

              {attempt > rowIndex && (
                <FeedbackDots
                  correct={row.feedback.correct}
                  misplaced={row.feedback.misplaced}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Palette */}
      <div className="tower-row flex items-center gap-4 py-1">
        {Array.from({ length: tier.variance }).map((_, index) => (
          <button
            key={index}
            onClick={() => handlePlace(index + 1)}
            className="cursor-pointer"
          >
            <ColorPeg value={index + 1} size="h-6 w-6" />
          </button>
        ))}

        <button
          onClick={handleReveal}
          disabled={isSolved || isFailed || reveal.every((val) => val > 0)}
          className="flex items-center gap-1 px-2 py-1 cursor-pointer text-slate-300 disabled:cursor-not-allowed"
        >
          <FaWandSparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
