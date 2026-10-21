import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

// The scales' column lines are back, drawn with a normal stroke: a solid guide
// down each smiley's own column, solid dividers between neighbouring columns, and
// a solid six-line track on the first two Health Check cards. Nothing is dashed.
test("every scale line is drawn with a solid stroke", () => {
  // no dashed border anywhere in the deck's own stylesheet
  expect(css, "the stylesheet draws a dashed line again").not.toMatch(/border[^;]*dashed/);
  // the statement scales draw one guide per smiley column and one divider between
  // every pair of neighbouring columns, each stretching the stack's whole height
  expect(slide, "the statement scale draws no guides").toMatch(/risiko-column-guide risiko-guide-full/);
  expect(slide, "the statement scale draws no dividers").toMatch(/risiko-column-edge risiko-guide-full/);
  // the work-split lane keeps the same drawn columns, on its own even grid
  expect(slide, "the work-split lane draws no dividers").toMatch(/columnEdges\(FACES\.length\)/);
  expect(slide, "the work-split lane draws no guides").toMatch(/left: lanePos\(i\)/);
  // the first two Health Check cards draw their track again
  expect(cards, "a Health Check card lost its track").toMatch(/className="health-check-guides"/);
  // and every one of those lines is a normal stroke in the scale's own two greys
  const guide = css.match(/\.risiko-column-guide \{[\s\S]*?\}/)?.[0] ?? "";
  expect(guide, "the guide is not a solid line").toMatch(/border-left:\s*1px solid var\(--risiko-line\)/);
  const edge = css.match(/\.risiko-column-edge \{[\s\S]*?\}/)?.[0] ?? "";
  expect(edge, "the divider is not a solid line").toMatch(/border-left:\s*1px solid var\(--risiko-column-line\)/);
  const track = css.match(/\.health-check-guide \{[\s\S]*?\}/)?.[0] ?? "";
  expect(track, "the Health Check track is not a solid line").toMatch(/border-top:\s*1px solid var\(--risiko-column-line\)/);
});

// The smileys' own guides no longer run up through the faces: they open where the
// face row ends and run down through the rule from there.
test("the smiley guides open under the faces, not through them", () => {
  const field = slide.indexOf('className="risiko-scale-field');
  const faces = slide.indexOf("<FaceLayer />");
  const guides = slide.search(/className="risiko-scale-guides[\s\S]{0,200}top: "calc\(var\(--risiko-face-size\)/);
  expect(guides, "the guides do not open under the face row").toBeGreaterThan(-1);
  // they live inside the field, painted before the rule and the circle
  expect(guides, "the guides no longer live inside the field").toBeGreaterThan(field);
  expect(guides, "the guides are painted after the faces").toBeLessThan(faces);
  // the line starts exactly where the field's own padding-top puts the face row's
  // foot, and keeps running down to the field's own bottom edge
  expect(slide).toMatch(/className="risiko-scale-guides[\s\S]{0,200}top: "calc\(var\(--risiko-face-size\) \+ 4px\)", bottom: 0/);
  expect(slide, "the smileys' guides are gone").toMatch(/risiko-column-guide risiko-guide-full/);
});

test("the column names still stand under the field in their own row", () => {
  const stack = slide.indexOf('className="risiko-scale-stack"');
  const field = slide.indexOf('className="risiko-scale-field');
  const captions = slide.indexOf('className="risiko-scale-captions');
  expect(stack, "the scale has no stack").toBeGreaterThan(-1);
  // the field and the names live inside that same stack
  expect(field, "the field is missing").toBeGreaterThan(stack);
  expect(captions, "the column names are missing").toBeGreaterThan(field);
  // the chapter's own sentence box sits outside the stack
  expect(slide.indexOf("{below && (")).toBeGreaterThan(captions);
  expect(/\.risiko-scale-stack \{[^}]*position: relative;/.test(css), "the stack is not a positioning parent").toBe(true);
});

// The column names no longer wait at the field's foot or under the circle: they
// open the scale, standing above the smileys on screen and on paper alike. The
// stack puts that row first, so each name reads before the face it belongs to.
test("the column names stand above the smileys", () => {
  // the field's floor rides on the stack as a token: custom properties only
  // travel downwards, so the field cannot tell its own parent how tall it stands
  expect(slide, "the field's floor never reaches the stack")
    .toMatch(/className="risiko-scale-stack"[^>]*--risiko-field-min/);
  expect(slide, "the field lost its own floor")
    .toMatch(/className="risiko-scale-field[^"]*" style=\{\{ minHeight: fieldMin \?\? FIELD_MIN \}\}/);

  const stack = css.match(/\.risiko-scale-stack \{([\s\S]*?)\n\}/)?.[1] ?? "";
  expect(stack, "the stack does not know the field's live height")
    .toMatch(/--risiko-field-live:\s*max\(var\(--risiko-field-h\),\s*var\(--risiko-field-min,\s*0px\)\)/);
  // the lift is the room under the rule, less the circle's radius, less 4px of air
  expect(stack, "the names' lift does not stop short of the circle")
    .toMatch(/--risiko-caption-lift:\s*max\(0px,\s*calc\(\(var\(--risiko-field-live\) - var\(--risiko-face-size\) - 4px\) \/ 2 - var\(--risiko-marker-size\) \/ 2 - 4px\)\)/);

  // the circle wears the same token the lift is read from, so the gap under the
  // rule can never drift away from the dot's real size
  expect(css, "the dot does not wear its own size token")
    .toMatch(/\.risiko-expression-point \{[\s\S]*?width:\s*var\(--risiko-marker-size\)/);
  expect(css, "the dot's token is not the 44px the scale draws").toMatch(/--risiko-marker-size:\s*44px/);

  // and the row opens the stack — above the smileys, on screen and on paper
  const orderRule = css.match(/\.risiko-scale-stack \.risiko-scale-captions \{([\s\S]*?)\n\}/)?.[1] ?? "";
  expect(orderRule, "the names no longer open the scale").toMatch(/order:\s*-1/);
  expect(orderRule, "the names no longer keep a gap above the smileys").toMatch(/margin-bottom:/);

  // the printed sheet is left alone: its fields are stretched over the card and
  // keep the names at their foot
  const printOpen = css.indexOf("@media print {");
  expect(printOpen, "there is no print block to check").toBeGreaterThan(-1);
  expect(css.slice(printOpen).includes("--risiko-caption-lift"), "the printed sheet must keep its own placement").toBe(false);
});
