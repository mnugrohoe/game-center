import { SizeType, logoSize } from "@/shared/theme/logo";
import { MAMBO_MOON, MAMBO_SUN } from "../lib";

export default function MamboLogo({ size = "md" }: { size?: SizeType }) {
  return (
    <div
      className={`grid gap-0 text-black ${logoSize[size].container} rounded-sm overflow-hidden bg-white`}
      style={{ gridTemplateColumns: "1fr 1fr" }}
    >
      <div
        className={
          "grid place-content-center border bg-indigo-800/50 text-blue-800"
        }
      >
        {MAMBO_MOON.icon}
      </div>
      <div className="grid place-content-center border"></div>
      <div className="grid place-content-center border"></div>
      <div className="grid place-content-center border bg-amber-800/50 text-amber-800">
        {MAMBO_SUN.icon}
      </div>
    </div>
  );
}
