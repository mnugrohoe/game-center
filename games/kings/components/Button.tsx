import { cinzel } from "@/shared/utils/fonts";

export function ControlButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Cinzel',serif",
        fontSize: "0.68rem",
        letterSpacing: "0.09em",
        padding: "8px 20px",
        borderRadius: "2px",
        border: "1px solid rgba(201,168,76,0.35)",
        background: "rgba(201,168,76,0.08)",
        color: "#c9a84c",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export function ButtonLevel({
  onClick,
  children,
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`${cinzel.className} text-xs px-3 py-6 border border-[rgba(201,168,76,0.35)] rounded-sm bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer`}
    >
      {children}
    </button>
  );
}
