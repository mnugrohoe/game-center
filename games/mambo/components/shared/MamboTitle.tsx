import GameTitle from "@/shared/component/GameTitle";

export default function MamboTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameTitle title="mambo">{children}</GameTitle>;
}
