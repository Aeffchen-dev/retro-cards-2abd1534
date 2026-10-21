import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { scaleEndInset } from "./risiko-data";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
// The handle's own size lives in the component; the scale's ends stand one radius in.
const MARKER_SIZE = Number(slide.match(/const MARKER_SIZE = (\d+);/)?.[1] ?? 0);

// The five columns are equal fifths of the scale (user: "graph columns make even
// wide"): every smiley stands in the middle of its own fifth, the drawn lines fall
// on the fifths' borders, and the circle's travel stops half a column inside each
// end — the price of even columns is that the outer smileys no longer sit flush with
// the card's edge. The handle still lands fully visible on the outermost faces.
test("the smileys stand in the middle of five equal columns", () => {
  expect(MARKER_SIZE, "the handle's size is not where the scale expects it").toBe(44);
  const inset = scaleEndInset(MARKER_SIZE);
  expect(inset, "the handle would hang off the card's edge").toBe(MARKER_SIZE / 2);
  // one fifth per column, the travel stopping half a fifth inside each end
  expect(slide).toContain("const END_INSET = scaleEndInset(MARKER_SIZE);");
  expect(slide).toContain("const COLUMN = 100 / FACES.length;");
  expect(slide).toContain("const TRAVEL_INSET = COLUMN / 2;");
  expect(slide).toContain("const TRAVEL = 100 - 2 * TRAVEL_INSET;");
  // a smiley's centre is its own column's middle…
  expect(slide).toContain("const faceX = (i: number) => `${TRAVEL_INSET + i * COLUMN}%`;");
  // …and the circle is placed on the very same fifths, so value 0 lands under the
  // first smiley and value 100 under the last one.
  const markerLeft = slide.match(/const markerLeft = \(value: number\) => `([^`]+)`;/)?.[1] ?? "";
  expect(markerLeft, "the circle is not placed on the same fifths").toBeTruthy();
  expect(markerLeft).toContain("${TRAVEL_INSET}%");
  expect(markerLeft).toContain("* ${TRAVEL / 100}%");
  // the drawn columns are the fifths' borders, and the names' row is a five-column
  // grid of the same fifths, so grid, faces, circle and labels all agree
  expect(slide).toContain("const edgeX = (i: number) => `${(i + 1) * COLUMN}%`;");
  const captions = (css.match(/\.risiko-scale-stack \.risiko-scale-captions \{([\s\S]*?)\n\}/g) ?? [])
    .find((block) => block.includes("grid-template-columns")) ?? "";
  expect(captions, "the names no longer stand in five equal columns").toMatch(/grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  // the field neither insets its content sideways nor pads its head: the rule is
  // centred in the field's own box and the smiley row hangs above it
  expect(css, "the field still insets its content horizontally").not.toMatch(/\.risiko-scale-field \{[^}]*padding-(inline|left|right)/);
  expect(/\.risiko-scale-field \{[^}]*padding-top:\s*0/.test(css), "the field still pads room for its smiley row").toBe(true);
});

test("a press anywhere on the field places the circle by the same ends", () => {
  // The container's own handler converts a pointer position into a value. It has
  // to use the very fifths the smileys stand on, or a press beside the outermost
  // smiley would answer something other than that smiley.
  const from = slide.match(/const from = ([^;]+);/)?.[1] ?? "";
  const travel = slide.match(/const travel = ([^;]+);/)?.[1] ?? "";
  expect(from, "the press maths does not start at the outer smiley").toContain("TRAVEL_INSET");
  expect(travel, "the press maths does not end at the outer smiley").toContain("TRAVEL");
});

