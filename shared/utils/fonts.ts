import {
  Geist,
  Geist_Mono,
  Cinzel,
  Cinzel_Decorative,
  Lato,
} from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  fallback: ["serif"],
});

export const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700"],
  fallback: ["serif"],
});

export const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  fallback: ["sans-serif"],
});
