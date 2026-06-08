"use client";

import { useMemo } from "react";
import { T } from "./tokens";
import DifficultyPicker, { DifficultyPickerProps } from "./DifficultyPicker";
import LevelPicker, { LevelPickerProps } from "./LevelPicker";
import { ParamRowProps } from "./primitive";
import {
  ButtonType,
  ColorType,
  DiffTier,
  GeneratorMode,
  StateProp,
} from "@/shared/types";
import { levelToTierIdx } from "@/shared/algorithms";
import { LuSparkles } from "react-icons/lu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PickerProps {
  tiers: Tier[];
  tier: StateProp<number>;
  mode: StateProp<GeneratorMode>;
  seed: StateProp<number>;
  color?: string;
}

export type GeneratorPanelProps = DifficultyPickerProps &
  LevelPickerProps & {
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

// ---------------------------------------------------------------------------
// GeneratorPanel
// ---------------------------------------------------------------------------

export default function GeneratorPanel({
  tiers,
  tier,
  mode,
  level,
  seed,
  onGenerate,
}: GeneratorPanelProps) {
  const safeTiers = useMemo(() => (Array.isArray(tiers) ? tiers : []), [tiers]);
  const currentTier = safeTiers[tier.value];
  const color = currentTier?.color ?? T.accent;

  const handleChangeTab = (newTab: GeneratorMode) => {
    if (newTab === "Level") {
      const idx = levelToTierIdx(level.value, tiers.length);
      tier.setValue(idx);
    }
    mode.setValue(newTab);
  };

  return (
    <>
      {/* TAB BAR: Difficulty / Level */}
      <div className="flex border-b" style={{ borderColor: T.border }}>
        {(["Difficulty", "Level"] as const).map((t) => {
          const active = mode.value === t;
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

      {mode.value === "Difficulty" && (
        <DifficultyPicker {...{ tiers, tier, seed, mode }} />
      )}

      {mode.value === "Level" && (
        <LevelPicker
          {...{ tiers: safeTiers, tier, level, color, seed, mode }}
        />
      )}

      <div className="p-4">
        <GenerateBtn tier={currentTier} onClick={onGenerate} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// GenerateBtn — reusable, diexport untuk dipakai SolverPanelGenerator juga
// ---------------------------------------------------------------------------

interface GenerateBtnProps extends ButtonType {
  tier?: Partial<Tier>;
  color?: ColorType;
}

export function GenerateBtn({ tier, color, style, ...rest }: GenerateBtnProps) {
  const col = tier?.color ?? color ?? T.accent;

  return (
    <button
      type="button"
      className="w-full flex gap-2 items-center justify-center p-3 border bg-transparent text-xs font-bold uppercase cursor-pointer transition-all duration-200 mb-1 shadow-sm"
      style={{
        borderRadius: T.radius,
        borderColor: col,
        fontFamily: T.font,
        letterSpacing: 3,
        color: col,
        boxShadow: `0 0 16px ${col}28`,
        ...style,
      }}
      {...rest}
    >
      <LuSparkles /> Generate
    </button>
  );
}
