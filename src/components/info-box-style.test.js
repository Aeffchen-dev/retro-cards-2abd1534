import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const risiko = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

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
    const rule = css.slice(css.indexOf(".retro-info-row {"), css.indexOf("}", css.indexOf(".retro-info-row {")));
    expect(rule, "a grey hairline sits above the sentence").toMatch(
      /border-top:\s*1px solid var\(--retro-info-rule\);/,
    );
    expect(rule, "the line keeps its distance from the letters").toMatch(/padding-top:\s*8px;/);
    expect(rule, "the border never squeezes the label").toMatch(/height:\s*auto;/);
    expect(rule, "the box carries no background of its own").not.toMatch(/background/);
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
});
