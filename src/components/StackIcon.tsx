import React, { useMemo } from "react";
import * as StacksIcons from "@stackoverflow/stacks-icons/icons";

type IconName = keyof typeof StacksIcons;

/** Custom SVG overrides that take precedence over the Stacks set. */
const ICON_OVERRIDES: Record<string, string> = {
  IconArrowRight:
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="svg-icon IconArrowRight" aria-hidden="true"><path d="m17.52 9.28.56.54-.56.54-7.25 6.93-1.04-1.08 5.97-5.71H2V9h15.24zM15.7 7.5h-2.15L9.23 3.29l1.04-1.08z"/></svg>',
};

interface StackIconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  /** Render as outline (stroked silhouette) instead of solid fill. Default: true */
  outline?: boolean;
  strokeWidth?: number;
}

/**
 * Renders an icon from the Stack Exchange Stacks-Icons set.
 * Hard-coded fills are stripped so the icon inherits `currentColor`.
 */
const StackIcon: React.FC<StackIconProps> = ({
  name,
  size = 18,
  color,
  className,
  outline = true,
  strokeWidth = 1.1,
}) => {
  const svg = useMemo(() => {
    const raw = ICON_OVERRIDES[name as string] ?? (StacksIcons as Record<string, string>)[name as string];
    if (!raw) return "";
    let out = raw
      .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
      .replace(/width="\d+"/, `width="${size}"`)
      .replace(/height="\d+"/, `height="${size}"`);
    if (outline) {
      out = out
        .replace(/fill="currentColor"/g, 'fill="none"')
        .replace(
          /<svg /,
          `<svg fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" `
        );
    }
    return out;
  }, [name, size, outline, strokeWidth]);


  return (
    <span
      className={className}
      style={{ color, display: "inline-flex", lineHeight: 0 }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default StackIcon;
