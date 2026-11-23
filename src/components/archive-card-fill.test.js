import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The Archive card used to take its fill from the position-based background
 * list, so a connected session plus "Nicht monogam" — which pushes two more
 * cards in front of it — could drop it onto the list's pink entry
 * (user: "archive slide no pink bg"). Its fill is now pinned white.
 */
describe("the Archive card never wears a pink fill", () => {
  test("its own background is forced white in the card style", () => {
    const style = cards.match(/const cardStyle = \{[^}]*backgroundColor:[^,]*/)?.[0] ?? "";
    expect(style, "the card style is gone").toBeTruthy();
    expect(style, "the Archive card no longer forces a white fill").toContain("slideId === 9");
  });

  test("the pink entry that used to reach it is still the list's first colour", () => {
    const list = cards.match(/const CARD_BACKGROUNDS = \[[\s\S]*?\];/)?.[0] ?? "";
    expect(list, "the background list is gone").toBeTruthy();
    // The list's first slot is the pink one; the card may never land on it again.
    expect(list, "the list's first colour changed").toContain("#F39FFF");
    expect(
      cards.match(/const cardStyle = \{[^}]*backgroundColor:[^,]*/)?.[0] ?? "",
      "the Archive card is back on the position-based fill"
    ).toContain("slideId === 9");
  });
});
