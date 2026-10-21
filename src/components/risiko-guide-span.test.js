import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

// The dotted guides no longer stop at the field's foot: they are drawn against a
// stack that holds the field *and* the column names, so a line runs from the
// smileys down past the last name. The names themselves paint over the line.
test("the dotted guides run from the smileys down past the column names", () => {
  const stack = slide.indexOf('<div className="risiko-scale-stack">');
  const guides = slide.indexOf('className="risiko-scale-guides');
  const columns = slide.indexOf('className="risiko-columns');
  const field = slide.indexOf('className="risiko-scale-field');
  const captions = slide.indexOf('className="risiko-scale-captions');
  expect(stack, "the scale has no stack").toBeGreaterThan(-1);
  // the two dashed families are drawn against the stack, before anything else,
  // so a line can never cover a smiley, a guide or the handle
  expect(guides, "the smiley guides are missing").toBeGreaterThan(stack);
  expect(columns, "the column dividers are missing").toBeGreaterThan(stack);
  expect(guides).toBeLessThan(field);
  // ...and the field and the names live inside that same stack
  expect(field, "the field is missing").toBeGreaterThan(stack);
  expect(captions, "the column names are missing").toBeGreaterThan(field);
  // the chapter's own sentence box sits outside the stack: the lines must stop
  // with the names, not run down through the box
  expect(slide.indexOf("{below && (")).toBeGreaterThan(captions);
  // both families stretch the stack's full height, from the smileys' top edge
  expect(/\.risiko-column-guide--long \{[^}]*bottom: 0;/.test(css), "the long guide does not reach the stack's foot").toBe(true);
  expect(/\.risiko-column-guide--stub \{ top: 0;/.test(css), "the stub does not start at the stack's top").toBe(true);
  expect(/\.risiko-scale-stack \{[^}]*position: relative;/.test(css), "the stack is not a positioning parent").toBe(true);
});

test("the column names paint above the dotted lines that run through them", () => {
  expect(/\.risiko-scale-captions \{[^}]*position: relative;/.test(css), "the names do not paint above the lines").toBe(true);
  // the names are the last thing in the stack, so they draw over the lines
  const captions = slide.indexOf('className="risiko-scale-captions');
  const stackEnd = slide.indexOf("</div>", slide.indexOf("</div>", captions) + 1);
  expect(slide.slice(captions, stackEnd).includes("risiko-scale-stack"), "the stack closes before the names").toBe(false);
});
