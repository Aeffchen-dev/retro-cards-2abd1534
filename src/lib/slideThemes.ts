import { c, accentStep, dotStep, type ColorName } from "@/lib/colorScales";

export const WHITE = "#FFFFFF";
export const OFF_BLACK = c("neutral", 900);

export type SlideTheme = {
  hue: ColorName;
  bg: string;
  text: string;
  accent: string;
  pill: string;
  pillDot: string;
};

/** Bold rebrand: every slide owns a hue family from the generated scales. */
export const SLIDE_HUES: ColorName[] = [
  "pink",
  "teal",
  "orange",
  "cobalt",
  "amber",
  "magenta",
  "lime",
  "violet",
];

export const buildSlideThemes = (hues: ColorName[] = SLIDE_HUES): SlideTheme[] =>
  hues.map((hue) => {
    const pill = c(hue, 500);
    return {
      hue,
      bg: WHITE,
      text: OFF_BLACK,
      accent: accentStep(hue),
      pill,
      pillDot: dotStep(hue, pill),
    };
  });

export const SLIDE_THEMES: SlideTheme[] = buildSlideThemes();
