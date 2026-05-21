/**
 * shared/utils/fonts.ts
 * Single font registry for the whole project.
 * Import the variable you need; never call next/font in a game file.
 */
import { Cinzel, Cinzel_Decorative, Space_Mono, Geist, Geist_Mono } from "next/font/google";

export const cinzel = Cinzel({
  variable:  "--font-cinzel",
  subsets:   ["latin"],
  weight:    ["400", "600", "700"],
  display:   "swap",
});

export const cinzelDecorative = Cinzel_Decorative({
  variable:  "--font-cinzel-decorative",
  subsets:   ["latin"],
  weight:    ["400", "700"],
  display:   "swap",
});

export const spaceMono = Space_Mono({
  variable:  "--font-space-mono",
  subsets:   ["latin"],
  weight:    ["400", "700"],
  display:   "swap",
});

// Geist for the shell / home page only
export const geistSans = Geist({
  variable:  "--font-geist-sans",
  subsets:   ["latin"],
});

export const geistMono = Geist_Mono({
  variable:  "--font-geist-mono",
  subsets:   ["latin"],
});

/** All CSS variable names to inject into <html className={...}> */
export const fontVariables = [
  cinzel.variable,
  cinzelDecorative.variable,
  spaceMono.variable,
  geistSans.variable,
  geistMono.variable,
].join(" ");
