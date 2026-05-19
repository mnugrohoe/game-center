export default function HowToPlay() {
  return (
    <div
      className="rounded-sm p-4"
      style={{
        background: "#111009",
        border: "0.5px solid rgba(201,168,76,0.1)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{
            flex: 1,
            height: "0.5px",
            background:
              "linear-gradient(to right,transparent,rgba(201,168,76,0.3))",
          }}
        />
        <span
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            color: "#7a6840",
          }}
        >
          HOW TO PLAY
        </span>
        <div
          style={{
            flex: 1,
            height: "0.5px",
            background:
              "linear-gradient(to left,transparent,rgba(201,168,76,0.3))",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          { k: "L-click", v: "→ mark ×" },
          { k: "R-click / dblclick", v: "→ King ♛" },
          { k: "1 king", v: "per region, row, column" },
          { k: "3×3 zone", v: "around each king = blocked" },
        ].map(({ k, v }) => (
          <div
            key={k}
            className="flex gap-2"
            style={{ fontSize: "0.75rem", color: "#7a6840" }}
          >
            <span style={{ color: "#c9a84c" }}>{k}</span> {v}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: "0.68rem",
          color: "#4a3810",
          lineHeight: 1.6,
        }}
      >
        Difficulty is non-linear — it rises like a wave, not a ramp. Same level
        always generates the same puzzle.
      </div>
    </div>
  );
}
