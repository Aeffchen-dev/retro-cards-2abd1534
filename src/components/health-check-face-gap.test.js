import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { HC_FACE, HC_TRACK_MARGIN, hcSmileyLineGap, hcSpanPoint } from "./health-check-position";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * Evaluate one of the column's own `calc()` tops for a column `h` px tall, so a
 * test can read the same number the browser would paint.
 */
function calcTop(fraction, h) {
  const s = hcSpanPoint(fraction);
  const margin = Number(s.match(/^calc\((\d+(?:\.\d+)?)px/)?.[1]);
  const box = Number(s.match(/100% - (\d+(?:\.\d+)?)px/)?.[1]);
  const factor = Number(s.match(/\) \* ([\d.]+)/)?.[1]);
  const half = Number(s.match(/\+ (\d+(?:\.\d+)?)px\)$/)?.[1]);
  expect([margin, box, factor, half], `the column's top is not a readable calc(): ${s}`).not.toContain(NaN);
  return margin + (h - box) * factor + half;
}

/**
 * "health check smilies more vertical space between smiley and line" — the five
 * grey lines stand on the midpoints between neighbouring smileys, so the air
 * under a smiley and the air above the next one are one and the same number.
 * It had closed to 3.6px on a phone, where the line read as part of the face.
 */
describe("the Health Check smileys keep air around their lines", () => {
  test("the line under a smiley stands well clear of it", () => {
    // The face column's own height on the sizes the deck is laid out for.
    expect(hcSmileyLineGap(344.5)).toBeGreaterThanOrEqual(10); // phone, 393x706
    expect(hcSmileyLineGap(310.2)).toBeGreaterThanOrEqual(6); // phone, 375x667
    expect(hcSmileyLineGap(515.2)).toBeGreaterThanOrEqual(20); // desktop window
    // the measure this replaced sat at 3.6px on the phone the rule was asked for
    expect(hcSmileyLineGap(344.5)).toBeGreaterThan(3.6 * 2);
  });

  test("a smiley and the line under it read the same gap the helper promises", () => {
    const h = 344.5;
    for (let i = 0; i < 5; i++) {
      const faceBottom = calcTop(i / 4, h) + HC_FACE / 2;
      const line = calcTop((i + 0.5) / 4, h);
      expect(line - faceBottom, `the line under smiley ${i + 1} is not where the helper says`).toBeCloseTo(
        hcSmileyLineGap(h),
        6,
      );
    }
  });

  test("every smiley carries its own line, and none stands above the first", () => {
    // four lines on the midpoints between neighbouring faces…
    expect(cards).toContain("hcSpanPoint((i + 0.5) / 4)");
    // …drawn on the very span the faces stand on, so a line always falls between
    // two of them.
    expect(cards).toContain("hcSpanPoint(i / 4)");
  });

  test("the column closes below the fourth line, not under the last smiley", () => {
    // "below last emoji first 2 health check no line" — the track stops below the
    // last smiley's own line: only the four midpoints between neighbouring faces
    // are drawn, so nothing stands under the bottom-most face.
    const guides = cards.slice(cards.indexOf("health-check-guides"), cards.indexOf("print-emoji-scale"));
    expect(guides, "the track draws a different number of lines").toContain("Array.from({ length: 4 }");
    expect(guides, "the track still closes under the last smiley").not.toContain("length: 5");
    // the last line drawn sits half a face-distance above the last face's centre,
    // i.e. on the midpoint between the last two faces — never below the last one
    expect(cards, "the last line no longer stands between the last two faces")
      .toContain("hcSpanPoint((i + 0.5) / 4)");
  });

  test("the track never grows out of the column, however tall it is", () => {
    for (const h of [260, 344.5, 515.2, 900]) {
      // the first smiley's top edge keeps the column's own margin…
      expect(calcTop(0, h) - HC_FACE / 2, `the first smiley no longer starts at the margin at ${h}px`).toBeCloseTo(
        HC_TRACK_MARGIN,
        6,
      );
      // …and the line under the last smiley keeps the same margin off its foot.
      expect(calcTop(1.125, h), `the last line fell out of the column at ${h}px`).toBeCloseTo(
        h - HC_TRACK_MARGIN,
        6,
      );
    }
  });
});
