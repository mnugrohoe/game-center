/**
 * games/kings/components/shared/KingsTitle.tsx
 *
 * Thin wrapper — gives Kings its own title without duplicating GameTitle logic.
 */
import { ReactNode } from "react";
import { GameTitle } from "@/shared/components";

export function KingsTitle({ children }: { children?: ReactNode }) {
  return <GameTitle title="♛ KINGS">{children}</GameTitle>;
}
