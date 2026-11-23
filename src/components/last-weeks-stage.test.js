import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * "The last 4 weeks" card already wore its approved pink fill, but the stage
 * behind it stayed the deck's dark backdrop (user: "last 4 weeks slide bg not
 * pink ... make pink like category pink"). The backdrop now follows the open
 * card and wears that card's own category pink while it is open.
 */
describe("the stage behind the Last 4 Weeks card", () => {
  test("wears the card's own category pink", () => {
    const pink = cards.match(/const STAGE_PINK_LAST_WEEKS = "[^"]+";/)?.[0] ?? "";
    expect(pink, "the stage pink constant is gone").toBeTruthy();
    expect(pink, "the stage no longer wears the card's category pink").toContain("#FF47D1");
  });

  test("is derived from the open card, so every other card keeps the dark backdrop", () => {
    const rule = cards.match(/const stageBg = [^;]+;/)?.[0] ?? "";
    expect(rule, "the stage background rule is gone").toBeTruthy();
    expect(rule, "the stage no longer keys off the open card").toContain("slides[currentCard] === 3");
    expect(rule, "the stage no longer falls back to the dark backdrop").toContain('"#201C1D"');
  });

  test("is the colour the backdrop layer actually paints", () => {
    const layer = cards.match(/className="pointer-events-none select-none absolute inset-0[^"]*"[\s\S]{0,200}?backgroundColor:\s*[^,]+,/)?.[0] ?? "";
    expect(layer, "the backdrop layer is gone").toBeTruthy();
    expect(layer, "the backdrop no longer paints the stage colour").toContain("backgroundColor: stageBg");
    expect(layer, "the backdrop paints a hard-coded colour again").not.toContain('"#201C1D"');
  });
});
