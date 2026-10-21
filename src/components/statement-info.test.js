import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const data = readFileSync(new URL("./risiko-data.ts", import.meta.url), "utf8");
const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const deck = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/** The sentence the user wrote for every Health Check statement card's info box. */
const INFO = "Die Aussage beschreibt, was eine glückliche Beziehung ausmacht. Gleich sie mit deiner aktuellen Beziehung ab: Trifft die Aussage da auch zu? Schiebe den schwarzen Kreis nach links oder rechts zur passenden Antwort. Welches Gefühl im Slider dominiert am Ende als Durchschnitt deiner Antworten?";

describe("statement card info sentence", () => {
  test("is the user's wording, held once in the shared data module", () => {
    expect(data).toContain(`export const RISIKO_STATEMENT_INFO = "${INFO}";`);
  });

  test("replaces the old helper on the statement cards, screen and paper alike", () => {
    const footer = slide.slice(slide.indexOf("risiko-footer"), slide.indexOf("Macht Notizen"));
    expect(footer).toContain("RISIKO_STATEMENT_INFO");
    expect(slide).not.toContain("Schiebt den schwarzen Kreis nach links und rechts");
    // The chapter's own intro keeps its words, so the card that opens the chapter
    // shows both rows: the intro under the scale, this sentence above the button.
    expect(slide).toContain("RISIKO_CHAPTER_INFO");
  });

  test("leaves the work-split card its own sentence", () => {
    const footer = slide.slice(slide.indexOf("risiko-footer"), slide.indexOf("Macht Notizen"));
    expect(footer).toContain("Verändere die prozentuale Verteilung der Anteile indem du eure Emojis nach links oder rechts ziehst");
  });

  test("leaves the Intimacy card the short line its scale needs", () => {
    const intimacy = deck.slice(deck.indexOf("case 7:"), deck.indexOf("Das war so hot"));
    expect(intimacy).toContain("Schiebt den schwarzen Kreis nach links und rechts");
    expect(intimacy).not.toContain("Die Aussage beschreibt");
  });
});
