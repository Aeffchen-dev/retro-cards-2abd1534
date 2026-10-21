import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

/**
 * One measure for the whole deck (user: "each card in slider should have same
 * measurements (use the ones from yesterday)"): every card takes the height the
 * slide offers and stops at 88% of it. No card — the Setup card included — may
 * stand taller or shorter than its neighbours, and none may be sized by a rule
 * of its own.
 */
describe("every card in the deck wears the same measures", () => {
  test("the shared container caps the height at 88% of the slide", () => {
    const line = cards.match(/className=\{`retro-card-container[^\n]*\}/)?.[0] ?? "";
    expect(line, "the card container is missing").toBeTruthy();
    expect(line, "the cards no longer cap at 88% of the slide").toContain("max-h-[88%]");
    // the cap only reads as a share of the slide if the card first takes the room
    // the slide offers — that is what the percentage is measured against
    expect(line, "the cards no longer fill the slide before the cap").toContain("flex-1");
    expect(line, "a card is sized by a rule of its own again").not.toMatch(/SLIDE_\w+ \?/);
  });

  test("the Setup card has no measure of its own", () => {
    expect(cards, "the Setup card still carries its own size class").not.toContain("retro-setup-card");
    expect(css, "the Setup card's own size rule is back in index.css").not.toContain(".retro-setup-card");
  });

  test("no rule caps one group of cards shorter than the rest", () => {
    // the desktop-only ceiling that pulled the wide cards to 63% is gone: the 88%
    // cap on the container is the single ceiling every card shares
    expect(css, "a desktop-only ceiling is pulling some cards shorter again")
      .not.toMatch(/max-height:\s*min\(\s*\d+%/);
    // and the cap is a share of the slide, never of the window
    expect(css, "a card is measured off the window instead of the slide")
      .not.toMatch(/max-height:\s*\d+vh/);
  });
});
