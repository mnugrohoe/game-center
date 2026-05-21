/**
 * shared/components/ui/GameTitle.tsx
 *
 * Page header used by every game view.
 * Consistent hierarchy: big display title + optional sub-line.
 */
import { ReactNode } from "react";

interface GameTitleProps {
  title:    string;
  children?: ReactNode;  /* optional sub-line */
}

export function GameTitle({ title, children }: GameTitleProps) {
  return (
    <header className="text-center">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold-100 tracking-[0.08em] mb-1">
        {title.toUpperCase()}
      </h1>
      {children && (
        <p className="font-ui text-[0.65rem] sm:text-xs tracking-[0.14em] text-gold-400">
          {children}
        </p>
      )}
    </header>
  );
}
