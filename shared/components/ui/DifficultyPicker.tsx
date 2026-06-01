import { useMemo } from "react";
import { T } from "./tokens";
import { PanelBody, SectionLabel } from "./primitive";
import { PickerProps, Tier } from "./GeneratorPanel";

export type DifficultyPickerProps = PickerProps;

export default function DifficultyPicker({
  tiers,
  tierIdx = 0,
  setTier,
}: PickerProps) {
  /**
   * Safe normalized arrays
   */
  const safeTiers = useMemo<Tier[]>(
    () => (Array.isArray(tiers) ? tiers : []),
    [tiers],
  );

  return (
    <>
      <PanelBody>
        <SectionLabel>Tiers</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {safeTiers.map((t, i) => {
            const selected = i === tierIdx;

            return (
              <button
                key={`${t.name}-${i}`}
                type="button"
                onClick={() => setTier(i)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "10px 6px",
                  borderRadius: T.radius,
                  border: `${selected ? 1.5 : 1}px solid ${
                    selected ? t.color : T.border
                  }`,
                  background: selected ? `${t.color}18` : T.bg3,
                  cursor: "pointer",
                  transition: "all .15s",
                  fontFamily: T.font,
                  color: selected ? t.color : T.text2,
                  boxShadow: selected ? `0 0 12px ${t.color}22` : "none",
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  {t.name}
                </span>

                {t.sizeLabel && (
                  <span
                    style={{
                      fontSize: 9,
                      opacity: 0.6,
                    }}
                  >
                    {t.sizeLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PanelBody>
    </>
  );
}
