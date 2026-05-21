"use client";
/**
 * games/kings/components/shared/BoardControls.tsx
 *
 * Row of action buttons below every Kings board.
 * Uses the shared ControlButton — no local button definitions.
 */
import { ControlButton } from "@/shared/components";
import { useKingsBoardCtx } from "../../context/KingsBoardContext";

interface BoardControlsProps {
  onReset:   () => void;
  onHint?:   () => void;
  extra?:    { label: string; fn: () => void; disabled?: boolean }[];
}

export function BoardControls({ onReset, onHint, extra }: BoardControlsProps) {
  const { undo, clearMarks, moveHistory } = useKingsBoardCtx();

  const buttons = [
    { label: "↺ Restart",   fn: onReset,    disabled: false },
    { label: "Clear ×",     fn: clearMarks, disabled: false },
    { label: "↩ Undo",      fn: undo,       disabled: moveHistory.length === 0 },
    ...(onHint ? [{ label: "? Hint", fn: onHint, disabled: false }] : []),
    ...(extra ?? []),
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {buttons.map(({ label, fn, disabled }) => (
        <ControlButton key={label} onClick={fn} disabled={disabled}>
          {label}
        </ControlButton>
      ))}
    </div>
  );
}
