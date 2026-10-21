import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

/**
 * The Setup card keeps the measures it had before the deck's cards grew to fill the
 * slide (user: "make sure the card slider itself has the same max width and height
 * applied as it used to have yesterday also keep the ratio of width to height"):
 * at most 500px wide, at most 720px tall, and always in that 500:720 proportion.
 */
describe("Setup card keeps yesterday's measures and proportion", () => {
  test("the card is sized by its own class, not by a percentage of the slide", () => {
    const line = cards.match(/className=\{`retro-card-container[^\n]*\}/)?.[0] ?? "";
    expect(line, "the card container is missing").toBeTruthy();
    expect(line, "the Setup card is not sized by its own class").toContain('"retro-setup-card"');
    expect(line, "the Setup card is back on a percentage of the slide").not.toContain("h-[88%]");
    expect(line, "every other card no longer fills the slide").toContain(': "flex-1"');
  });

  test("the caps are yesterday's 500px width and 720px height", () => {
    const block = css.match(/\.retro-setup-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(block, ".retro-setup-card missing from index.css").toBeTruthy();
    expect(block, "the height no longer stops at yesterday's 720px").toMatch(
      /--setup-h:\s*min\([^)]*720px[^)]*\)/,
    );
    expect(block, "the width no longer stops at yesterday's 500px").toMatch(
      /--setup-w:\s*min\([^)]*500px[^)]*\)/,
    );
    // the room the stage actually leaves: the window less the deck's 32px of chrome
    // and the pill's 40px row above the card
    expect(block, "the card no longer respects the room the stage leaves it").toMatch(
      /--setup-h:\s*min\(\s*100vh\s*-\s*72px/,
    );
  });

  test("both axes are derived from the same 500:720 proportion", () => {
    const block = css.match(/\.retro-setup-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    const wRatio = block.match(/--setup-w:[^;]*\*\s*(\d+)\s*\/\s*(\d+)/);
    const hRatio = block.match(/height:\s*min\([^;]*\*\s*(\d+)\s*\/\s*(\d+)/);
    expect(wRatio, "the width is not derived from the height").toBeTruthy();
    expect(hRatio, "the height is not derived from the width").toBeTruthy();
    // 500 wide to 720 tall reduces to 25:36 — the card may never be wider or squatter
    expect(`${wRatio[1]}/${wRatio[2]}`, "the width's proportion changed").toBe("25/36");
    expect(`${hRatio[1]}/${hRatio[2]}`, "the height's proportion changed").toBe("36/25");
    expect(500 / 720, "500:720 is not 25:36").toBeCloseTo(25 / 36, 10);
  });

  test("the desktop ceiling joins the same min() so the two rules agree", () => {
    const desktop = css.slice(css.indexOf("@media screen and (min-width: 1024px)"));
    expect(desktop, "the Setup card does not take the desktop ceiling").toMatch(
      /\.retro-setup-card \{[\s\S]*?--setup-cap:\s*min\(88vh,\s*940px\)/,
    );
    const block = css.match(/\.retro-setup-card \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(block, "the ceiling is not part of the height's min()").toContain("var(--setup-cap)");
  });

  test("on a desktop window every card stops at 88% of the stage, as it did before it grew", () => {
    const desktop = css.slice(css.indexOf("@media screen and (min-width: 1024px)"));
    const block = desktop.match(/\.retro-card-container \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(block, "the desktop ceiling for the cards is missing").toBeTruthy();
    /* The card is measured against the stage the slide hands it, not against the
       window (user: "on desktop the card is way bigger on then background than
       yeasterday" — and the answer to "how much smaller?" was "Wie gestern:
       88 % der Bühne"). */
    expect(block, "the card no longer stops at 88% of the stage").toMatch(/max-height:\s*min\(\s*88%/);
    expect(block, "the card is measured off the window again").not.toMatch(/88vh/);
  });
});
