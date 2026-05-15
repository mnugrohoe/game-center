"use client";

import { useKingsBoardCtx } from "../../context/KingsBoardContext";

interface BoardControlsProps {
  onReset: () => void;
  onHint?: () => void;
  extraButtons?: { label: string; fn: () => void; disabled?: boolean }[];
}

export function BoardControls({ onReset, onHint, extraButtons }: BoardControlsProps) {
  const { undo, clearMarks, moveHistory } = useKingsBoardCtx();

  const btns = [
    { label: "↺ Restart", fn: onReset, disabled: false },
    { label: "Clear ×", fn: clearMarks, disabled: false },
    { label: "↩ Undo", fn: undo, disabled: moveHistory.length === 0 },
    ...(onHint ? [{ label: "? Hint", fn: onHint, disabled: false }] : []),
    ...(extraButtons ?? []),
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {btns.map(({ label, fn, disabled }) => (
        <button
          key={label}
          onClick={fn}
          disabled={disabled}
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.68rem",
            letterSpacing: "0.09em",
            padding: "8px 18px",
            borderRadius: "2px",
            border: "1px solid rgba(201,168,76,0.35)",
            background: "rgba(201,168,76,0.08)",
            color: "#c9a84c",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
