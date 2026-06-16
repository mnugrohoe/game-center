import Link from "next/link";
import { allGames } from "@/shared/data/games";
import { colorId } from "@/shared/components/ui/tokens";

export default function GameDashboard() {
  return (
    <div className="min-h-screen bg-[#0b0e14] p-8 text-slate-200 selection:bg-blue-500/30 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 border-b border-slate-800/60 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text">
              Koleksi Game Logika
            </h1>
            <p className="mt-1 text-xs font-mono text-slate-500 uppercase tracking-widest">
              Library / Total: {allGames.length} Game Loaded
            </p>
          </div>
          <div className="h-2 w-24 bg-linear-to-r from-blue-500 to-purple-500 rounded-full opacity-50 hidden sm:block" />
        </header>

        {/* Grid Card Bergaya Steam Library (Poster Vertikal) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {allGames.map((game) => {
            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group relative flex flex-col bg-[#171d25] border border-[#232d3b] rounded-md overflow-hidden shadow-2xl hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Visual Kontainer Utama (Poster Slot) */}
                <div className="relative aspect-3/4 bg-[#10141a] flex flex-col items-center justify-center p-4 border-b border-[#232d3b] group-hover:border-blue-500/40 transition-colors">
                  {/* Efek Sorot Cahaya Belakang Ikon */}
                  <div className="absolute inset-0 bg-radial from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Komponen Ikon Game (Center-focused) */}
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300 ease-out">
                    {game.icon ? (
                      <game.icon size="3xl" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-800 rounded-sm border border-slate-700" />
                    )}
                  </div>

                  {/* Deskripsi yang Kaku Disembunyikan, Muncul via Overlay Hover ala Steam */}
                  <div className="absolute inset-0 bg-[#171d25]/95 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between z-20">
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-6 font-medium">
                      {game.description}
                    </p>
                    <span className="text-[10px] font-mono text-blue-400 font-bold tracking-wider uppercase">
                      Klik untuk Bermain →
                    </span>
                  </div>
                </div>

                {/* Info Bar di Bagian Bawah Poster */}
                <div className="p-3 flex flex-col justify-between grow bg-[#12171f]">
                  <div className="mb-2">
                    <h2 className="text-sm font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {game.name}
                    </h2>
                    <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                      V.{game.version}
                    </span>
                  </div>

                  {/* Tag Minimalis */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/50">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm lowercase tracking-wide"
                        style={{
                          background: `hsl(${colorId(tag).bg} / 0.85)`,
                          color: `hsl(${colorId(tag).text})`,
                          border: `1px solid hsl(${colorId(tag).text} / 0.2)`,
                        }}
                      >
                        {tag.split("-").join(" ")}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
