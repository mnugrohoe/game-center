/**
 * shared/components/index.ts
 * Barrel — import anything shared from here.
 *
 * @example
 *   import { ControlButton, WinBanner, GameTitle } from "@/shared/components";
 */

// ui
export {
  ControlButton,
  ActionButton,
  GhostButton,
  LoadingSpinner,
} from "./ui/Button";
export { StatusChip } from "./ui/StatusChip";
export { WinBanner } from "./ui/WinBanner";
export { DifficultyBadge } from "./ui/DifficultyBadge";

// layout
export { GameTab } from "./layout/GameTab";

// charts
export { WavePreview } from "./charts/WavePreview";
