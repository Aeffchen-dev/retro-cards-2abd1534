import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("the draggable dot wears the same face as the grey smileys", () => {
  test("the marker's face is drawn in the smileys' own grey, outline and all", () => {
    const morph = slide.slice(slide.indexOf("const MorphFace"), slide.indexOf("const ExpressionPoint"));
    // The very colour and stroke the header smileys are drawn with.
    expect(morph).toContain("stroke={FACE_GREY}");
    expect(morph).toContain('<circle cx="12" cy="12" r="10" />');
    expect(slide).toContain("const MOUTH_W = 1.2;");
    expect(slide).toContain("const EYE_W = 1.2;");
    // The untouched dot's hint rides in the same grey.
    expect(slide).toContain("stroke={FACE_GREY} strokeWidth={ARROW_W}");
    // Nothing is knocked out of a filled disc any more.
    expect(slide).not.toContain("FACE_FILL");
  });

  test("the dot carries no green ring and no painted disc", () => {
    expect(css).not.toContain("--risiko-marker-ring");
    const point = css.slice(css.indexOf(".risiko-expression-point {"), css.indexOf(".risiko-thumb:focus"));
    expect(point).not.toContain("border:");
    expect(point).toContain("background: var(--risiko-field-bg);");
    expect(point).not.toContain("var(--retro-black)");
  });
});
