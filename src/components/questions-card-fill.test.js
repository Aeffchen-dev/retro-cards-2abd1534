import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The Questions card is the deck's last card (user: "last slide card no pink
 * fill"). Its fill used to come from the position-based background list, so a
 * partner joining — which pushes two cards in front of it — could drop it onto
 * the list's pink entry. Its fill is now pinned white wherever it sits.
 */
describe("the Last 4 Weeks card and its notes share the approved pink", () => {
  test("its background is pinned to #F39FFF instead of its deck position", () => {
    const style = cards.match(/const cardStyle = \{[^}]*backgroundColor:[^,]*/)?.[0] ?? "";
    expect(style, "the card style is gone").toBeTruthy();
    expect(style).toContain("slideId === 3 ? '#F39FFF'");
  });

  test("the notes overlay reuses that exact card style", () => {
    const notes = cards.match(/<div className="absolute inset-0[^>]*style=\{\{ \.\.\.cardStyle, paddingBottom: '76px' \}\}/)?.[0] ?? "";
    expect(notes, "the notes overlay no longer inherits the card background").toBeTruthy();
  });
});

describe("the Questions card never wears a pink fill", () => {
  test("its own background is forced white in the card style", () => {
    const style = cards.match(/const cardStyle = \{[^}]*backgroundColor:[^,]*/)?.[0] ?? "";
    expect(style, "the card style is gone").toBeTruthy();
    expect(style, "the Questions card no longer forces a white fill").toContain("slideId === 10");
  });

  test("its theme no longer reads the position-based background list", () => {
    const theme = cards.match(/const theme = ov \?[^;]*;/)?.[0] ?? "";
    expect(theme, "the theme line is gone").toBeTruthy();
    expect(theme, "the Questions card no longer overrides its own background").toContain("slideId === 10");
    expect(theme, "the Questions card no longer overrides with white").toContain("bg: BRAND.white");
  });

  test("the pink entry that used to reach it is still the list's first colour", () => {
    const list = cards.match(/const CARD_BACKGROUNDS = \[[\s\S]*?\];/)?.[0] ?? "";
    expect(list, "the background list is gone").toBeTruthy();
    // The list's first slot is the pink one; the card may never land on it again.
    expect(list, "the list's first colour changed").toContain('#F39FFF');
    expect(cards.match(/const cardStyle = \{[^}]*backgroundColor:[^,]*/)?.[0] ?? "",
      "the Questions card is back on the position-based fill").toContain("slideId === 10");
  });
});
