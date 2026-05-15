"use client";

import { createContext, useContext, ReactNode } from "react";

import { useKingGame } from "../hooks/useKingsGame";

type KingGameContextType = ReturnType<typeof useKingGame>;

export const KingGameContext = createContext<KingGameContextType | null>(null);

export function KingGameProvider({ children }: { children: ReactNode }) {
  const game = useKingGame();

  return (
    <KingGameContext.Provider value={game}>{children}</KingGameContext.Provider>
  );
}

export function useKingGameContext() {
  const context = useContext(KingGameContext);

  if (!context) {
    throw new Error("useKingGameContext must be used inside KingGameProvider");
  }

  return context;
}
