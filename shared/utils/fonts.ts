/**
 * shared/utils/fonts.ts
 * Single font registry for the whole project.
 */

import {
  Cinzel,
  Cinzel_Decorative,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Space_Mono,
} from "next/font/google";

export const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/** All CSS variables for <html> */
export const fontVariables = [
  cinzel.variable,
  cinzelDecorative.variable,
  geistSans.variable,
  geistMono.variable,
  jetBrainsMono.variable,
  spaceMono.variable,
].join(" ");
