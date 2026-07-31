import React from "react";
import StackIcon from "./StackIcon";

export interface ActionRowProps {
  /** Icon name from the Stacks-Icons set */
  icon: React.ComponentProps<typeof StackIcon>["name"];
  /** Label shown in the grey field */
  label: string;
  /** Background colour of the icon tile */
  accent: string;
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
  "swiper-no-swiping screen-only relative z-40 w-auto max-w-full self-start inline-flex items-center gap-0 h-12 retro-body-copy no-underline rounded-none border-none p-0 transition-opacity hover:opacity-90";

/**
 * Shared CTA row: coloured icon tile on the left + grey label field.
 * Single source of truth for every call-to-action row in the app.
 */
const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  accent,
  onClick,
  href,
  target,
  className = "",
  style,
}) => {
  const content = (
    <>
      <span
        className="shrink-0 w-12 h-12 flex items-center justify-center"
        style={{ background: accent }}
      >
        <StackIcon name={icon} size={20} color="#FFFFFF" />
      </span>
      <span
        className="h-12 flex items-center px-3 text-left whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ background: "#E4E6E8", color: "#201C1D" }}
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
