import React from "react";

interface PostItFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  /** Render as static text (print view) instead of a textarea */
  readOnly?: boolean;
  minHeight?: number;
  className?: string;
  /** Background colour of the label bar (slide pill colour) */
  accent?: string;
  /** The label bar's colour painted as given, skipping the contrast lightening —
      for a neon the caller has already checked against black label text. */
  barColor?: string;
  /** Small grey sentence under the label bar, above the writing area */
  helper?: string;
  /** Bullet points by default: every line starts with "• " */
  bullets?: boolean;

}

/** Label text is always black — lighten the accent until contrast is sufficient. */
const TEXT = "#201C1D";
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r: number, g: number, b: number) =>
  0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);

const readableBg = (hex?: string) => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return hex || "var(--retro-post-it, #E4E6E8)";
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  const target = 0.34; // ~4.5:1 against #201C1D
  for (let i = 0; i < 24 && lum(r, g, b) < target; i++) {
    r = Math.round(r + (255 - r) * 0.12);
    g = Math.round(g + (255 - g) * 0.12);
    b = Math.round(b + (255 - b) * 0.12);
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

export const BULLET = "• ";

/** Every non-empty line carries exactly one leading bullet. */
export const bulletize = (text: string): string =>
  text
    .split("\n")
    .map((line) => {
      const body = line.replace(/^\s*/, "").replace(/^[•▪◦-]\s*/, "");
      return body.length ? BULLET + body : line;
    })
    .join("\n");

/** Pressing Enter starts the next line with a fresh bullet. */
export const bulletOnEnter = (text: string, from: number, to: number) => {
  const value = text.slice(0, from) + "\n" + BULLET + text.slice(to);
  return { value, caret: from + 1 + BULLET.length };
};




/**
 * Post-it style input with a 32px label bar directly above (0px gap).
 * The label bar hugs its content width and is filled with the slide pill colour.
 */
export const PostItField: React.FC<PostItFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  readOnly = false,
  minHeight,
  className = "",
  accent,
  barColor,
  helper,
  bullets = false,
}) => (
  <div className={`flex flex-col w-full flex-1 ${className}`}>
    <div
      className="inline-flex self-start items-center py-1 pl-3 pr-3 retro-body-copy"
      style={{
        minHeight: "32px",
        backgroundColor: barColor ?? readableBg(accent),
        color: TEXT,
      }}
    >
      {label}
    </div>
    {/* The sentence that explains the headline — the scale's own grey, one step
        under the label bar and straight above the writing area. */}
    {helper ? (
      <div className="post-it-helper retro-body-copy py-1" lang="de">{helper}</div>
    ) : null}


    {readOnly ? (
      <div
        className="w-full flex-1 p-3 bg-retro-post-it text-[#201C1D] text-base whitespace-pre-wrap"
        style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
      >
        {(bullets ? bulletize(value) : value) || placeholder}
      </div>
    ) : (
      <textarea
        value={value}
        onChange={(e) => {
          let next = e.target.value;
          if (bullets && !value.length && next.length && !next.startsWith(BULLET)) {
            next = BULLET + next;
          }
          onChange?.(next);
        }}
        onKeyDown={(e) => {
          if (!bullets || e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          const el = e.currentTarget;
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? start;
          const { value: next, caret } = bulletOnEnter(el.value, start, end);
          onChange?.(next);
          requestAnimationFrame(() => el.setSelectionRange(caret, caret));
        }}
        className="w-full flex-1 p-3 retro-input retro-input-dark-text border-none text-base"
        style={{ borderRadius: "0px", minHeight: minHeight ? `${minHeight}px` : undefined, background: readableBg(accent) }}
        placeholder={bullets && !placeholder.startsWith(BULLET) ? BULLET + placeholder : placeholder}
      />
    )}
  </div>
);

export default PostItField;
