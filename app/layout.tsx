import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/shared/utils/fonts";

export const metadata: Metadata = {
  title:       "Game Center",
  description: "Puzzle games — Kings, Mambo, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
