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
}

/**
 * Post-it style input with a 32px grey label bar directly above (0px gap).
 */
export const PostItField: React.FC<PostItFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  readOnly = false,
  minHeight,
  className = "",
}) => (
  <div className={`flex flex-col w-full flex-1 ${className}`}>
    <div
      className="flex items-center h-8 px-3 w-full retro-body-copy text-[#201C1D]"
      style={{ backgroundColor: "#D9DBDE" }}
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
