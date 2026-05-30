import { T, labelColor } from "@/shared/components/ui/tokens";
import { EmptyState } from "@/shared/components/ui/primitive";

type Anchor = {
  x: number;
  y: number;
};

type RectInfo = {
  label: string;
  anchor: Anchor;
  area: number;
};

type AnchorListProps = {
  infos?: RectInfo[];
  placedLabels?: Set<string>;
  onRemove?: (label: string) => void;
};

export default function AnchorList({
  infos = [],
  placedLabels = new Set<string>(),
  onRemove,
}: AnchorListProps) {
  if (!infos.length) {
    return <EmptyState icon="⚓" message="No puzzle loaded" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {infos.map((info) => {
        const isPlaced = placedLabels.has(info.label);
        const col = labelColor(info.label);

        return (
          <div
            key={info.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 7,
              border: `1px solid ${isPlaced ? col + "55" : T.border}`,
              background: isPlaced ? col + "10" : "transparent",
              fontSize: 11,
              transition: "all .15s",
            }}
          >
            {/* Label dot */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: col,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {info.label}
            </div>

            {/* Anchor coords */}
            <span style={{ color: T.text3, fontSize: 10, flex: 1 }}>
              ({info.anchor.x},{info.anchor.y})
            </span>

            {/* Area */}
            <span
              style={{
                fontWeight: 700,
                color: col,
                minWidth: 18,
                textAlign: "right",
              }}
            >
              {info.area}
            </span>

            {/* Status */}
            <span
              style={{
                fontSize: 12,
                color: isPlaced ? col : T.text3,
                marginLeft: 2,
              }}
            >
              {isPlaced ? "✓" : "○"}
            </span>

            {/* Remove button — only when placed */}
            {isPlaced && (
              <button
                onClick={() => onRemove?.(info.label)}
                title={`Remove region ${info.label}`}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.text3,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 2px",
                  lineHeight: 1,
                  transition: "color .1s",
                  fontFamily: T.font,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.red;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.text3;
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
