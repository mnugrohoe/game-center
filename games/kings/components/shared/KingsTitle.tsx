import { cinzel, cinzelDecorative } from "@/shared/utils/fonts";

export default function KingsTitle({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <h1
        className={`${cinzelDecorative.className} text-xl sm:text-2xl md:text-3xl font-bold text-[#e8c96a] tracking-[0.08em] mb-1 ]`}
      >
        ♛ KINGS
      </h1>
      {children && (
        <p
          className={`${cinzel.className} text-xs sm:text-sm md:text-base tracking-[0.12em] text-[#7a6840]`}
        >
          {children}
        </p>
      )}
    </div>
  );
}
