import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case SLIDE_INTRO:"), src.indexOf("case SLIDE_SETUP:"));

const HEADLINE = "This monthly date night makes you click, feel heard and loved upgrades your relationship";
const BODY = "Eine monatliche Date Night, die eure Connection stärkt, Deep Talk der euch verbunden fühlen lässt und ganz nebenbei ein Upgrade für eure Beziehungsqualität.";

describe("intro card copy", () => {
  test("shows the supplied headline", () => {
    expect(card, "the headline is not the supplied one").toContain(`text="${HEADLINE}"`);
    expect(card, "the old headline is back").not.toContain("Stärkt eure Connection");
  });

  test("shows the supplied sentence as its only body text", () => {
    expect(card, "the body is not the supplied sentence").toContain(`<p>${BODY}</p>`);
    expect(card, "a body paragraph from the old copy is back").not.toContain("Retro Cards ist euer monatlicher Check-in");
    expect(card, "a body paragraph from the old copy is back").not.toContain("Ihr seid ein Team");
    // The typo in the supplied line ("eon Upgrade") is settled to the correct word.
    expect(card, "the typo is back").not.toContain("eon Upgrade");
  });

  test("keeps headline and body in one 320px column", () => {
    expect([...card.matchAll(/max-w-\[320px\]/g)].length, "the shared column width changed").toBe(2);
  });
});
