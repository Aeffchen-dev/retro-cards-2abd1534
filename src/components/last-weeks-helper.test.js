import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case 3:"), src.indexOf("case 4:"));
const overlay = src.slice(src.indexOf("Edit/Close action row"), src.indexOf("Left navigation zone"));
const padding = src.slice(src.indexOf("retro-card-container relative w-full"), src.indexOf("Edit Mode View"));

describe("last 4 weeks card", () => {
  test("carries no info box any more", () => {
    expect(card, "the helper sentence is back").not.toContain("Klicke auf eine Frage um deine Notizen einzublenden");
    expect(card, "an info row is back on the card").not.toMatch(/icon="IconInfo"/);
    expect(card, "the card lost its headline").toContain("Was war die letzten 4 Wochen so los?");
  });

  test("shows the notes button in the card's bottom left corner", () => {
    // The shared corner overlay is no longer switched off for this card...
    expect(overlay, "the corner button is still hidden on this card").not.toMatch(/slideId !== 3/);
    // ...and the card keeps its bottom padding free for the button.
    expect(padding, "the card no longer reserves room for the corner button").not.toMatch(/slideId !== 3/);
    expect(padding, "the corner button has no room under the questions").toMatch(/paddingBottom:.*'72px'/);
  });

  test("keeps all six questions clickable", () => {
    expect(card, "a question row is no longer clickable").toContain("openQuestionEdit(3, i, String(label))");
    expect([...card.matchAll(/"Icon\w+"/g)].length, "the six question rows are not all there").toBe(6);
  });
});
