import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case 1:"), src.indexOf("case 3:"));
const chrome = src.slice(src.indexOf("Edit/Close action row"), src.indexOf("Left navigation zone"));

describe("Health Check smiley scale", () => {
  test("the notes button comes first and the helper sentence reads under it", () => {
    // One stack at the card's own padding: button on top, info box below it.
    const stack = card.slice(card.indexOf("bottom: '28px'"), card.indexOf("Zieht euer Emoji"));
    expect(stack, "the notes button is not the first row of the stack").toContain("Macht Notizen");
    expect(card, "the helper row still stands above the button").not.toContain("bottom: '80px'");
    // The shared overlay no longer paints a second button on these two cards.
    expect(chrome).toContain("slideId !== 1");
    expect(chrome).toContain("slideId !== 2");
    expect(chrome).toContain("bottom: '28px'"); // still the card's own padding on the other cards
  });
});
