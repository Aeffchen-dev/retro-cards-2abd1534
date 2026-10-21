import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";

const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("the Intimacy card answers on the Health Check scale", () => {
  test("the scale is a shared component the Health Check cards also render", () => {
    expect(slide, "the scale is not exported for other cards").toMatch(/export const StatementScale = /);
    expect(slide, "the Health Check statements no longer render through the shared scale").toMatch(
      /const scale = \(key: string, text: string, readOnly: boolean, below\?: React\.ReactNode\) => \(\s*<StatementScale/,
    );
  });

  test("the stars are gone and the scale stands in the Intimacy card", () => {
    expect(existsSync(new URL("./StarRating.tsx", import.meta.url)), "the star control is still around").toBe(false);
    expect(cards, "a star control is still referenced").not.toMatch(/StarRating/);
    expect(cards, "the old star store is still read or written").not.toMatch(/intimacyRatings/);
    const intimacy = cards.slice(cards.indexOf("case 7: {"), cards.indexOf("case 8:"));
    expect(intimacy, "the Intimacy card no longer renders the scale").toMatch(/<StatementScale/);
    expect(intimacy, "the answer is not kept with this card's own notes").toMatch(/value=\{editModeNotes\[7\]\?\.scale\}/);
    expect(intimacy, "the scale lost its helper sentence").toMatch(/Schiebt den schwarzen Kreis nach links und rechts/);
  });

  test("the card keeps its own shorter field so nothing runs past its lower edge", () => {
    // The Intimacy card holds the scale between its question and two answer fields,
    // so the scale stands shorter here than on a Health Check card of its own.
    expect(css, "the Intimacy scale no longer caps its field").toMatch(/\.risiko-page--intimacy \{ --risiko-field-h: 80px; \}/);
    expect(cards, "the Intimacy scale no longer lowers the field's floor").toMatch(/fieldMin=\{76\}/);
    expect(slide, "the field's floor can no longer be set per card").toMatch(/minHeight: fieldMin \?\? FIELD_MIN/);
  });
});
