import { type PathSegment, SwapPathOverlay } from "@/shared/components/ui/Grid";
import { SizeType, logoSize } from "@/shared/theme/logo";

const swapSegments: PathSegment[] = [
  {
    order: [
      "1-5",
      "1-4",
      "1-3",
      "1-1",
      "2-1",
      "3-1",
      "4-1",
      "5-1",
      "5-3",
      "5-4",
      "5-5",
      "4-5",
      "4-3",
      "3-3",
      "2-3",
    ],
    colorMode: {
      type: "single",
      color: "var(--color-pink-500)",
    },
  },
];

export default function ArukoneLogo({ size = "md" }: { size?: SizeType }) {
  const CELL_SIZE = logoSize[size].baseSize * (4 / 7);

  return (
    <div
      className={`grid gap-0 ${logoSize[size].container} place-items-center rounded-sm overflow-hidden bg-zinc-800`}
    >
      <div className="grid relative w-full h-full">
        <SwapPathOverlay
          segments={swapSegments}
          cellSize={CELL_SIZE}
          gap={0}
          thickness={0.6}
        />
      </div>
    </div>
  );
}
