import { useMemo } from "react";
import { PanelBody, SectionLabel, SeedRow } from "./primitive";
import { PickerProps, Tier } from "./GeneratorPanel";
import { DifficultyBadge } from "./DifficultyBadge";

export type DifficultyPickerProps = PickerProps;

export default function DifficultyPicker({
  tiers,
  tier,
  mode,
  seed,
}: DifficultyPickerProps) {
  const safeTiers = useMemo<Tier[]>(
    () => (Array.isArray(tiers) ? tiers : []),
    [tiers],
  );

  return (
    <>
      <PanelBody>
        <SectionLabel>Tiers</SectionLabel>
        <div
          className="grid gap-1.5 mb-3.5"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          {safeTiers.map((t, i) => (
            <DifficultyBadge
              key={`${t.name}-${i}`}
              as="button"
              tier={t}
              active={i === tier.value}
              onClick={() => tier.setValue(i)}
            />
          ))}
        </div>
        <SectionLabel>Seed</SectionLabel>
        <SeedRow
          value={seed.value}
          onChange={seed.setValue}
          onRandom={() => seed.setValue(Math.floor(Math.random() * 999999))}
          disabled={mode.value === "Level"}
        />
      </PanelBody>
    </>
  );
}
