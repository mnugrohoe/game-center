import { LogoIconProps } from "@/shared/components/ui/Grid";
import { logoSize } from "@/shared/theme/logo";

export default function ShikakuLogo({ size = "md" }: LogoIconProps) {
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-0 text-black ${logoSize[size].container} rounded-sm overflow-hidden`}
    >
      <div className="row-span-2 bg-indigo-300 flex items-start justify-center">
        2
      </div>
      <div
        className={`col-span-2 row-span-2 bg-teal-300 flex items-start justify-end ${logoSize[size].padding}`}
      >
        4
      </div>
      <div className="col-span-3 bg-orange-300 flex items-center justify-center">
        3
      </div>
    </div>
  );
}
