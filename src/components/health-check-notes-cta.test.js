import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const actionRow = readFileSync(new URL("./ActionRow.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The first two Health Check cards ("Wie geht's mir persönlich?" / "Wie geht's
 * mir in der Beziehung?"): user: "health check first 2 slides notes label
 * category green and close icon white" — the notes CTA's label reads the card's
 * own category green and the close X stays white on the green tile, in both the
 * normal view (pencil) and notes mode (Fertig).
 */
describe("Health Check notes CTA colours", () => {
  const CATEGORY_GREEN = "#0B7A35"; // BRAND.deepGreen — the Health Check cards' own green
  const GREY_FIELD = "#E4E6E8";     // --retro-textarea-bg, the label's plate

  const lum = (hex) => {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  test("the shared CTA lets a call site pick its own label colour", () => {
    expect(
      actionRow,
      "the label no longer reads through the opt-in override",
    ).toContain(
      '"var(--retro-action-label-override, var(--color-text-primary))"',
    );
  });

  test("the feeling cards' notes CTA labels read the category green", () => {
    const own = cards.slice(
      cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(own, "the label override is missing on the card's own row").toContain(
      "'--retro-action-label-override': labelColorOf(cardId)",
    );
    expect(own, "the pencil stopped reading white").toContain(
      "'--retro-action-icon-override': 'var(--risiko-face-fill)'",
    );
  });

  test("the notes-mode row keeps the green label and a white close X", () => {
    const overlay = cards.slice(
      cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(overlay, "the close X is not forced white on the green tile").toContain(
      "'--retro-action-icon-override': 'var(--risiko-face-fill)'",
    );
    expect(overlay, "the label override is missing in notes mode").toContain(
      "'--retro-action-label-override': labelColorOf(slideId)",
    );
    // only the two feeling cards opt in, so every sibling keeps its own look
    expect(overlay, "the override no longer covers exactly the two feeling cards").toContain(
      "(slideId === 1 || slideId === 2)",
    );
  });

  test("the green used for the label is the cards' own category green", () => {
    const helperStart = cards.indexOf("const labelColorOf = useCallback");
    const helper = cards.slice(
      helperStart,
      cards.indexOf("return BRAND.lightBlue;", helperStart),
    );
    expect(helper, "the feeling cards lost their green label colour").toContain(
      `return BRAND.deepGreen`,
    );
    const brand = cards.slice(cards.indexOf("const BRAND = {"), cards.indexOf("} as const"));
    const green = /deepGreen:\s*"(#[0-9A-Fa-f]{6})"/.exec(brand)?.[1];
    expect(green, "the palette lost its deep green").toBeTruthy();
    expect(green.toUpperCase()).toBe(CATEGORY_GREEN);
    expect(
      ratio(CATEGORY_GREEN, GREY_FIELD),
      "the green label no longer stands out on the grey field",
    ).toBeGreaterThanOrEqual(4);
  });
});
