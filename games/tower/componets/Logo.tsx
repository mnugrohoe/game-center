import { colorId } from "@/shared/components/ui/tokens";
import { SizeType, logoSize } from "@/shared/theme/logo";

export default function TowerLogo({ size = "md" }: { size?: SizeType }) {
  // Leverage your theme spacing directly on the parent
  const paddingClass = logoSize[size].padding ?? "p-3";

  return (
    <div
      className={`grid grid-cols-2 gap-2 place-content-center place-items-center bg-zinc-800 ${logoSize[size].container} ${paddingClass} rounded-md overflow-hidden bg-white text-black`}
    >
      {/* Top Left Block */}
      <div
        className="w-4/5 aspect-square rounded-full transition-transform"
        style={{ backgroundColor: `hsl(${colorId(0).bg})` }}
      />

      {/* Top Right Block */}
      <div className="w-4/5 aspect-square rounded-full border border-white" />

      {/* Bottom Left Block */}
      <div className="w-4/5 aspect-square rounded-full border border-white" />

      {/* Bottom Right Block */}
      <div
        className="w-4/5 aspect-square rounded-full transition-transform"
        style={{ backgroundColor: `hsl(${colorId(1).bg})` }}
      />
    </div>
  );
}
