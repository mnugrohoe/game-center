import Link from "next/link";

const GAMES = [
  {
    href: "/games/kings",
    title: "Kings",
    icon: "♛",
    description:
      "Place one king per region, row, and column. No two kings may be adjacent.",
    tags: ["Puzzle", "Logic"],
    status: "playable" as const,
  },
  {
    href: "/games/mambo",
    title: "Mambo",
    icon: "☀",
    description:
      "Fill the grid with equal suns and moons. No three identical symbols in a row.",
    tags: ["Logic", "Casual"],
    status: "playable" as const,
  },
  {
    href: "#",
    title: "Water Sort",
    icon: "🧪",
    description: "Sort colored liquids into separate bottles.",
    tags: ["Puzzle", "Casual"],
    status: "coming" as const,
  },
  {
    href: "#",
    title: "Connect Pipe",
    icon: "🔧",
    description: "Connect all pipes so water flows from source to destination.",
    tags: ["Puzzle", "Logic"],
    status: "coming" as const,
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-6 bg-bg">
      {/* Header */}
      <header className="text-center mb-14">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px w-20 bg-linear-to-r from-transparent to-gold-500" />
          <h1 className="font-display text-3xl font-bold text-gold-100 tracking-[0.12em]">
            GAME CENTER
          </h1>
          <div className="h-px w-20 bg-linear-to-l from-transparent to-gold-500" />
        </div>
        <p className="font-ui text-[0.6rem] tracking-[0.18em] text-gold-500">
          PUZZLE GAMES · SOLVERS · GENERATORS
        </p>
      </header>

      {/* Cards grid */}
      <div className="w-full max-w-3xl grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {GAMES.map((g) => (
          <div
            key={g.title}
            className={[
              "panel transition-all duration-200",
              g.status === "playable"
                ? "hover:border-gold-500 hover:-translate-y-0.5 cursor-pointer"
                : "opacity-50 cursor-default",
            ].join(" ")}
          >
            {g.status === "playable" ? (
              <Link href={g.href} className="block no-underline text-inherit">
                <CardInner game={g} />
              </Link>
            ) : (
              <CardInner game={g} />
            )}
          </div>
        ))}
      </div>

      <p className="font-ui text-[0.55rem] tracking-[0.14em] text-gold-600 mt-16">
        MORE GAMES COMING SOON
      </p>
    </div>
  );
}

function CardInner({ game }: { game: (typeof GAMES)[number] }) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <span className="text-3xl leading-none">{game.icon}</span>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-ui text-[0.9rem] font-semibold text-gold-100 tracking-[0.08em]">
            {game.title}
          </h2>
          {game.status === "coming" && (
            <span className="chip chip-ghost text-[0.5rem]">SOON</span>
          )}
        </div>
        <p className="font-mono text-[0.75rem] text-secondary leading-relaxed">
          {game.description}
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap mt-auto">
        {game.tags.map((tag) => (
          <span key={tag} className="chip chip-ghost text-[0.58rem]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
