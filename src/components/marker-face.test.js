import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("the dot's smiley is painted on the card in its own colour", () => {
  test("the face keeps the smileys' drawing but wears the rule's ink, not grey", () => {
    const morph = slide.slice(slide.indexOf("const MorphFace"), slide.indexOf("const ExpressionPoint"));
    expect(morph).toContain("stroke={INK}");
    expect(morph).not.toContain("FACE_GREY");
    expect(morph).toContain('<circle cx="12" cy="12" r="10" />');
    // The untouched dot's hint rides in the same ink.
    expect(slide).toContain("stroke={INK} strokeWidth={ARROW_W}");
  });

  test("nothing white sits behind the face and no ring is painted around it", () => {
    const point = css.slice(css.indexOf(".risiko-expression-point {"), css.indexOf(".risiko-thumb:focus"));
    expect(point).toContain("background: none;");
    expect(point).not.toContain("--risiko-field-bg");
    expect(point).not.toContain("border:");
    expect(css).not.toContain("--risiko-marker-ring");
  });
});
