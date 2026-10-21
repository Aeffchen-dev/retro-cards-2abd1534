import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

/** The body of one selector, up to its own closing brace. */
const block = (start) => {
  const from = css.indexOf(start);
  return css.slice(from, css.indexOf("\n}", from) + 2);
};

describe("the dot's smiley is painted on the card in its own colour", () => {
  test("the face keeps the smileys' drawing but wears the rule's ink, not grey", () => {
    const morph = slide.slice(slide.indexOf("const MorphFace"), slide.indexOf("const ExpressionPoint"));
    expect(morph).toContain("stroke={INK}");
    expect(morph).not.toContain("FACE_GREY");
    expect(morph).toContain('<circle cx="12" cy="12" r="10" />');
    // The untouched dot's hint rides in the same ink.
    expect(slide).toContain("stroke={INK} strokeWidth={ARROW_W}");
  });

  test("no white disc and no ring is painted behind the face", () => {
    const point = block(".risiko-expression-point {");
    expect(point).toContain("background: none;");
    expect(point).not.toContain("--risiko-field-bg");
    expect(point).not.toContain("border:");
    expect(css).not.toContain("--risiko-marker-ring");
  });

  test("the rule stops at the face's own edge, so nothing pale rings the smiley", () => {
    const plate = block(".risiko-expression-point::before");
    expect(plate).toContain("background: var(--risiko-field-bg);");
    // A plate the size of the drawn circle (r=10 of 24 plus its stroke), not the
    // whole 44px dot — otherwise a pale ring shows around the outline.
    expect(plate).toContain("calc(var(--risiko-marker-size) * 0.87)");
    expect(plate).toContain("border-radius: 50%;");
  });
});
