import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const hearts = readFileSync(new URL("./StarRating.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

const QUESTION = "Wie zufrieden bist du mit unserem Sex?";

/** Reads a single rule body out of the stylesheet by its selector. */
function ruleBody(selector) {
  const start = css.indexOf(selector);
  expect(start, `${selector} is in the stylesheet`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
}

/**
 * The Intimacy card answers its question with hearts: a chosen heart wears the
 * card's own pink, hovering never paints a grey tile behind one, and the
 * sentence naming what is being rated stands above the row.
 */
describe("Intimacy heart rating", () => {
  test("the control draws hearts, not stars", () => {
    expect(hearts).toMatch(/import \{ Heart \} from "lucide-react";/);
    expect(hearts, "no star icon is left in the control").not.toMatch(/Star(?!(Rating|s))/);
  });

  test("a chosen heart fills with the card's pink", () => {
    const rule = ruleBody('.intimacy-star[data-filled="true"] svg {');
    expect(rule, "the fill is the card's pink").toMatch(/fill:\s*var\(--intimacy-accent\);/);
    expect(rule, "a chosen heart is no longer plain ink").not.toMatch(/fill:\s*currentColor/);
  });

  test("hovering a heart paints no grey tile", () => {
    const rule = ruleBody(".intimacy-rating .intimacy-star:hover {");
    expect(rule, "the ghost button's grey hover plate is suppressed").toMatch(/background:\s*transparent;/);
    expect(rule, "the hover still previews the pink").toMatch(/color:\s*var\(--intimacy-accent\);/);
  });

  test("the question stands above the hearts", () => {
    const card = cards.slice(cards.indexOf("case 7:"), cards.indexOf("case 8:"));
    expect(card, "the card asks its question").toContain(QUESTION);
    expect(card.indexOf(QUESTION), "the sentence sits above the rating").toBeLessThan(card.indexOf("<StarRating"));
  });
});
