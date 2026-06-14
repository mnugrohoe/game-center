import { IoSunny, IoMoon } from "react-icons/io5";
import { MamboCellValue } from "../types";

interface MAMBO_COMP {
  state: MamboCellValue;
  icon: React.ReactNode;
}
export const MAMBO_SUN: MAMBO_COMP = {
  state: 1,
  icon: <IoSunny />,
};
export const MAMBO_MOON: MAMBO_COMP = {
  state: 2,
  icon: <IoMoon />,
};
export const MAMBO_EMPTY: Partial<MAMBO_COMP> = { state: 0 };
