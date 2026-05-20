"use client";

import { DIFF_TIERS } from "../../lib/difficulty";

interface DiffPickerProps {
  selected: number;
  onSelect: (id: number) => void;
  actionLabel: string;
  onAction: () => void;
  /** Per-diff play counts (index = diffId). Shown as #N badge. */
  counters?: number[];
}

export function DiffPicker({
  selected,
  onSelect,
  actionLabel,
  onAction,
  counters,
}: DiffPickerProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="grid grid-cols-3 gap-2 w-full max-w-[520px]">
        {DIFF_TIERS.map((d, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex flex-col items-start text-left px-3.5 py-2.5 rounded-xl border-[1.5px] transition-all duration-150 ${
              selected === i
                ? "bg-[#1a1828]"
                : "bg-[#14131e] border-[#22203a] hover:bg-[#1a1828] hover:-translate-y-px"
            }`}
            style={{
              borderColor: selected === i ? d.color : undefined,
              boxShadow:   selected === i ? `0 0 0 1px ${d.color}` : undefined,
            }}
          >
            <div className="flex items-center justify-between w-full gap-1">
              <span
                className="text-[0.9rem] font-extrabold tracking-[0.02em] leading-[1.1]"
                style={{ color: d.color }}
              >
                {d.name}
              </span>
              {(counters?.[i] ?? 0) > 0 && (
                <span
                  className="font-mono text-[0.58rem] font-bold opacity-65 shrink-0"
                  style={{ color: d.color }}
                >
                  #{counters![i]}
                </span>
              )}
            </div>
            <span className="font-mono text-[0.6rem] text-[#4a4860] mt-0.5 leading-none">
              {d.sub}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onAction}
        className="font-['Syne',sans-serif] font-bold text-[0.82rem] px-[18px] py-2 rounded-[10px] border-none bg-gradient-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13] cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0"
      >
        {actionLabel}
      </button>
    </div>
  );
}
