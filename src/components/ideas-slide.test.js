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

describe("Ideas card wears the Questions combo", () => {
  test("its pill and label bars come from the same random combo as the Questions card", () => {
    const pill = src.slice(src.indexOf("const pillColorOf"), src.indexOf("const labelColorOf"));
    // One branch covers Ideas and Questions: the combo's square colour.
    expect(pill).toContain("slideId === SLIDE_VORHABEN || slideId === 10");
    expect(pill).toContain("QUESTION_COMBOS[questionComboIdx % QUESTION_COMBOS.length].square");
    // Feedback keeps its own blue; Ideas no longer shares it.
    expect(pill).toContain("if (slideId === SLIDE_REFLECTION) return BRAND.spiralBlue;");
    expect(pill).not.toContain("SLIDE_REFLECTION || slideId === SLIDE_VORHABEN");

    // The helper's own block only — its closing sits on two lines, so a plain
    // indexOf would run the slice on through the rest of the component.
    const label = src.match(/const labelColorOf = useCallback\([\s\S]*?\n  \);/)?.[0] ?? "";
    expect(label, "the label helper is gone").toBeTruthy();
    // Ideas no longer follows the combo here: its bars carry a fixed neon, so the
    // helper keeps only the cards whose labels still ride the random draw.
    expect(label).not.toContain("slideId === SLIDE_VORHABEN");
    expect(label).toContain("if (slideId === SLIDE_REFLECTION) return BRAND.babyBlue;");
  });

  test("the slide takes both colours as props so dark labels stay readable", () => {
    expect(src).toContain("pillColor={pillColorOf(SLIDE_VORHABEN)}");
    // The bars wear the deck's neon pink rather than the random combo's lime, and
    // wear it unpale: the card passes it as the bar's own colour so the neon
    // survives, while the writing field underneath keeps the lightened tint.
    expect(src).toContain('labelColor="#FF47D1"');
    expect(slide).toContain("barColor={labelColor}");
    // Passed to the writing fields as a real colour, not a CSS var, so the
    // label bar's contrast lightening can still see it.
    expect(slide).toContain("accent={labelColor}");
    expect(slide).toContain('color={pillColor}');
    expect(slide).not.toContain('accent="var(--vorhaben-label)"');
  });
});
});
