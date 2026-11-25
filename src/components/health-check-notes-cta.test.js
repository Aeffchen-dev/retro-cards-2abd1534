import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const actionRow = readFileSync(new URL("./ActionRow.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const postIt = readFileSync(new URL("./PostItField.tsx", import.meta.url), "utf8");

/**
 * The first two Health Check cards ("Wie geht's mir persönlich?" / "Wie geht's
 * mir in der Beziehung?"): user: "health check CTa label black but textarea
 * label notes category green" — the notes/Fertig CTA's label reads the deck's
 * usual black again while its glyph stays white on the green tile, and the
 * category green moved to the notes textarea's own label bar.
 */
describe("Health Check notes CTA colours", () => {
  const CATEGORY_GREEN = "#0B7A35"; // BRAND.deepGreen — the Health Check cards' own green
  const GREY_FIELD = "#E4E6E8";     // --retro-textarea-bg, the label's plate
  const WHITE = "#FFFFFF";

  const OWN_ROW = 'label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}';
  const OVERLAY_ROW = 'label={editModeSlides[slideId] ? "Fertig" : slideId === 8 ? "Auswerten" : "Notizen öffnen"}';

  const lum = (hex) => {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  // a call site's own attributes, up to the end of its JSX element
  const rowSlice = (marker) => {
    const start = cards.indexOf(marker);
    expect(start, `the call site "${marker}" is gone`).toBeGreaterThan(-1);
    return cards.slice(start, cards.indexOf("/>", start));
  };

  // a helper's own body, up to its closing ");"
  const fnSlice = (marker) => {
    const start = cards.indexOf(marker);
    expect(start, `the helper "${marker}" is gone`).toBeGreaterThan(-1);
    return cards.slice(start, cards.indexOf("\n  );", start));
  };

  test("the shared CTA still lets a call site pick its own label colour", () => {
    expect(
      actionRow,
      "the label no longer reads through the opt-in override",
    ).toContain(
      '"var(--retro-action-label-override, var(--color-text-primary))"',
    );
  });

  test("the feeling cards' CTA labels stopped reading the category green", () => {
    const own = rowSlice(OWN_ROW);
    const overlay = rowSlice(OVERLAY_ROW);
    expect(own, "the card's own CTA label is still painted green").not.toContain(
      "--retro-action-label-override",
    );
    expect(overlay, "the notes-mode CTA label is still painted green").not.toContain(
      "--retro-action-label-override",
    );
    // with no override the label falls back to the deck's own ink
    expect(actionRow).toContain(
      '"var(--retro-action-label-override, var(--color-text-primary))"',
    );
  });

  test("the feeling cards keep a white glyph on their green tile", () => {
    const own = rowSlice(OWN_ROW);
    const overlay = rowSlice(OVERLAY_ROW);
    expect(own, "the pencil stopped reading white").toContain(
      "'--retro-action-icon-override': 'var(--risiko-face-fill)'",
    );
    expect(overlay, "the close X is not forced white on the green tile").toContain(
      "'--retro-action-icon-override': 'var(--risiko-face-fill)'",
    );
    // only the two feeling cards opt in, so every sibling keeps its own look
    expect(overlay, "the override no longer covers exactly the two feeling cards").toContain(
      "(slideId === 1 || slideId === 2",
    );
  });

  test("the notes textarea's label bar wears the cards' own category green", () => {
    const helper = fnSlice("const notesBarColors = useCallback");
    expect(helper, "the notes label bar lost its category green").toContain(
      "barColor: labelColorOf(slideId)",
    );
    expect(helper, "the notes label bar is not limited to the two feeling cards").toContain(
      "(slideId === 1 || slideId === 2",
    );
    expect(
      cards,
      "the notes fields stopped using the bar colours",
    ).toContain("{...notesBarColors(slideId)}");
    expect(postIt, "the label bar no longer takes a colour of its own").toContain(
      "backgroundColor: barColor ?? readableBg(accent)",
    );
  });

  test("the words on that green bar read white, because black only reaches 3.1:1", () => {
    const helper = fnSlice("const notesBarColors = useCallback");
    expect(helper, "the label words are not forced white").toContain(
      'labelTextColor: "#FFFFFF"',
    );
    expect(postIt, "the label words ignore the colour the caller picked").toContain(
      "color: labelTextColor ?? TEXT",
    );
    expect(
      ratio(WHITE, CATEGORY_GREEN),
      "white words no longer stand on the category green",
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      ratio("#201C1D", CATEGORY_GREEN),
      "black words would now be readable on the green bar",
    ).toBeLessThan(4.5);
  });

  test("the green used for the bar is the cards' own category green", () => {
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
      "the green no longer stands out on the grey field",
    ).toBeGreaterThanOrEqual(4);
  });
});
