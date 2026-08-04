import React, { useMemo } from "react";

/**
 * Vector recreation of the page background graphic:
 * a twisting spiral stack of 3D slabs (pink / blue tops, orange sides)
 * on the dark charcoal page colour. Fully resolution independent.
 */
const W = 1021;
const H = 1920;

const DARK = "#201C1D";
const PINK = "#F39FFF";
const BLUE = "#4E6BEE";
const ORANGE = "#FF4A0C";

type Slab = {
  top: string;
  side: string;
  fill: string;
  sideFill: string;
};

function buildSlabs(): Slab[] {
  const count = 26;
  const slabs: Slab[] = [];
  const halfW = 300; // slab half length
  const depth = 70; // visual thickness of the top face
  const height = 44; // slab side height
  const stepY = (H + 160) / count;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const a = -0.28 + i * 0.26; // rotation around the vertical axis
    const cx = 760 - t * 60;
    const y = -60 + i * stepY;

    const cos = Math.cos(a);
    const sin = Math.sin(a);

    const xL = cx - halfW * cos;
    const xR = cx + halfW * cos;
    const yL = y + halfW * sin * 0.34;
    const yR = y - halfW * sin * 0.34;

    // top face: front edge -> back edge (pushed up + slightly right)
    const bx = depth * 0.35 * sin;
    const by = -depth * Math.abs(cos) * 0.9 - 14;

    const top = `${xL},${yL} ${xR},${yR} ${xR + bx},${yR + by} ${xL + bx},${yL + by}`;
    const side = `${xL},${yL} ${xR},${yR} ${xR},${yR + height} ${xL},${yL + height}`;

    slabs.push({
      top,
      side,
      fill: t < 0.42 ? PINK : BLUE,
      sideFill: ORANGE,
    });
  }
  return slabs;
}

export default function BgVector({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const slabs = useMemo(buildSlabs, []);
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={W} height={H} fill={DARK} />
      {slabs.map((s, i) => (
        <g key={i}>
          <polygon points={s.side} fill={s.sideFill} />
          <polygon points={s.top} fill={s.fill} />
        </g>
      ))}
    </svg>
  );
}
