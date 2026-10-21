import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { scaleEndInset } from "./risiko-data";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
// The handle's own size lives in the component; the scale's ends stand one radius in.
const MARKER_SIZE = Number(slide.match(/const MARKER_SIZE = (\d+);/)?.[1] ?? 0);

// The scale used to keep a band of the card unused at both ends: the outermost
// smiley stood 10% in from the edge while the rule ran the full width. Now the
// smileys fill the whole width the circle travels — the first and last stand
// exactly one handle-radius from the container's own edges, so the handle still
// lands fully visible on them.
test("the smileys fill the whole width the handle travels", () => {
  expect(MARKER_SIZE, "the handle's size is not where the scale expects it").toBe(44);
  const inset = scaleEndInset(MARKER_SIZE);
  expect(inset, "the handle would hang off the card's edge").toBe(MARKER_SIZE / 2);
  // one radius at each end, and everything between the two is the scale's own span
  expect(slide).toContain("const END_INSET = scaleEndInset(MARKER_SIZE);");
  expect(slide).toContain("const SPAN = `(100% - ${2 * END_INSET}px)`;");
  // the first smiley's centre stands one handle-radius from the left edge…
  expect(slide).toContain("const faceX = (i: number) => `calc(${END_INSET}px + ");
  // …and the circle is placed by the very same inset and span, so value 0 lands
  // under the first smiley and value 100 under the last one.
  const markerLeft = slide.match(/const markerLeft = \(value: number\) => `([^`]+)`;/)?.[1] ?? "";
  expect(markerLeft, "the circle is not placed by the same inset and span").toBeTruthy();
  expect(markerLeft).toContain("${END_INSET}px");
  expect(markerLeft).toContain("* ${SPAN} / 100");
  // the field no longer insets its own content to make room for the handle: the
  // smileys reach the card's own edges, and the field keeps only the room its own
  // smiley row needs at the top
  expect(css, "the field still insets its content horizontally").not.toMatch(/\.risiko-scale-field \{[^}]*padding-(inline|left|right)/);
  expect(/\.risiko-scale-field \{[^}]*padding-top/.test(css), "the field no longer keeps room for its smiley row").toBe(true);
});

test("a press anywhere on the field places the circle by the same ends", () => {
  // The container's own handler converts a pointer position into a value. It has
  // to use the very ends the smileys stand on, or a press beside the outermost
  // smiley would answer something other than that smiley.
  const from = slide.match(/const from = ([^;]+);/)?.[1] ?? "";
  const travel = slide.match(/const travel = ([^;]+);/)?.[1] ?? "";
  expect(from, "the press maths does not start at the outer smiley").toContain("END_INSET");
  expect(travel, "the press maths does not end at the outer smiley").toContain("END_INSET");
});

