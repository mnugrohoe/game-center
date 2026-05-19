import { cinzelDecorative } from "../utils/fonts";

export default function WinBanner({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center px-5 py-3 rounded-sm border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)]">
      <div className={`${cinzelDecorative.className} text-[#e8c96a] text-sm`}>
        ⚜ PUZZLE CONQUERED ⚜
      </div>
      {children && (
        <div className="text-sm mt-1 text-[#7a6840]">{children}</div>
      )}
    </div>
  );
}
