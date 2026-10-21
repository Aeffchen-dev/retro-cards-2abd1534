import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

// The scales carry no dashed lines any more: the smileys, the rule and the column
// names stand on their own, with nothing drawn behind them.
test("no dashed line is drawn on any scale", () => {
  // no dashed border anywhere in the deck's own stylesheet
  expect(css, "the stylesheet draws a dashed line again").not.toMatch(/border[^;]*dashed/);
  // the smileys' own guides and the column dividers are gone from the statement
  // scales, and so is the full-height rule they used to stretch on
  expect(slide, "a scale still draws a guide line").not.toMatch(/risiko-column-guide|risiko-column-edge/);
  expect(slide, "a scale still wraps its guides in a layer").not.toMatch(/risiko-scale-guides|risiko-columns|risiko-guide-full/);
  // the first two Health Check cards lost their dashed track too
  expect(cards, "a Health Check card still draws its dashed track").not.toMatch(/health-check-guide/);
  // the two greys that only ever painted those lines went with them
  expect(css, "--risiko-line survived its lines").not.toMatch(/--risiko-line:/);
  expect(css, "--risiko-column-line survived its lines").not.toMatch(/--risiko-column-line:/);
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

// The column names no longer wait at the field's foot: on screen they rise to
// stand just under the circle that rides the rule. The stack works that place out
// of the field's own live height — the taller of its basis and the floor the card
// hands it — less the circle's own radius and 4px of air. The printed sheet keeps
// the names where they have always stood.
test("the column names rise to just under the circle on screen", () => {
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

  // and the row rides up by exactly that lift — on screen only
  const liftRule = css.indexOf(".risiko-scale-stack .risiko-scale-captions { margin-top: calc(-1 * var(--risiko-caption-lift)); }");
  expect(liftRule, "the names never rise on screen").toBeGreaterThan(-1);
  const screenOpen = css.lastIndexOf("@media screen {", liftRule);
  expect(screenOpen, "the lift does not sit in the screen block").toBeGreaterThan(-1);
  expect(css.slice(screenOpen, liftRule).includes("\n}"), "the screen block closes before the lift").toBe(false);

  // the printed sheet is left alone: its fields are stretched over the card and
  // keep the names at their foot
  const printOpen = css.indexOf("@media print {");
  expect(printOpen, "there is no print block to check").toBeGreaterThan(-1);
  expect(css.slice(printOpen).includes("--risiko-caption-lift"), "the printed sheet must keep its own placement").toBe(false);
});
