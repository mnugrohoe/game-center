import { useMemo, useState } from "react";
import { T } from "./tokens";
import {
  PanelHeader,
  PanelBody,
  SectionLabel,
  ParamRow,
  SeedRow,
  ParamRowProps,
} from "./primitive";
import { DiffTier } from "@/shared/types";

type Tier = DiffTier & {
  sizeLabel?: string;
};

type ParamItem = ParamRowProps & {
  group?: string;
};

type GroupLabel = {
  type: "label";
  label: string;
};

type GroupParam = ParamItem & {
  type: "param";
};

type GroupedItem = GroupLabel | GroupParam;

interface DifficultyPickerProps {
  tiers?: Tier[] | null;
  tierIdx?: number;
  onSelectTier: (index: number) => void;
  seed?: number;
  onChangeSeed: (seed: number) => void;
  onGenerate: () => void;
  params?: ParamItem[] | null;
}

export default function DifficultyPicker({
  tiers,
  tierIdx = 0,
  onSelectTier,
  seed = 0,
  onChangeSeed,
  onGenerate,
  params,
}: DifficultyPickerProps) {
  const [tab, setTab] = useState<"diff" | "params">("diff");

  /**
   * Safe normalized arrays
   */
  const safeTiers = useMemo<Tier[]>(
    () => (Array.isArray(tiers) ? tiers : []),
    [tiers],
  );

  const safeParams = useMemo<ParamItem[]>(
    () => (Array.isArray(params) ? params : []),
    [params],
  );

  /**
   * Safe selected tier
   */
  const tier: Partial<Tier> = useMemo(() => {
    if (tierIdx >= 0 && tierIdx < safeTiers.length && safeTiers[tierIdx]) {
      return safeTiers[tierIdx];
    }

    return {};
  }, [safeTiers, tierIdx]);

  /**
   * Group params
   */
  const grouped = useMemo<GroupedItem[]>(() => {
    const result: GroupedItem[] = [];

    let currentGroup: string | null = null;

    for (const p of safeParams) {
      if (!p || typeof p !== "object") continue;

      if (p.group && p.group !== currentGroup) {
        currentGroup = p.group;

        result.push({
          type: "label",
          label: p.group,
        });
      }

      result.push({
        type: "param",
        ...p,
      });
    }

    return result;
  }, [safeParams]);

  return (
    <>
      <PanelHeader label="Generator" right="✦" />

      {/* TAB BAR */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        {(["diff", "params"] as const).map((t) => {
          const active = tab === t;

          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textAlign: "center",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                fontFamily: T.font,
                textTransform: "uppercase",
                transition: "all .15s",
                color: active ? (tier.color ?? T.accent) : T.text3,
                borderBottom: `2px solid ${
                  active ? (tier.color ?? T.accent) : "transparent"
                }`,
              }}
            >
              {t === "diff" ? "Difficulty" : "Params"}
            </button>
          );
        })}
      </div>

      <PanelBody>
        {/* DIFFICULTY TAB */}
        {tab === "diff" && (
          <>
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
                    onClick={() => onSelectTier(i)}
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

            <SectionLabel>Seed</SectionLabel>

            <SeedRow
              value={seed}
              onChange={onChangeSeed}
              onRandom={() => onChangeSeed(Math.floor(Math.random() * 999999))}
            />

            <GenerateBtn tier={tier} onClick={onGenerate} />
          </>
        )}

        {/* PARAMS TAB */}
        {tab === "params" && (
          <>
            {grouped.length === 0 ? (
              <div
                style={{
                  padding: "10px 4px",
                  fontSize: 11,
                  color: T.text3,
                  textAlign: "center",
                }}
              >
                No parameters available
              </div>
            ) : (
              grouped.map((item, i) =>
                item.type === "label" ? (
                  <SectionLabel
                    key={`lbl-${item.label}-${i}`}
                    style={{
                      marginTop: i > 0 ? 14 : 4,
                    }}
                  >
                    {item.label}
                  </SectionLabel>
                ) : (
                  <ParamRow
                    key={`param-${item.label}-${i}`}
                    label={item.label}
                    display={item.display}
                    pct={item.pct}
                    color={item.color}
                  />
                ),
              )
            )}

            <div style={{ marginTop: 14 }}>
              <GenerateBtn tier={tier} onClick={onGenerate} />
            </div>
          </>
        )}
      </PanelBody>
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
function GenerateBtn({ tier, onClick }: GenerateBtnProps) {
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
