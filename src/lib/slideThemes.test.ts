import { describe, it, expect } from "vitest";
import { SLIDE_HUES, SLIDE_THEMES, buildSlideThemes, WHITE, OFF_BLACK } from "@/lib/slideThemes";
import { SCALES, c, contrast, type ColorName, type ScaleStep } from "@/lib/colorScales";

const STEPS: ScaleStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const isHex = (v: string) => /^#[0-9A-F]{6}$/.test(v);

describe("colour scales", () => {
  it("produces a full 50-900 ramp of valid hex values for every hue", () => {
    for (const name of Object.keys(SCALES) as ColorName[]) {
      for (const step of STEPS) {
        expect(isHex(SCALES[name][step]), `${name}/${step}`).toBe(true);
      }
    }
  });

  it("never collapses a coloured step to plain white", () => {
    for (const name of Object.keys(SCALES) as ColorName[]) {
      for (const step of STEPS) {
        // 50 is the lightest tint but must still carry hue
        expect(SCALES[name][step], `${name}/${step}`).not.toBe(WHITE);
      }
    }
  });

  it("keeps the ramp monotonically darkening from 50 to 900", () => {
    for (const name of Object.keys(SCALES) as ColorName[]) {
      const contrasts = STEPS.map((s) => contrast(SCALES[name][s], WHITE));
      for (let i = 1; i < contrasts.length; i++) {
        expect(contrasts[i], `${name} step ${STEPS[i]}`).toBeGreaterThan(contrasts[i - 1]);
      }
    }
  });
});

describe("slide themes", () => {
  it("renders one theme per slide hue", () => {
    expect(SLIDE_THEMES).toHaveLength(SLIDE_HUES.length);
    SLIDE_THEMES.forEach((theme, i) => expect(theme.hue).toBe(SLIDE_HUES[i]));
  });

  it("uses a white card background and off-black text on every slide", () => {
    for (const theme of SLIDE_THEMES) {
      expect(theme.bg).toBe(WHITE);
      expect(theme.text).toBe(OFF_BLACK);
      expect(theme.text).not.toBe(WHITE);
    }
  });

  it("uses the saturated 500 step of its own hue as pill colour", () => {
    for (const theme of SLIDE_THEMES) {
      expect(theme.pill).toBe(c(theme.hue, 500));
    }
  });

  it("never falls back to white for accent, pill or dot", () => {
    for (const theme of SLIDE_THEMES) {
      for (const key of ["accent", "pill", "pillDot"] as const) {
        expect(isHex(theme[key]), `${theme.hue}.${key}`).toBe(true);
        expect(theme[key], `${theme.hue}.${key}`).not.toBe(WHITE);
      }
    }
  });

  it("picks accent/dot steps from the slide's own scale", () => {
    for (const theme of SLIDE_THEMES) {
      const ramp = STEPS.map((s) => SCALES[theme.hue][s]);
      expect(ramp, `${theme.hue}.accent`).toContain(theme.accent);
      expect(ramp, `${theme.hue}.pillDot`).toContain(theme.pillDot);
    }
  });

  it("keeps white icons on the accent readable (>= 4.5:1)", () => {
    for (const theme of SLIDE_THEMES) {
      expect(contrast(theme.accent, WHITE), `${theme.hue}.accent`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the pill dot readable on the pill (>= 3:1)", () => {
    for (const theme of SLIDE_THEMES) {
      expect(contrast(theme.pillDot, theme.pill), `${theme.hue}.pillDot`).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives every slide a distinct pill colour", () => {
    const pills = SLIDE_THEMES.map((t) => t.pill);
    expect(new Set(pills).size).toBe(pills.length);
  });

  it("satisfies the same guarantees for any hue in the palette", () => {
    const themes = buildSlideThemes(Object.keys(SCALES) as ColorName[]);
    for (const theme of themes) {
      expect(theme.accent).not.toBe(WHITE);
      expect(contrast(theme.accent, WHITE), `${theme.hue}.accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.pillDot, theme.pill), `${theme.hue}.pillDot`).toBeGreaterThanOrEqual(3);
    }
  });
});
