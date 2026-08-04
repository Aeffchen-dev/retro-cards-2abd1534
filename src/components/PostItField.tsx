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

/** Pick dark or white label text so it always reads on the accent colour. */
const readableText = (hex?: string) => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "#201C1D";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // contrast against #201C1D (L ~ 0.014) vs #FFFFFF
  const withDark = (L + 0.05) / (0.014 + 0.05);
  const withWhite = 1.05 / (L + 0.05);
  return withDark >= withWhite ? "#201C1D" : "#FFFFFF";
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
        backgroundColor: accent || "var(--retro-post-it, #E4E6E8)",
        color: readableText(accent),
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
