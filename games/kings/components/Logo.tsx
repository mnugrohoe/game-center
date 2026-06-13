import { SizeType, logoSize } from "@/shared/theme/logo";
import { MARKER_DOTS, MARKER_KINGS, MARKER_X } from "../lib";

export default function KingsLogo({ size = "md" }: { size?: SizeType }) {
  return (
    <div
      className={`grid gap-0 text-black ${logoSize[size].container} rounded-sm overflow-hidden bg-orange-200`}
      style={{ gridTemplateColumns: "1fr 1fr" }}
    >
      <div className="grid place-content-center border">{MARKER_DOTS}</div>
      <div className="grid place-content-center border bg-purple-300">
        {MARKER_KINGS}
      </div>
      <div className="grid place-content-center border"></div>
      <div className="grid place-content-center border">{MARKER_X}</div>
    </div>
  );
}
