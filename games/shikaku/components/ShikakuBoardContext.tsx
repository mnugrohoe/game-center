"use client";

import useTimer, { TimerHooksProps } from "@/shared/hooks/useTimer";
import React, { createContext, useContext, useMemo } from "react";
import useShikakuBoard, {
  UseShikakuBoardState,
} from "../hooks/useShikakuBoard";
import useShikakuGenerator, {
  ShikakuGeneratorProps,
} from "../hooks/useShikakuGenerator";
import { checkShikakuComplete } from "../lib/validation";

// ─── Context shape ────────────────────────────────────────────────────────────
interface ShikakuBoardContextValue
  extends UseShikakuBoardState, ShikakuGeneratorProps, TimerHooksProps {
  isComplete: boolean;
}

const ShikakuBoardContext = createContext<ShikakuBoardContextValue | null>(
  null,
);

export function useShikakuBoardCtx() {
  const ctx = useContext(ShikakuBoardContext);
  if (!ctx)
    throw new Error(
      "useShikakuBoardCtx must be used inside <ShikakuBoardProvider>",
    );
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShikakuBoardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Timer / completion ────────────────────────────────────────────────────
  const timer = useTimer();
  const board = useShikakuBoard();
  const generator = useShikakuGenerator();

  const isComplete = useMemo(() => {
    if (!board.puzzle) {
      return false;
    }

    return checkShikakuComplete(board.userRects, board.puzzle);
  }, [board.userRects, board.puzzle]);

  const value = useMemo<ShikakuBoardContextValue>(
    () => ({
      ...timer,
      ...board,
      ...generator,
      isComplete,
    }),
    [board, timer, generator, isComplete],
  );

  return (
    <ShikakuBoardContext.Provider value={value}>
      {children}
    </ShikakuBoardContext.Provider>
  );
}
