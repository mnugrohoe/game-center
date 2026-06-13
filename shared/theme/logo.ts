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
  { container: string; padding: string }
> = {
  xs: {
    container: "w-6 h-6 text-[8px]",
    padding: "px-0.5",
  },
  sm: {
    container: "w-8 h-8 text-[10px]",
    padding: "px-1",
  },
  md: {
    container: "w-10 h-10 text-xs",
    padding: "px-1.5",
  },
  lg: {
    container: "w-12 h-12 text-sm",
    padding: "px-2",
  },
  xl: {
    container: "w-16 h-16 text-base",
    padding: "px-2.5",
  },
  "2xl": {
    container: "w-20 h-20 text-lg",
    padding: "px-3",
  },
  "3xl": {
    container: "w-24 h-24 text-xl",
    padding: "px-4",
  },
  "4xl": {
    container: "w-32 h-32 text-2xl",
    padding: "px-5",
  },
  "5xl": {
    container: "w-40 h-40 text-3xl",
    padding: "px-6",
  },
  "6xl": {
    container: "w-48 h-48 text-4xl",
    padding: "px-7",
  },
};
