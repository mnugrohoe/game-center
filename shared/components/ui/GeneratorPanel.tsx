"use client";

import { useMemo } from "react";
import { T } from "./tokens";
import DifficultyPicker, { DifficultyPickerProps } from "./DifficultyPicker";
import LevelPicker, { LevelPickerProps } from "./LevelPicker";
import { ParamRowProps } from "./primitive";
import { DiffTier } from "@/shared/types";
import { levelToTierIdx } from "@/shared/algorithms";

export interface PickerProps {
  tiers: Tier[];
  tierIdx: number;
  setTier: React.Dispatch<React.SetStateAction<number>>;
  seed?: number;
  onChangeSeed?: React.Dispatch<React.SetStateAction<number>>;
  color?: string;
  params?: ParamItem[] | null;
}

export type GeneratorPanelProps = DifficultyPickerProps &
  LevelPickerProps & {
    mode: "Difficulty" | "Level";
    level: number;
    setMode: React.Dispatch<React.SetStateAction<"Difficulty" | "Level">>;
    setLevel: React.Dispatch<React.SetStateAction<number>>;
    onGenerate: () => void;
  };
export type Tier = DiffTier & {
  sizeLabel?: string;
};

export type ParamItem = ParamRowProps & {
  group?: string;
};

export type GroupLabel = {
  type: "label";
  label: string;
};

export type GroupParam = ParamItem & {
  type: "param";
};

export type GroupedItem = GroupLabel | GroupParam;

export default function GeneratorPanel({
  tiers,
  tierIdx = 0,
  mode,
  level,
  seed = 0,
  params,
  setMode,
  setLevel,
  setTier,
  onChangeSeed,
  onGenerate,
}: GeneratorPanelProps) {
  const safeTiers = useMemo(() => (Array.isArray(tiers) ? tiers : []), [tiers]);
  const currentTier = safeTiers[tierIdx];
  const color = currentTier.color ?? T.accent;

  const handleChangeTab = (newTab: "Difficulty" | "Level") => {
    if (newTab === "Level") {
      const idx = levelToTierIdx(level, tiers.length);
      setTier(idx);
    }

    setMode(newTab);
  };

  return (
    <>
      {/* TAB BAR */}
      <div className="flex border-b" style={{ borderColor: T.border }}>
        {(["Difficulty", "Level"] as const).map((t) => {
          const active = mode === t;

          return (
            <button
              key={t}
              onClick={() => handleChangeTab(t)}
              style={{
                fontFamily: T.font,
                color: active ? color : T.text3,
                borderBottom: `2px solid ${active ? color : "transparent"}`,
              }}
              className="flex-1 p-2 text-xs uppercase font-bold cursor-pointer"
            >
              {t}
            </button>
          );
        })}
      </div>

      {mode === "Difficulty" && (
        <DifficultyPicker
          {...{
            tiers,
            tierIdx,
            setTier,
            seed,
            onChangeSeed,
            onGenerate,
            params,
          }}
        />
      )}

      {mode === "Level" && (
        <LevelPicker
          tiers={safeTiers}
          tierIdx={tierIdx}
          level={level}
          color={color}
          setLevel={setLevel}
          setTier={setTier}
          onChangeSeed={onChangeSeed}
        />
      )}

      <div style={{ marginTop: 14 }}>
        <GenerateBtn tier={currentTier} onClick={onGenerate} />
      </div>
    </>
  );
}

interface GenerateBtnProps {
  tier?: Partial<Tier>;
  onClick: () => void;
}

/**
 * Generate Button
 */
export function GenerateBtn({ tier, onClick }: GenerateBtnProps) {
  const color = tier?.color ?? T.accent;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: 11,
        borderRadius: T.radius,
        border: `1.5px solid ${color}`,
        background: "transparent",
        fontFamily: T.font,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        cursor: "pointer",
        color,
        boxShadow: `0 0 16px ${color}28`,
        transition: "all .2s",
        marginBottom: 4,
      }}
    >
      ▶ Generate
    </button>
  );
}
