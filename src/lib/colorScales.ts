/**
 * Color scales derived from the brand palette boards.
 *
 * Every scale is generated from a single base hex taken from the palette
 * image: steps 50–400 are tints (mixed toward white), 500 is the raw base
 * colour, 600–900 are shades (mixed toward near-black). This keeps every
 * usable tone in the app traceable back to one of the approved colours.
 */

export type ScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const rgbToHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const mix = (a: string, b: string, amount: number) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex([
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  ]);
};

const WHITE = "#FFFFFF";
const SHADE = "#140F10"; // near-black from the dark board, keeps shades warm

/** Tint/shade ramp applied to every base colour. */
const RAMP: Record<ScaleStep, number> = {
  50: 0.94,
  100: 0.86,
  200: 0.72,
  300: 0.52,
  400: 0.28,
  500: 0,
  600: 0.18,
  700: 0.38,
  800: 0.58,
  900: 0.78,
};

export type ColorScale = Record<ScaleStep, string>;

export const createScale = (base: string): ColorScale =>
  (Object.keys(RAMP) as unknown as ScaleStep[]).reduce((acc, key) => {
    const step = Number(key) as ScaleStep;
    const amount = RAMP[step];
    acc[step] = step === 500 ? base.toUpperCase() : mix(base, step < 500 ? WHITE : SHADE, amount);
    return acc;
  }, {} as ColorScale);

/** Base colours lifted straight from the palette boards. */
export const BASE_COLORS = {
  orange: "#FF5817",
  amber: "#FFA100",
  yellow: "#FFCC00",
  magenta: "#FF04FF",
  pink: "#F39FFF",
  mauve: "#A85BA8",
  plum: "#492049",
  violet: "#5343A8",
  indigo: "#9D9CFF",
  blue: "#009DFF",
  deepBlue: "#034E7D",
  sky: "#9DD9FF",
  steelBlue: "#C6D0E0",
  teal: "#0FB3A6",
  lime: "#A5D968",
  green: "#25713A",
  forest: "#103C1C",
  brown: "#6C2D01",
  maroon: "#692932",
  wine: "#371318",
  neutral: "#575757",
} as const;

export type ColorName = keyof typeof BASE_COLORS;

export const SCALES = Object.fromEntries(
  Object.entries(BASE_COLORS).map(([name, hex]) => [name, createScale(hex)]),
) as Record<ColorName, ColorScale>;

/** Shorthand accessor: `c("orange", 700)` */
export const c = (name: ColorName, step: ScaleStep = 500) => SCALES[name][step];
