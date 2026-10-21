import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const slide = readFileSync(new URL("./VorhabenSlide.tsx", import.meta.url), "utf8");

describe("Vorhaben card carries the next-retro sentence and sits before Takeaways", () => {
  test("shows \"Ideas\" above the card and the next-retro sentence as its heading", () => {
    const pills = src.slice(src.indexOf("const SLIDE_PILLS"), src.indexOf("};", src.indexOf("const SLIDE_PILLS")));
    // The short word above the card, the full sentence inside it.
    expect(pills).toContain('104: "Ideas"');
    expect(pills).not.toContain("Vorhaben");
    expect(pills).not.toContain("Das nehmen wir uns");
    expect(slide).toContain('text="Das nehmen wir uns bis zur nächsten Retro vor"');
    expect(slide).not.toContain('text="Vorhaben"');
  });

  test("comes directly before the Takeaways card and after Intimacy", () => {
    const deck = src.slice(src.indexOf("const arr: number[]"), src.indexOf("}, [setupData.openRelationship"));
    // Intimacy (7), then Ideas, then Takeaways (8), Archive (9), Questions (10).
    expect(deck).toContain("arr.push(7, SLIDE_VORHABEN, 8, 9, 10)");
    // It is no longer tucked between Feedback and "To talk about".
    expect(deck).not.toContain("SLIDE_REFLECTION, SLIDE_VORHABEN");
    // Nothing was dropped on the way: all ten numbered cards plus the four fixed ones.
    for (const id of ["0", "1", "2", "3", "4", "7", "8", "9", "10", "SLIDE_REFLECTION", "SLIDE_VORHABEN", "SLIDE_LOGO", "SLIDE_INTRO", "SLIDE_SETUP"]) {
      expect(deck, `card ${id} vanished from the deck`).toContain(id);
    }
  });
});
