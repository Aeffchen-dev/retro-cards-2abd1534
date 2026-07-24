import React, { useMemo } from "react";
import * as StacksIcons from "@stackoverflow/stacks-icons/icons";

type IconName = keyof typeof StacksIcons;

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
    const raw = (StacksIcons as Record<string, string>)[name as string];
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
