import type { Metadata } from "next";
import "./globals.css";
import { geistMono, geistSans } from "@/shared/utils/fonts";

export const metadata: Metadata = {
  title: "Game Center",
  description:
    "A collection of small games and puzzles built with React and Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
