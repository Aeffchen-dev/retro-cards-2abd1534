import React from "react";
import StackIcon from "./StackIcon";

export interface ActionRowProps {
  /** Icon name from the Stacks-Icons set */
  icon?: React.ComponentProps<typeof StackIcon>["name"];
  /** Custom icon node (overrides `icon`) */
  iconNode?: React.ReactNode;
  /** Label shown in the grey field */
  label: string;
  /** Background colour of the icon tile */
  accent: string;
  /** Icon colour, defaults to white */
  iconColor?: string;
  /** Label text colour, defaults to #201C1D */
  labelColor?: string;
  /** Background of the label field, defaults to the accent (slide pill) colour */
  fieldBg?: string;
  /** Outlined style: no fills, black borders */
  outlined?: boolean;
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
 * Shared CTA row: coloured icon tile on the left + label field in the slide's pill colour.
 * Single source of truth for every call-to-action row in the app.
 */



const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  iconNode,
  label,
  accent,
  iconColor,
  labelColor,
  fieldBg,
  outlined = false,
  onClick,
  href,
  target,
  className = "",
  style,
}) => {
  const resolvedIconColor = outlined ? (iconColor ?? "#201C1D") : (iconColor ?? "#201C1D");
  const border = outlined ? "1px solid #201C1D" : undefined;
  const content = (
    <>
      <span
        className="shrink-0 w-8 h-8 flex items-center justify-center"
        style={{ background: outlined ? "transparent" : accent, color: resolvedIconColor, border }}
      >
        {iconNode ?? (icon ? <StackIcon name={icon} size={16} color={resolvedIconColor} /> : null)}
      </span>
      <span
        className="h-8 flex items-center px-3 text-left whitespace-nowrap overflow-hidden text-ellipsis"
        style={{
          background: outlined ? "transparent" : (fieldBg ?? accent),
          color: labelColor ?? "#201C1D",
          border,
          borderLeft: outlined ? "none" : undefined,
        }}
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
