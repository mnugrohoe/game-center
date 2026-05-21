"use client";
/**
 * games/mambo/components/shared/DiffPicker.tsx
 * Grid of tier cards + action button.
 * Uses shared ActionButton; tier accent colors only on dynamic parts.
 */
import { DIFF_TIERS } from "../../lib/difficulty";
import { ActionButton } from "@/shared/components";

interface DiffPickerProps {
  selected:    number;
  onSelect:    (id: number) => void;
  actionLabel: string;
  onAction:    () => void;
  counters?:   number[];
}

export function DiffPicker({ selected, onSelect, actionLabel, onAction, counters }: DiffPickerProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">

      <div className="grid grid-cols-3 gap-2 w-full max-w-[520px]">
        {DIFF_TIERS.map((d, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={[
              "flex flex-col items-start text-left px-3.5 py-2.5 rounded-xs",
              "border cursor-pointer transition-all duration-150",
              "bg-surface hover:bg-raised hover:-translate-y-px",
            ].join(" ")}
            style={{
              borderColor: selected === i ? d.color       : "var(--color-gold-600)",
              boxShadow:   selected === i ? `0 0 0 1px ${d.color}` : "none",
            }}
          >
            <div className="flex items-center justify-between w-full gap-1">
              <span
                className="font-ui text-[0.88rem] font-semibold tracking-[0.02em] leading-tight"
                style={{ color: d.color }}
              >
                {d.name}
              </span>
              {(counters?.[i] ?? 0) > 0 && (
                <span className="font-mono text-[0.56rem] font-bold opacity-60 shrink-0" style={{ color: d.color }}>
                  #{counters![i]}
                </span>
              )}
            </div>
            <span className="font-mono text-[0.6rem] text-muted mt-0.5 leading-none">
              {d.sub}
            </span>
          </button>
        ))}
      </div>

      <ActionButton onClick={onAction}>
        {actionLabel}
      </ActionButton>
    </div>
  );
}
