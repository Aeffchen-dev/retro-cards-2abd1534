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
}

/**
 * Renders an icon from the Stack Exchange Stacks-Icons set.
 * Hard-coded fills are stripped so the icon inherits `currentColor`.
 */
const StackIcon: React.FC<StackIconProps> = ({ name, size = 18, color, className }) => {
  const svg = useMemo(() => {
    const raw = ICON_OVERRIDES[name as string] ?? (StacksIcons as Record<string, string>)[name as string];
    if (!raw) return "";
    return raw
      .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
      .replace(/width="\d+"/, `width="${size}"`)
      .replace(/height="\d+"/, `height="${size}"`);
  }, [name, size]);

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
