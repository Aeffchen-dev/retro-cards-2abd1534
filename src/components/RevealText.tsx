import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface RevealTextProps {
  text: string;
  /** Color each word flashes in before settling to black */
  color?: string;
  /** Delay between words in ms */
  stagger?: number;
  /** Wait before the first word appears — synced to the slide transition */
  startDelay?: number;
  /** Play the reveal only while the slide is active */
  active?: boolean;
}

/** Word-by-word reveal: each word pops in colored, then settles to black. */
const RevealText: React.FC<RevealTextProps> = ({ text, color, stagger = 65, startDelay = 380, active = true }) => {
  const [runId, setRunId] = useState(0);
  const wasActive = useRef(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (active && !wasActive.current) {
      wasActive.current = true;
      setRunId((n) => n + 1);
    } else if (!active) {
      wasActive.current = false;
    }
  }, [active]);

  // Restart the animation on the actual DOM nodes so it replays reliably,
  // even if React reuses the same elements.
  useLayoutEffect(() => {
    if (!active || !containerRef.current) return;
    const words = containerRef.current.querySelectorAll<HTMLElement>(".question-word");
    words.forEach((w) => {
      w.style.animation = "none";
      // force reflow
      void w.offsetWidth;
      w.style.animation = "";
    });
  }, [runId, active, text]);

  if (!active) {
    return <span style={{ color: "#201C1D" }}>{text}</span>;
  }

  return (
    <span ref={containerRef}>
      {text.split(" ").map((word, i) => (
        <span
          key={`${runId}-${word}-${i}`}
          className="question-word"
          style={{
            animationDelay: `${i * stagger}ms, ${i * stagger + 90}ms`,
            ["--reveal-color" as string]: color || "#201C1D",
          } as React.CSSProperties}
        >
          {word}&nbsp;
        </span>
      ))}
    </span>
  );
};

export default RevealText;
