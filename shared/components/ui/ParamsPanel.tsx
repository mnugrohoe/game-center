"use client";

import { useMemo } from "react";
import { T } from "./tokens";
import { PanelBody, SectionLabel, ParamRow, SeedRow } from "./primitive";
import { GroupedItem, ParamItem } from "./GeneratorPanel";
import { GeneratorMode } from "@/shared/types";

interface ParamsPanelProps {
  seed: number;
  onChangeSeed: React.Dispatch<React.SetStateAction<number>>;
  params?: ParamItem[] | null;
  mode: GeneratorMode;
}

export default function ParamsPanel({
  seed,
  onChangeSeed,
  params,
  mode,
}: ParamsPanelProps) {
  const safeParams = useMemo<ParamItem[]>(
    () => (Array.isArray(params) ? params : []),
    [params],
  );

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
    <PanelBody>
      <SectionLabel>Seed</SectionLabel>
      <SeedRow
        value={seed}
        onChange={onChangeSeed as React.Dispatch<React.SetStateAction<number>>}
        onRandom={() =>
          onChangeSeed && onChangeSeed(Math.floor(Math.random() * 999999))
        }
        disabled={mode === "Level"}
      />
      <SectionLabel>Params</SectionLabel>
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
    </PanelBody>
  );
}
