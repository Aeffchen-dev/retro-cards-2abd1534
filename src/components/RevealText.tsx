import React, { useEffect, useState } from "react";

interface RevealTextProps {
  text: string;
  /** Color each word flashes in before settling to black */
  color?: string;
  /** Delay between words in ms */
  stagger?: number;
  /** Play the reveal only while the slide is active */
  active?: boolean;
}

/** Word-by-word reveal: each word pops in colored, then settles to black. */
const RevealText: React.FC<RevealTextProps> = ({ text, color, stagger = 65, active = true }) => {
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (active) setRunId((n) => n + 1);
  }, [active, text]);

  if (!active) {
    return <span style={{ color: "#201C1D" }}>{text}</span>;
  }

  return (
    <React.Fragment key={runId}>
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
    </React.Fragment>
  );
};

export default RevealText;
