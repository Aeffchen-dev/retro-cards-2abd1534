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

  test("the note hangs straight under the button and needs no indent of its own", () => {
    // user: "info text top padding only 8px", then "Notizen öffnen move closer to
    // top border of info text (same value as top padding)" — the button no longer
    // stands a breath of its own over the hairline, so the note reads as one
    // block hung under it. The sentence's own indent is gone: the mark stands in
    // the icon tile's column and the sentence keeps the field's padding, so both
    // start their words at the same x (user: "info I text move to same x position
    // as Notizen öffnen text").
    expect(css, "the note's breath is not its own token").toMatch(/--retro-info-gap:\s*8px;/);
    expect(css, "a mark-gap token is back").not.toMatch(/--retro-info-mark-gap/);
    expect(css, "the sentence is still pushed over by a padding of its own").not.toMatch(
      /\.retro-info-row > span \+ span \{\s*padding-left/,
    );
    const stacks = [
      ["the Risikofaktoren footer", risiko],
      ["the Health Check stack", cards],
    ];
    for (const [where, src] of stacks) {
      expect(src, `the button in ${where} does not sit straight on the hairline`).toContain("gap-0");
      expect(src, `the button in ${where} still stands a breath over the hairline`).not.toContain(
        "gap-[var(--retro-info-gap)]",
      );
    }
  });

  test("the i inside the ℹ mark reads darker and draws no heavier than the scale smileys", () => {
    // user: "i in info I darker if thicker", then "stroke width max like grey
    // smiley" — the letter wears its own darker ink, and its pen stops exactly at
    // the weight the grey scale smileys draw with.
    expect(css, "the letter's own ink is missing").toMatch(/--retro-info-ink:\s*#3F4147;/);
    const mark = css.match(/\.retro-info-mark path \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(mark, "the letter does not wear the darker ink").toMatch(/stroke:\s*var\(--retro-info-ink\);/);
    const units = parseFloat(mark.match(/stroke-width:\s*([\d.]+)/)?.[1] ?? "0");
    expect(units, "the letter's pen is not declared").toBeGreaterThan(0);
    /* Both weights are stated in their own 24-unit box, so both are compared as
       the pixels they actually paint: the mark draws at the size ActionRow hands
       it (14px since "info i icon smaller"), the smileys at 44. The ring's
       strokePx is already a real on-screen pixel, so it paints as it is named. */
    const markSize = parseFloat(
      actionRow.match(/const resolvedIconSize = isInfo \? (\d+) : 16/)?.[1] ?? "0",
    );
    expect(markSize, "the mark does not draw smaller than the other CTA glyphs").toBeLessThan(16);
    const letterPen = (units * markSize) / 24;
    const facePen =
      (parseFloat(risiko.match(/const FACE_PEN = ([\d.]+)/)?.[1] ?? "0") *
        parseFloat(risiko.match(/const FACE_SIZE = (\d+)/)?.[1] ?? "0")) /
      24;
    const ringPen = 1.5; // the ℹ ring's own strokePx, painted 1:1 on screen
    expect(letterPen, "the letter draws heavier than the grey smileys").toBeLessThanOrEqual(facePen + 0.01);
    expect(letterPen, "the letter draws no heavier than its own ring").toBeGreaterThan(ringPen);
    expect(actionRow, "the mark is not handed its own hook").toMatch(/className=\{isInfo \? "retro-info-mark"/);
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

  test("the ℹ mark keeps no filled tile, but stands in the tile's column", () => {
    // user: "info i icon remove padding" — the mark wears no filled plate and the
    // glyph sits flush at the row's content edge; user: "info I text move to same
    // x position as Notizen öffnen text" — it does stand in the icon tile's own
    // 32px column, so its sentence starts where the button's label starts; and
    // user: "aligned with 1 line of text" — it rides the first line, not the
    // middle of a wrapped note.
    expect(actionRow, "the mark is not handed the tile's 32px column").toMatch(
      /isInfo\s*\?\s*"shrink-0 w-8 flex items-start justify-center leading-none"/,
    );
    expect(actionRow, "the info sentence lost the field's own padding").toMatch(
      /isInfo\s*\?\s*"flex items-center px-3/,
    );
    expect(actionRow, "only the filled CTAs keep the 32px square tile").toMatch(
      /:\s*"shrink-0 w-8 h-8 flex items-center justify-center"/,
    );
    // the mark rides the sentence's first line: dropped from the row's own top by
    // half the difference between the line and the 12px glyph, on desktop (22px
    // line) and on phones and tablets (16px line).
    const helper = css.match(/\.risiko-helper > span:first-child \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(helper, "the mark is not aligned to the row's top").toMatch(/align-self:\s*flex-start/);
    expect(helper, "the mark does not drop onto the first line").toMatch(/margin-top:\s*5px/);
    const hc = css.match(/\.hc-helper > span:first-child \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(hc, "the Health Check mark is not aligned to the row's top").toMatch(
      /align-self:\s*flex-start/,
    );
    expect(css, "the small-screen mark offset is missing").toMatch(
      /\.risiko-helper > span:first-child,\s*\.hc-helper > span:first-child \{\s*margin-top:\s*2px;\s*\}/,
    );
    // the note hugs its own text instead of a 32px field's height
    const note = css.match(/\.risiko-helper > span:last-child \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(note, "the note is still held at a 32px field height").not.toMatch(/min-height:\s*32px/);
  });
});
