import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const risiko = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The shared "Notizen öffnen" CTA: user: "EDIT PEN BACKGROUND NO OURLINE" and
 * "icon blaclk" — the pencil tile reads plain field grey with no outline of its
 * own and a black pencil, while the label field keeps the deck's standard field
 * grey. Edit mode ("Fertig") keeps the card's own pill colour and white pencil.
 */
describe("notes CTA colours", () => {
  const GREY_TILE = "#E4E6E8";
  const INK = "#201C1D";

  test("the Risikofaktoren notes button reads a plain grey tile", () => {
    const row = risiko.slice(
      risiko.indexOf('<ActionRow icon="IconPencil"'),
      risiko.indexOf("/>", risiko.indexOf('<ActionRow icon="IconPencil"')),
    );
    expect(row, "the label is Notizen öffnen").toContain('label="Notizen öffnen"');
    expect(row, "the left tile is not field grey").toContain(`accent="${GREY_TILE}"`);
    expect(row, "the tile wears no outline").not.toContain("tileBorder");
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
    expect(stack, "the grey tile carries no outline").not.toMatch(
      /tileBorder/,
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
    expect(overlay, "the grey tile carries no outline").not.toMatch(
      /tileBorder/,
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
    const lightOrange = /lightOrange:\s*"(#[0-9A-Fa-f]{6})"/.exec(brand)?.[1];
    const purple = /purple:\s*"(#[0-9A-Fa-f]{6})"/.exec(brand)?.[1];
    expect(lightOrange, "the palette lost its light orange").toBeTruthy();
    expect(purple, "the palette lost its purple tile colour").toBeTruthy();
    /* The camera sits on the slide's own purple, so the tone has to carry real
       contrast there (user: "Erhöhe den Kontrast des hellorangefarbenen
       Kamera-Icons auf dem lila Feld") — measured with relative luminance. */
    const lum = (hex) => {
      const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
    };
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    expect(
      ratio(lightOrange, purple),
      "the camera no longer stands out on the purple tile",
    ).toBeGreaterThanOrEqual(3.5);
    expect(row, "the tile no longer wears the slide's purple").toContain("accent={pillColorOf(0)}");
  });
});
