/**
 * games/kings/components/HowToPlay.tsx
 * Static rules panel — Tailwind only, zero inline styles.
 */

const RULES = [
  { key: "L-click",          val: "→ mark ×" },
  { key: "R-click / dblclick", val: "→ King ♛" },
  { key: "1 king",           val: "per region, row & column" },
  { key: "3×3 zone",         val: "around each king = blocked" },
] as const;

export function HowToPlay() {
  return (
    <div className="panel">
      <div className="divider-label mb-3">HOW TO PLAY</div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {RULES.map(({ key, val }) => (
          <div key={key} className="flex gap-2 font-mono text-[0.73rem] text-secondary">
            <span className="text-gold-200 shrink-0">{key}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[0.65rem] text-muted mt-3 leading-relaxed">
        Difficulty is non-linear — it rises like a wave, not a ramp.
        Same level always generates the same puzzle.
      </p>
    </div>
  );
}
