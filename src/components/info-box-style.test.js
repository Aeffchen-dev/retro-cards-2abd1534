import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const risiko = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const actionRow = readFileSync(new URL("./ActionRow.tsx", import.meta.url), "utf8");

/**
 * The info box (ℹ + helper sentence) is a footnote, not a tile: grey text, no
 * fill, and a grey hairline above it. Every info row shares the `retro-info-row`
 * hook the shared CTA row adds, so the rules live once in the stylesheet and the
 * call sites only hand transparent fills and the grey text token.
 */
describe("info box appearance", () => {
  test("the grey text and hairline tokens are defined", () => {
    expect(css).toMatch(/--retro-info-text:\s*#6E7078;/);
    expect(css).toMatch(/--retro-info-rule:\s*#C9CBD1;/);
  });

  test("the row draws a grey border above its own text and no fill", () => {
    const rule = css.slice(css.lastIndexOf(".retro-info-row {"), css.indexOf("}", css.lastIndexOf(".retro-info-row {")));
    expect(rule, "a grey hairline sits above the sentence").toMatch(
      /border-top:\s*1px solid var\(--retro-info-rule\);/,
    );
    expect(rule, "the line runs the card's whole content width").toMatch(/width:\s*100%;/);
    // user: "INFO TEXT TOPPADDING ONLY 8PX" and "gap top border info text to CTA
    // same as info text top padding" — the hairline keeps one small breath above
    // the letters, and the button above keeps exactly that much over the hairline.
    expect(rule, "the hairline keeps the note's own breath above the letters").toMatch(
      /padding-top:\s*var\(--retro-info-gap\);/,
    );

    expect(rule, "the border never squeezes the label").toMatch(/height:\s*auto;/);
    expect(rule, "the box carries no background of its own").not.toMatch(/background/);
  });

  test("the note keeps one 8px breath in all three of its places", () => {
    // user: "gap top border info text to CTA same as info text top padding" and
    // "info I gap to text 8px" — a single token sets the hairline's breath above
    // the letters, the button's breath over the hairline and the ℹ mark's breath
    // over its sentence, so the three can never drift apart.
    expect(css, "the note's breath is not its own token").toMatch(/--retro-info-gap:\s*8px;/);
    expect(css, "the mark does not stand the same breath from its sentence").toMatch(
      /\.retro-info-row > span \+ span \{\s*padding-left:\s*var\(--retro-info-gap\);?\s*\}/,
    );
    const stacks = [
      ["the Risikofaktoren footer", risiko],
      ["the Health Check stack", cards],
    ];
    for (const [where, src] of stacks) {
      expect(src, `the button in ${where} does not stand the note's breath over the hairline`).toContain(
        "gap-[var(--retro-info-gap)]",
      );
    }
  });

  test("the i inside the ℹ mark reads darker and heavier than its ring", () => {
    // user: "i in info I darker if thicker" — the letter is only a few pixels
    // tall, so it wears its own darker ink and a heavier pen than the circle.
    expect(css, "the letter's own ink is missing").toMatch(/--retro-info-ink:\s*#3F4147;/);
    const mark = css.match(/\.retro-info-mark path \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(mark, "the letter does not wear the darker ink").toMatch(/stroke:\s*var\(--retro-info-ink\);/);
    expect(mark, "the letter is not drawn with a heavier pen").toMatch(/stroke-width:\s*3;/);
    expect(actionRow, "the mark is not handed its own hook").toMatch(
      /className=\{isInfo \? "retro-info-mark"/,
    );
  });

  test("the sentence keeps the card's padding under itself", () => {
    // user: "card padding is also applies as margin-bottom of info text" — the
    // risiko footer reaches the card's very edge, so its info row carries the
    // margin; the Health Check stack is already anchored one padding above.
    expect(css).toMatch(
      /\.risiko-footer \.retro-info-row \{\s*margin-bottom:\s*var\(--retro-card-pad\);\s*\}/,
    );
  });

  test("both info rows hand transparent fills and the grey text token", () => {
    const rows = [
      risiko.slice(risiko.indexOf('<ActionRow className="risiko-helper"'), risiko.indexOf(" />", risiko.indexOf('<ActionRow className="risiko-helper"'))),
      cards.slice(cards.indexOf('className="hc-helper"'), cards.indexOf("/>", cards.indexOf('className="hc-helper"'))),
    ];
    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row, "no filled icon tile").toMatch(/accent="transparent"/);
      expect(row, "no filled label field").toMatch(/fieldBg="transparent"/);
      expect(row, "the sentence reads grey").toMatch(/labelColor="var\(--retro-info-text\)"/);
      expect(row, "the icon reads grey too").toMatch(/iconColor="var\(--retro-info-text\)"/);
    }
  });

  test("no info row keeps the old filled plate", () => {
    const infoRows = [...risiko.matchAll(/<ActionRow[^>]*icon="IconInfo"[^>]*>/g), ...cards.matchAll(/<ActionRow[^>]*icon="IconInfo"[^>]*>/g)];
    expect(infoRows.length, "the info rows are still the two helper sentences").toBe(2);
    for (const [row] of infoRows) {
      expect(row).not.toMatch(/#F1F2F4|--risiko-helper-bg/);
    }
  });

  test("the ℹ mark keeps no tile of its own", () => {
    // user: "info i icon remove padding" — the helper sentence's mark sits flush
    // at the row's content edge, so it must not be handed the 32px tile the
    // filled CTAs use, and its sentence must not be held at that tile's height.
    expect(actionRow, "the info tile sizes to the glyph, not to a 32px plate").toMatch(
      /isInfo\s*\?\s*"shrink-0 flex items-center justify-center leading-none"/,
    );
    expect(actionRow, "the info sentence keeps its own height").toMatch(
      /isInfo\s*\?\s*"flex items-center px-3/,
    );
    expect(actionRow, "only the filled CTAs keep the 32px tile").toMatch(
      /:\s*"shrink-0 w-8 h-8 flex items-center justify-center"/,
    );
  });
});
