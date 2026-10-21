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

  test("the dot keeps its own face pen, a step under the rule it rides", () => {
    // user: "smiley outlines and the slider line +20% stroke width compared to
    // face" — the dot's outline, eyes and mouth keep the reference pen, so the
    // zoomed window converts that face's own pixel width back into its units.
    expect(slide).toContain("const FACE_RULE_W = FACE_PEN * (FACE_SIZE / 24);");
    expect(slide).toContain("const MARKER_PEN = FACE_RULE_W * (FACE_VIEW / MARKER_SIZE);");
    expect(slide).toContain("const MOUTH_W = MARKER_PEN;");
    expect(slide).toContain("const EYE_W = MARKER_PEN;");
    expect(slide).toContain("const ARROW_W = 24 / ARROW_SIZE;");
  });

  test("the resting circle is drawn and the arrow hint paints 1px", () => {
    // user: "default slier circle same styling as after dra" — the resting dot
    // wears the very circle the dragged one does and only the features wait for
    // the first touch; user: "arrow icon stroke 1px" — the hint's pen is a real
    // pixel, derived from the arrow's own box (26px painted from a 24-unit view).
    const arrowSize = Number(slide.match(/const ARROW_SIZE = (\d+);/)?.[1] ?? 0);
    expect(arrowSize, "the arrow's own size is not declared").toBe(26);
    expect(slide, "the arrow's svg does not map a 24-unit view into that box")
      .toContain('<svg width={ARROW_SIZE} height={ARROW_SIZE} viewBox="0 0 24 24"');
    expect(slide, "the arrow's pen is not one pixel of that box")
      .toContain("const ARROW_W = 24 / ARROW_SIZE;");
    expect((24 / arrowSize) * (arrowSize / 24), "the arrow does not paint a 1px pen").toBeCloseTo(1, 5);
    expect(slide, "the resting dot draws no circle").toContain('<circle cx="12" cy="12" r="10" />');
    expect(slide, "the features do not wait for the first touch").toContain("{features ? (");
    expect(slide, "the resting dot is not handed the plain circle")
      .toContain("<MorphFace value={value} features={shown} />");
    expect(css.match(/\.risiko-drag-face \{[\s\S]*?\n\}/)?.[0] ?? "", "the face is still hidden at rest")
      .toContain("transform: scale(1);");
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
