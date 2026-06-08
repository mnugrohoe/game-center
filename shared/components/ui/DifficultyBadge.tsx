/**
 * shared/components/ui/DifficultyBadge.tsx
 *
 * Displays a visual difficulty tier badge.
 *
 * The component supports two rendering modes:
 * - A non-interactive `<div>` (default)
 * - An interactive `<button>`
 *
 * Styling is derived from the provided {@link DiffTier}.
 *
 * @example
 * <DifficultyBadge tier={tier} />
 *
 * @example
 * <DifficultyBadge
 *   as="button"
 *   tier={tier}
 *   onClick={() => setDifficulty(tier)}
 * />
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

import { DiffTier } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { T } from "./tokens";

/**
 * Shared props available to all DifficultyBadge variants.
 */
type BaseProps = {
  /**
   * Difficulty tier metadata used for colors, icon, and label.
   */
  tier: DiffTier;

  /**
   * Whether the badge should appear highlighted.
   *
   * When false, the badge is visually dimmed.
   *
   * @default true
   */
  active?: boolean;

  /**
   * Additional CSS classes.
   */
  className?: string;

  /**
   * Additional inline styles.
   */
  style?: CSSProperties;

  /**
   * Optional content rendered below the tier label.
   */
  children?: ReactNode;
};

/**
 * Props for the non-interactive div variant.
 */
type DifficultyBadgeDivProps = BaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof BaseProps> & {
    /**
     * Underlying HTML element.
     *
     * @default "div"
     */
    as?: "div";
  };

/**
 * Props for the interactive button variant.
 */
type DifficultyBadgeButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    /**
     * Render the badge as a button.
     */
    as: "button";
  };

/**
 * Props accepted by DifficultyBadge.
 */
export type DifficultyBadgeProps =
  | DifficultyBadgeDivProps
  | DifficultyBadgeButtonProps;

/**
 * Displays a difficulty tier badge.
 */
export function DifficultyBadge(props: DifficultyBadgeProps) {
  const { tier, active = true, className, style, children } = props;

  const sharedClassName = cn(
    "flex flex-col items-center gap-0.75 px-1.5 py-2.5 transition-all duration-150",
    props.as === "button" ? "cursor-pointer select-none" : "cursor-default",
    className,
  );

  const sharedStyle: CSSProperties = {
    border: `1.5px solid ${active ? tier.color : T.border}`,
    color: active ? tier.color : T.text2,
    backgroundColor: active ? `${tier.color}18` : T.bg3,
    borderRadius: T.radius,
    fontFamily: T.font,
    boxShadow: active ? `0 0 12px ${tier.color}22` : "none",
    ...style,
  };

  const content = (
    <>
      <span className="text-base">{tier.icon}</span>

      <span
        className="font-bold uppercase"
        style={{
          fontSize: 9,
          letterSpacing: 1.5,
        }}
      >
        {tier.name}
      </span>

      {children}
    </>
  );

  if (props.as === "button") {
    const {
      as,
      tier: _tier,
      active: _active,
      className: _className,
      style: _style,
      children: _children,
      type,
      ...buttonProps
    } = props;

    return (
      <button
        type={type ?? "button"}
        className={sharedClassName}
        style={sharedStyle}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }

  const {
    as,
    tier: _tier,
    active: _active,
    className: _className,
    style: _style,
    children: _children,
    ...divProps
  } = props;

  return (
    <div className={sharedClassName} style={sharedStyle} {...divProps}>
      {content}
    </div>
  );
}

export default DifficultyBadge;
