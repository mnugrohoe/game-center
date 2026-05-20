import GameTitle from "@/shared/component/GameTitle";

export default function KingsTitle({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <GameTitle title="♛ KINGS">{children}</GameTitle>;
}
