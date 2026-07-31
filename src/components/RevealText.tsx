import React from "react";

interface RevealTextProps {
  text: string;
  /** Color each word flashes in before settling to black */
  color?: string;
  /** Delay between words in ms */
  stagger?: number;
}

/** Word-by-word reveal: each word pops in colored, then settles to black. */
const RevealText: React.FC<RevealTextProps> = ({ text, color, stagger = 65 }) => (
  <>
    {text.split(" ").map((word, i) => (
      <span
        key={`${word}-${i}`}
        className="question-word"
        style={{
          animationDelay: `${i * stagger}ms, ${i * stagger + 90}ms`,
          ["--reveal-color" as string]: color || "#201C1D",
        } as React.CSSProperties}
      >
        {word}&nbsp;
      </span>
    ))}
  </>
);

export default RevealText;
