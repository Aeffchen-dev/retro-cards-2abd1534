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

  test("the dot is drawn with the rule's own pen, not an unrelated number", () => {
    // The zoomed window's own units painted into MARKER_SIZE px: the rule's pixel
    // width back into those units, so the dot's lines render exactly as thick as
    // the rule it rides.
    expect(slide).toContain("const MARKER_PEN = RULE_W * (FACE_VIEW / MARKER_SIZE);");
    expect(slide).toContain("const MOUTH_W = MARKER_PEN;");
    expect(slide).toContain("const EYE_W = MARKER_PEN;");
    expect(slide).toContain("const ARROW_W = RULE_W * (24 / ARROW_SIZE);");
  });

  test("no white disc and no ring is painted around the face", () => {
    const point = block(".risiko-expression-point {");
    expect(point).toContain("background: none;");
    expect(point).not.toContain("--risiko-field-bg");
    expect(point).not.toContain("border:");
    expect(css).not.toContain("--risiko-marker-ring");
  });

  test("the smiley is white-filled and the rule stops at its edge", () => {
    const plate = block(".risiko-expression-point::before");
    // The face's own white, the same fill the Memojis wear — on screen and on paper.
    expect(plate).toContain("background: var(--risiko-face-fill);");
    expect(css).toContain("--risiko-face-fill: #FFFFFF;");
    // A plate the size of the zoomed circle including its stroke — the dot's box
    // plus the rule's own pen — not a pale ring around the outline.
    expect(plate).toContain("calc(var(--risiko-marker-size) * 1.05)");
    expect(plate).toContain("border-radius: 50%;");
    // a subtle white outline just outside the answer's own circle (user:
    // "sliderdot add a subtle white outline") — the grey smileys draw without a
    // fill now, so this is what keeps the answer clear of the rule behind it
    expect(plate, "the answer wears no white outline").toContain(
      "box-shadow: 0 0 0 2px var(--risiko-face-fill);",
    );
  });

  test("the circle and face are drawn 20% bigger than the scale's smileys", () => {
    const zoom = Number(slide.match(/const FACE_ZOOM = ([\d.]+);/)?.[1] ?? 0);
    const marker = Number(slide.match(/const MARKER_SIZE = (\d+);/)?.[1] ?? 0);
    const face = Number(slide.match(/const FACE_SIZE = (\d+);/)?.[1] ?? 0);
    expect(zoom, "the dot's drawing is not zoomed by the 20% asked for").toBe(1.2);
    expect(slide).toContain("const FACE_VIEW = 24 / FACE_ZOOM;");
    expect(slide).toContain("const FACE_VIEW_OFF = (24 - FACE_VIEW) / 2;");
    const morph = slide.slice(slide.indexOf("const MorphFace"), slide.indexOf("const ExpressionPoint"));
    // The drawing itself is untouched — the same r=10 circle — only the window
    // around it shrinks, so circle and features land bigger inside the same box.
    expect(morph).toContain("viewBox={`${FACE_VIEW_OFF} ${FACE_VIEW_OFF} ${FACE_VIEW} ${FACE_VIEW}`}");
    // The zoomed circle's own stroke spills past the 44px box, so the box must not clip it.
    expect(morph).toContain('style={{ overflow: "visible" }}');
    // The same 20-unit circle through the dot's 20-unit window against the
    // smileys' 24-unit window, both in 44px boxes: exactly 20% wider.
    const markerPx = (20 / (24 / zoom)) * marker;
    const smileyPx = (20 / 24) * face;
    expect(markerPx / smileyPx, "the dot's circle is not 20% wider than a smiley's").toBeCloseTo(1.2, 5);
  });
});
