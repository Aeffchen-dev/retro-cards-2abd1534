import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const risiko = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The shared "Notizen öffnen" CTA: user: "left side grey fill+outline" and
 * "icon blaclk" — the pencil tile reads field grey with a grey ring around it
 * and a black pencil, while the label field keeps the deck's standard field
 * grey. Edit mode ("Fertig") keeps the card's own pill colour and white pencil.
 */
describe("notes CTA colours", () => {
  const GREY_TILE = "#E4E6E8";
  const GREY_RING = "1px solid #C9CBD1";
  const INK = "#201C1D";

  test("the Risikofaktoren notes button reads a grey tile with a grey ring", () => {
    const row = risiko.slice(
      risiko.indexOf('<ActionRow icon="IconPencil"'),
      risiko.indexOf("/>", risiko.indexOf('<ActionRow icon="IconPencil"')),
    );
    expect(row, "the label is Notizen öffnen").toContain('label="Notizen öffnen"');
    expect(row, "the left tile is not field grey").toContain(`accent="${GREY_TILE}"`);
    expect(row, "the left tile wears no grey ring").toContain(`tileBorder="${GREY_RING}"`);
    expect(row, "the pencil does not read black").toContain(`iconColor="${INK}"`);
    expect(row, "the pencil's pen changed").toContain("iconStrokeWidth={1}");
    expect(row, "the tile still reads ink").not.toContain('accent="#201C1D"');
  });

  test("the Health Check stack's notes button reads a grey tile outside edit mode", () => {
    const stack = cards.slice(
      cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(stack, "edit mode does not keep the pill colour").toMatch(
      /accent=\{editModeSlides\[cardId\] \? pillColorOf\(cardId\) : "#E4E6E8"\}/,
    );
    expect(stack, "the grey ring is not left off in edit mode").toMatch(
      /tileBorder=\{editModeSlides\[cardId\] \? undefined : "1px solid #C9CBD1"\}/,
    );
    expect(stack, "the pencil does not turn black outside edit mode").toMatch(
      /iconColor=\{editModeSlides\[cardId\] \? "#FFFFFF" : "#201C1D"\}/,
    );
  });

  test("the shared notes button reads a grey tile outside edit mode", () => {
    const overlay = cards.slice(
      cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(overlay, "edit mode does not keep the pill colour").toMatch(
      /accent=\{editModeSlides\[slideId\] \? pillColorOf\(slideId\) : "#E4E6E8"\}/,
    );
    expect(overlay, "the grey ring is not left off in edit mode").toMatch(
      /tileBorder=\{editModeSlides\[slideId\] \? undefined : "1px solid #C9CBD1"\}/,
    );
    expect(overlay, "the pencil does not turn black outside edit mode").toMatch(
      /: editModeSlides\[slideId\] \? "#FFFFFF" : "#201C1D"\}/,
    );
    // the two cards that wear their own accent keep it
    expect(overlay, "the last-4-weeks card lost its pink X").toMatch(
      /slideId === 3 && editModeSlides\[slideId\] \? labelColorOf\(3\)/,
    );
    expect(overlay, "Intimacy lost its pink pencil").toMatch(
      /slideId === 7 && !editModeSlides\[slideId\] \? "var\(--intimacy-accent\)"/,
    );
  });

  test("the camera CTA's camera reads light orange on the Memory slide", () => {
    // user: "Kamera öffnen CTA color camera icon light orabge" — the tile keeps the
    // slide's own purple, only the camera inside it wears the deck's light orange.
    const row = cards.slice(
      cards.indexOf('label="Kamera öffnen"'),
      cards.indexOf("/>", cards.indexOf('label="Kamera öffnen"')),
    );
    expect(row, "the camera CTA is missing").toBeTruthy();
    expect(row, "the camera does not read light orange").toContain('iconColor={BRAND.lightOrange}');
    const brand = cards.slice(cards.indexOf("const BRAND = {"), cards.indexOf("} as const"));
    expect(brand, "the palette lost its light orange").toMatch(/lightOrange:\s*"#FFA24D"/);
    expect(row, "the tile no longer wears the slide's purple").toContain("accent={pillColorOf(0)}");
  });
});
