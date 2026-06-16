import { SizeType, logoSize } from "@/shared/theme/logo";
import SymbolRenderer from "./Shape";

export default function SetsLogo({ size = "md" }: { size?: SizeType }) {
  // Gunakan fallback ukuran penuh kontainer jika iconSize dirasa kurang mendominasi
  const basePixelSize = logoSize[size].baseSize || 40;

  return (
    <div
      className={`grid place-items-center ${logoSize[size].container} rounded-sm overflow-hidden bg-white text-black`}
    >
      {/* LAYER 1 (PALING BELAKANG): HOURGLASS */}
      {/* Di-scale 0.9 agar ujung path SVG-nya tidak terpotong oleh overflow-hidden kontainer */}
      <div className="z-10" style={{ gridArea: "1 / 1" }}>
        <SymbolRenderer
          color="red"
          symbol="hourglass"
          texture="solid"
          count={1}
          size={basePixelSize * 4}
        />
      </div>

      {/* LAYER 2 (TENGAH): DIAMOND */}
      {/* Skala 0.75 didapat dari 0.9 / 1.2 untuk menjaga rasio ukuran antar-layer */}
      <div className="z-20" style={{ gridArea: "1 / 1" }}>
        <SymbolRenderer
          color="purple"
          symbol="diamond"
          texture="solid"
          count={1}
          size={basePixelSize * 3.5}
        />
      </div>

      {/* LAYER 3 (PALING DEPAN): X */}
      {/* Skala 0.625 didapat dari 0.75 / 1.2 */}
      <div className="z-30" style={{ gridArea: "1 / 1" }}>
        <SymbolRenderer
          color="green"
          symbol="love"
          texture="solid"
          count={1}
          size={basePixelSize * 3}
        />
      </div>
    </div>
  );
}
