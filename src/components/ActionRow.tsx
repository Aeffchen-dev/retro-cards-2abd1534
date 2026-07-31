import React from "react";
import StackIcon from "./StackIcon";

export interface ActionRowProps {
  /** Icon name from the Stacks-Icons set */
  icon: React.ComponentProps<typeof StackIcon>["name"];
  /** Label shown in the grey field */
  label: string;
  /** Background colour of the icon tile */
  accent: string;
  /** Icon colour, defaults to white */
  iconColor?: string;
  /** Click handler (ignored when `href` is set and no handler is needed) */
  onClick?: (e: React.MouseEvent) => void;
  /** Render as a link instead of a button */
  href?: string;
  /** Link target, only used together with `href` */
  target?: React.HTMLAttributeAnchorTarget;
  className?: string;
  style?: React.CSSProperties;
}

const BASE_CLASS =
  "swiper-no-swiping screen-only relative z-40 w-auto max-w-full self-start inline-flex items-center gap-0 h-8 retro-body-copy no-underline rounded-none border-none p-0 transition-opacity hover:opacity-90";

/**
 * Shared CTA row: coloured icon tile on the left + grey label field.
 * Single source of truth for every call-to-action row in the app.
 */
const GREY_TILE = "#E4E6E8";

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  accent,
  iconColor,
  onClick,
  href,
  target,
  className = "",
  style,
}) => {
  const isGreyTile = accent.trim().toUpperCase() === GREY_TILE;
  const resolvedIconColor = iconColor ?? (isGreyTile ? "#201C1D" : "#FFFFFF");
  const content = (
    <>
      <span
        className="shrink-0 w-8 h-8 flex items-center justify-center"
        style={{ background: accent }}
      >
        <StackIcon name={icon} size={16} color={resolvedIconColor} />
      </span>
      <span
        className="h-8 flex items-center px-3 text-left whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ background: GREY_TILE, color: "#201C1D" }}
      >


        {label}
      </span>
    </>
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className={`${BASE_CLASS} ${className}`}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={`${BASE_CLASS} ${className}`} style={style}>
      {content}
    </button>
  );
};

export default ActionRow;
