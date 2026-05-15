import Link from "next/link";

const GAMES = [
  {
    href: "/games/kings",
    title: "Kings",
    icon: "♛",
    description: "Place one king per region, row, and column. No two kings may be adjacent.",
    tags: ["Puzzle", "Logic"],
    status: "playable",
  },
  {
    href: "#",
    title: "Water Sort",
    icon: "🧪",
    description: "Sort colored liquids into separate bottles.",
    tags: ["Puzzle", "Casual"],
    status: "coming",
  },
  {
    href: "#",
    title: "Connect Pipe",
    icon: "🔧",
    description: "Connect all pipes so water flows from source to destination.",
    tags: ["Puzzle", "Logic"],
    status: "coming",
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center py-16 px-6"
      style={{
        background: "linear-gradient(135deg,#0f0e0d 0%,#161410 60%,#0a0908 100%)",
        color: "#d4c49a",
      }}
    >
      {/* Header */}
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-24" style={{ background: "linear-gradient(to right,transparent,rgba(201,168,76,0.4))" }} />
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: "2rem", fontWeight: 600, color: "#e8c96a", letterSpacing: "0.12em" }}>
            GAME CENTER
          </h1>
          <div className="h-px w-24" style={{ background: "linear-gradient(to left,transparent,rgba(201,168,76,0.4))" }} />
        </div>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(201,168,76,0.35)" }}>
          PUZZLE GAMES · SOLVERS · GENERATORS
        </p>
      </div>

      {/* Game cards */}
      <div className="w-full max-w-3xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <div
            key={g.title}
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "0.5px solid rgba(201,168,76,0.15)",
              borderRadius: 2,
              overflow: "hidden",
              opacity: g.status === "coming" ? 0.5 : 1,
            }}
          >
            {g.status === "playable" ? (
              <Link href={g.href} style={{ textDecoration: "none", color: "inherit" }}>
                <CardInner game={g} />
              </Link>
            ) : (
              <CardInner game={g} />
            )}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "'Cinzel',serif", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(201,168,76,0.2)", marginTop: 64 }}>
        MORE GAMES COMING SOON
      </p>
    </div>
  );
}

function CardInner({ game }: { game: (typeof GAMES)[0] }) {
  return (
    <div className="p-5 flex flex-col gap-3 h-full" style={{ cursor: game.status === "playable" ? "pointer" : "default" }}>
      <div style={{ fontSize: "2rem" }}>{game.icon}</div>
      <div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.9rem", fontWeight: 600, color: "#e8c96a", letterSpacing: "0.08em", marginBottom: 6 }}>
          {game.title}
          {game.status === "coming" && (
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: "0.55rem", letterSpacing: "0.1em", marginLeft: 8, color: "rgba(201,168,76,0.4)", verticalAlign: "middle" }}>
              SOON
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.78rem", color: "#7a6840", lineHeight: 1.5 }}>{game.description}</p>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-auto">
        {game.tags.map((t) => (
          <span key={t} style={{ fontSize: "0.6rem", fontFamily: "'Cinzel',serif", letterSpacing: "0.08em", padding: "2px 8px", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 2, color: "rgba(201,168,76,0.4)" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
