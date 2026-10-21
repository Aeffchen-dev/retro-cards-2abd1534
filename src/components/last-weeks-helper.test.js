import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case 3:"), src.indexOf("case 4:"));
const overlay = src.slice(src.indexOf("Edit/Close action row"), src.indexOf("Left navigation zone"));
const padding = src.slice(src.indexOf("retro-card-container relative"), src.indexOf("Edit Mode View"));

describe("last 4 weeks card", () => {
  test("carries no info box any more", () => {
    expect(card, "the helper sentence is back").not.toContain("Klicke auf eine Frage um deine Notizen einzublenden");
    expect(card, "an info row is back on the card").not.toMatch(/icon="IconInfo"/);
    expect(card, "the card lost its headline").toContain("Was war die letzten 4 Wochen so los?");
  });

  test("has no notes button in normal view — the corner belongs to the last question", () => {
    // The shared corner overlay is switched off for this card until its notes are open...
    expect(overlay, "the notes CTA is back on the card").toMatch(/!\(slideId === 3 && !editModeSlides\[slideId\]\)/);
    // ...and the card stops reserving room for it, so the six rows run down to the corner.
    expect(padding, "the card still holds 72px free for a button that is not there").toMatch(/!\(slideId === 3 && !editModeSlides\[slideId\]\)/);
    expect(padding, "the corner button's padding rule is gone from the other cards").toMatch(/paddingBottom:.*'72px'/);
  });

  test("keeps all six questions clickable", () => {
    expect(card, "a question row is no longer clickable").toContain("openQuestionEdit(3, i, String(label))");
    expect([...card.matchAll(/"Icon\w+"/g)].length, "the six question rows are not all there").toBe(6);
  });

  test("paints the close icon in the card's own rosa", () => {
    // Only the X: the tile keeps the card's pill colour.
    expect(overlay, "the X is not rosa any more")
      .toMatch(/iconColor=\{slideId === 3 && editModeSlides\[slideId\] \? labelColorOf\(3\)/);
    // The rosa is the card's own label colour, the one the field labels wear.
    expect(src.match(/if \(slideId === 3\) return "(#[0-9A-Fa-f]{6})"/)?.[1]).toBe("#F39FFF");
  });
});
