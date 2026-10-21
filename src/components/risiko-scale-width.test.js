import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { scaleEndInset, MARKER_SIZE } from "./risiko-data";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

// The scale used to keep a band of the card unused at both ends: the outermost
// smiley stood 10% in from the edge while the rule ran the full width. Now the
// smileys fill the whole width the circle travels — the first and last stand
// exactly one handle-radius from the container's own edges, so the handle still
// lands fully visible on them.
test("the smileys fill the whole width the handle travels", () => {
  const inset = scaleEndInset(MARKER_SIZE);
  expect(inset, "the handle would hang off the card's edge").toBe(MARKER_SIZE / 2);
  expect(slide).toContain("const END_INSET = scaleEndInset(MARKER_SIZE);");
  expect(slide).toContain(`const SPAN = \`(100% - ${2 * inset}px)\`;`);
  // the first smiley's centre stands one handle-radius from the left edge…
  expect(slide).toContain(`const faceX = (i: number) => \`calc(${inset}px + `);
  // …and the circle at value 0 lands under it, at value 100 under the last one
  const markerLeft = slide.match(/const markerLeft = \(value: number\) => `([^`]+)`;/)?.[1] ?? "";
  expect(markerLeft, "the circle is not placed by the same inset and span").toBeTruthy();
  expect(markerLeft).toContain(`${inset}px`);
  expect(markerLeft).toContain("* ${SPAN} / 100");
  // the field no longer insets its own content to make room for the handle
  const field = css.match(/\.risiko-scale-field \{([\s\S]*?)\n\}/)?.[1] ?? "";
  expect(/padding:\s*0;/.test(field), "the field still insets its own content").toBe(true);
  expect(field).not.toMatch(/padding-(inline|left|right)/);
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

test("the dotted guides span the smileys, the rule and the names in one stretch", () => {
  const full = css.match(/\.risiko-guide-full \{([\s\S]*?)\n\}/)?.[1] ?? "";
  expect(/top:\s*0;/.test(full) && /bottom:\s*0;/.test(full), "a guide does not stretch the stack").toBe(true);
  // lighter than the smileys' own grey, and long enough to reach past the names
  const hex = (token) => css.match(new RegExp(`--${token}:\\s*#([0-9A-Fa-f]{6})`))?.[1]?.toLowerCase() ?? "";
  const lightness = (h) => parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
  const column = hex("risiko-column-line");
  expect(column, "the column lines have no colour of their own").toBeTruthy();
  expect(lightness(column), "the column lines are not softer than the smileys' guides").toBeGreaterThan(lightness(hex("risiko-line")));
});
