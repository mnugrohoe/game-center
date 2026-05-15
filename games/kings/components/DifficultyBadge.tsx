import { cinzel } from "@/shared/utils/fonts";
import { DIFF_TIERS } from "@/games/kings/core/const";

export const DifficultyBadge: React.FC<{
  difficulty: number;
  active?: boolean;
}> = ({ difficulty, active = true }) => {
  const tier = DIFF_TIERS[difficulty] || DIFF_TIERS[0];
  return (
    <div
      className={`mt-1 ${cinzel.className} py-1.5 px-3.5 border rounded-xs`}
      style={{
        fontSize: "0.62rem",
        border: active
          ? `1px solid ${tier.dim}`
          : "1px solid rgba(201,168,76,0.2)",
        color: active ? tier.bright : "#7a6840",
        backgroundColor: active ? `${tier.color}18` : "transparent",
      }}
    >
      {tier.icon} {tier.name.toUpperCase()}
    </div>
  );
};
