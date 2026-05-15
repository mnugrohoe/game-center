import { cinzel } from "@/shared/utils/fonts";

export default function GeneratorHeader() {
  return (
    <div className="text-center">
      <h1
        className={`${cinzel.className} text-3xl font-bold tracking-[0.08em] mb-1 text-[#e8c96a]`}
      >
        ♝ KINGS
      </h1>
      <p
        className={`${cinzel.className} text-xs tracking-[0.12em] text-[#7a6840]`}
      >
        PUZZLE GENERATOR
      </p>
    </div>
  );
}
