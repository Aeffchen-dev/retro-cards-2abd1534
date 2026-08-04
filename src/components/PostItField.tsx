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
}) => (
  <div className={`flex flex-col w-full flex-1 ${className}`}>
    <div
      className="inline-flex self-start items-center h-8 pl-3 pr-3 retro-body-copy"
      style={{
        backgroundColor: readableBg(accent),
        color: TEXT,
      }}
    >
      {label}
    </div>

    {readOnly ? (
      <div
        className="w-full flex-1 p-3 bg-retro-post-it text-[#201C1D] text-base whitespace-pre-wrap"
        style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
      >
        {value || placeholder}
      </div>
    ) : (
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full flex-1 p-3 bg-retro-post-it retro-input retro-input-dark-text border-none text-base"
        style={{ borderRadius: "0px", minHeight: minHeight ? `${minHeight}px` : undefined }}
        placeholder={placeholder}
      />
    )}
  </div>
);

export default PostItField;
