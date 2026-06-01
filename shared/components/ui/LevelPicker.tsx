import { levelToTierIdx, seedFromLevel } from "@/shared/algorithms";
import { cinzel } from "@/shared/utils/fonts";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { WavePreview } from "../charts/WavePreview";
import { SectionLabel, PanelBody } from "./primitive";
import { PickerProps } from "./GeneratorPanel";
import { T } from "./tokens";

export interface LevelPickerProps extends PickerProps {
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
}

export default function LevelPicker({
  tiers,
  tierIdx,
  level,
  color,
  setLevel,
  setTier,
  onChangeSeed,
}: LevelPickerProps) {
  const tier = tiers[tierIdx || 0];

  const handleChangeLevel = (level: number) => {
    const idx = levelToTierIdx(level, tiers.length);
    setTier(idx);
    setLevel(level);
    if (onChangeSeed) {
      const seed = seedFromLevel(level);
      onChangeSeed(seed);
    }
  };

  return (
    <PanelBody>
      {/* LEVEL CONTROL */}
      <SectionLabel>Level</SectionLabel>

      <div className="flex items-center justify-between gap-2 w-full">
        <LevelButton
          onClick={() => handleChangeLevel(Math.max(1, level - 1))}
          color={color}
        >
          <FaChevronLeft />
        </LevelButton>

        <div
          className={`${cinzel.className} flex justify-center items-center font-extrabold`}
        >
          <input
            type="number"
            value={level}
            min={1}
            max={99999}
            onChange={(e) =>
              handleChangeLevel(Math.max(1, +e.target.value || 1))
            }
            className="text-center text-4xl w-full"
            style={{
              color: color ? color : T.accent,
            }}
          />
        </div>

        <LevelButton onClick={() => handleChangeLevel(level + 1)} color={color}>
          <FaChevronRight />
        </LevelButton>
      </div>

      {/* TIER (NOW GLOBAL REACTIVE) */}
      <SectionLabel>Tier</SectionLabel>
      <div
        style={{
          border: `1.5px solid ${color}`,
          background: `${color}18`,
          color,
          fontFamily: T.font,
        }}
        className="w-full flex flex-col items-center p-2 rounded"
      >
        <span style={{ fontSize: 16 }}>{tier.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{tier.name}</span>
        {tier.sizeLabel && (
          <span style={{ fontSize: 9 }}>{tier.sizeLabel}</span>
        )}
      </div>

      {/* WAVE */}
      <SectionLabel>Level Preview</SectionLabel>
      <WavePreview level={level} color={color} />
    </PanelBody>
  );
}

const LevelButton = ({
  onClick,
  children,
  color,
}: {
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) => (
  <button
    onClick={onClick}
    className={`${cinzel.className} text-[0.68rem] py-1.5 px-3 border rounded-sm bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer h-full`}
    style={{
      color: color ? color : T.accent,
      background: color ? `${color}20` : `${T.accent}20`,
      borderColor: color ? color : `${T.accent2}`,
    }}
  >
    {children}
  </button>
);
