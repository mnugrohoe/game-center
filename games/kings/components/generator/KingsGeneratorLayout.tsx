import { ReactNode } from "react";

export default function KingsGeneratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0908] text-[#d4c49a]">
      {/* Scanline */}
      <div className="pointer-events-none z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {children}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
