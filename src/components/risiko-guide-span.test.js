import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const FACES_COUNT = 5;

// The dotted guides no longer stop at the field's foot: they are drawn against a
// stack that holds the field *and* the column names, so a line runs from the
// smileys down past the last name. The names themselves paint over the line.
test("the dotted guides run from the smileys down past the column names", () => {
  const stack = slide.indexOf('className="risiko-scale-stack"');
  const guides = slide.indexOf('className="risiko-scale-guides');
  const columns = slide.indexOf('className="risiko-columns');
  const field = slide.indexOf('className="risiko-scale-field');
  const captions = slide.indexOf('className="risiko-scale-captions');
  expect(stack, "the scale has no stack").toBeGreaterThan(-1);
  // the two dashed families are drawn against the stack, before anything else,
  // so a line can never cover a smiley, a guide or the handle
  expect(guides, "the smiley guides are missing").toBeGreaterThan(stack);
  expect(columns, "the column lines are missing").toBeGreaterThan(stack);
  expect(guides).toBeLessThan(field);
  // ...and the field and the names live inside that same stack
  expect(field, "the field is missing").toBeGreaterThan(stack);
  expect(captions, "the column names are missing").toBeGreaterThan(field);
  // the chapter's own sentence box sits outside the stack: the lines must stop
  // with the names, not run down through the box
  expect(slide.indexOf("{below && (")).toBeGreaterThan(captions);
  // both families stretch the stack's full height, from the smileys' top edge to
  // the foot of the names, on screen and on paper alike
  const full = css.match(/\.risiko-guide-full \{([\s\S]*?)\n\}/)?.[1] ?? "";
  expect(full, "the guides have no full-height rule").toBeTruthy();
  expect(/top:\s*0;/.test(full), "the guides do not start at the stack's top").toBe(true);
  expect(/bottom:\s*0;/.test(full), "the guides do not reach the stack's foot").toBe(true);
  // one guide per smiley, one lighter line per pair of neighbours — and both
  // families carry the full-height rule
  expect(slide, "the smileys' guides are not drawn full height").toMatch(/className="risiko-column-guide risiko-guide-full/);
  expect(slide, "the column lines are not drawn full height").toMatch(/className="risiko-column-edge risiko-guide-full/);
  expect(slide.match(/FACES\.map\(\(_, i\) => <span key=\{`gu\$\{i\}`\}/)?.[0], "the guides are not drawn per smiley").toBeTruthy();
  expect(slide.match(/FACES\.slice\(0, -1\)\.map/)?.[0], "the column lines are not drawn per pair of neighbours").toBeTruthy();
  expect(/\.risiko-scale-stack \{[^}]*position: relative;/.test(css), "the stack is not a positioning parent").toBe(true);
});

test("the column names paint above the dotted lines that run through them", () => {
  expect(/\.risiko-scale-captions \{[^}]*position: relative;/.test(css), "the names do not paint above the lines").toBe(true);
  // the names are the last thing in the stack, so they draw over the lines
  const captions = slide.indexOf('className="risiko-scale-captions');
  const stackEnd = slide.indexOf("</div>", slide.indexOf("</div>", captions) + 1);
  expect(slide.slice(captions, stackEnd).includes("risiko-scale-stack"), "the stack closes before the names").toBe(false);
});

test("no dotted line draws through a smiley", () => {
  // The guides run the stack's whole height now, so they pass straight behind the
  // face row. Two things keep the smileys clean: the row is painted after both
  // dashed families, and every face carries a disc of the card's own surface
  // behind its outline, so a line reads as threaded behind the face.
  const guides = slide.indexOf('className="risiko-scale-guides');
  const columns = slide.indexOf('className="risiko-columns');
  const faceRow = slide.indexOf("<FaceLayer />");
  expect(faceRow, "the smiley row is missing").toBeGreaterThan(guides);
  expect(faceRow).toBeGreaterThan(columns);
  const face = css.match(/\.risiko-face \{([^}]*)\}/)?.[1] ?? "";
  expect(face, "the face has no rule of its own").toBeTruthy();
  expect(/background:\s*var\(--risiko-surface\)/.test(face), "the smiley has no plate of the card's surface").toBe(true);
  expect(/border-radius:\s*50%/.test(face), "the smiley's plate is not a disc").toBe(true);
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
