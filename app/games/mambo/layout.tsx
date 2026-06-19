import type { Metadata } from "next";
import { meta } from "@/games/mambo";

export const metadata: Metadata = {
  title: meta.name + " Puzzle",
  description: meta.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
