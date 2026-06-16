export type SizeType =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl";

export const logoSize: Record<
  SizeType,
  { container: string; padding: string; iconSize: number; baseSize: number }
> = {
  xs: {
    container: "w-6 h-6 text-[8px]",
    padding: "px-0.5",
    baseSize: 6,
    iconSize: 14, // w-6 = 24px, ikon dasar diambil ~14px agar aman dari clipping saat di-scale 1.44x
  },
  sm: {
    container: "w-8 h-8 text-[10px]",
    padding: "px-1",
    baseSize: 8,
    iconSize: 18, // w-8 = 32px
  },
  md: {
    container: "w-10 h-10 text-xs",
    padding: "px-1.5",
    baseSize: 10,
    iconSize: 24, // w-10 = 40px
  },
  lg: {
    container: "w-12 h-12 text-sm",
    padding: "px-2",
    baseSize: 12,
    iconSize: 28, // w-12 = 48px
  },
  xl: {
    container: "w-16 h-16 text-base",
    padding: "px-2.5",
    baseSize: 16,
    iconSize: 38, // w-16 = 64px
  },
  "2xl": {
    container: "w-20 h-20 text-lg",
    padding: "px-3",
    baseSize: 20,
    iconSize: 48, // w-20 = 80px
  },
  "3xl": {
    container: "w-24 h-24 text-xl",
    padding: "px-4",
    baseSize: 24,
    iconSize: 58, // w-24 = 96px
  },
  "4xl": {
    container: "w-32 h-32 text-2xl",
    padding: "px-5",
    baseSize: 32,
    iconSize: 76, // w-32 = 128px
  },
  "5xl": {
    container: "w-40 h-40 text-3xl",
    padding: "px-6",
    baseSize: 40,
    iconSize: 96, // w-40 = 160px
  },
  "6xl": {
    container: "w-48 h-48 text-4xl",
    padding: "px-7",
    baseSize: 48,
    iconSize: 116, // w-48 = 192px
  },
};
