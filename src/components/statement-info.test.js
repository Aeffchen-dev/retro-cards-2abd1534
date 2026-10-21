import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const data = readFileSync(new URL("./risiko-data.ts", import.meta.url), "utf8");
const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const deck = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
// The footer's own div: the first "risiko-footer" in the file is a querySelector string.
const FOOT_AT = slide.indexOf("risiko-footer screen-only");

/** The sentence the user wrote for every Health Check statement card's info box. */
const INFO = "Trifft diese Aussage auch auf eure Beziehung zu? Schiebt den Regler zur passenden Antwort. Wie gut schneidet ihr später ab? Welches Gefühl dominiert am Ende?";

describe("statement card info sentence", () => {
  test("is the user's wording, held once in the shared data module", () => {
    expect(data).toContain(`export const RISIKO_STATEMENT_INFO = "${INFO}";`);
  });

  test("replaces the old helper on the statement cards, screen and paper alike", () => {
    const footer = slide.slice(FOOT_AT, slide.indexOf("</div>", FOOT_AT));
    expect(footer).toContain("RISIKO_STATEMENT_INFO");
    expect(slide).not.toContain("Schiebt den schwarzen Kreis nach links und rechts");
    // The chapter's own intro keeps its words, so the card that opens the chapter
    // shows both rows: the intro under the scale, this sentence under the button.
    expect(slide).toContain("RISIKO_CHAPTER_INFO");
  });

  test("puts the notes button before the info box on every Health Check page", () => {
    const footer = slide.slice(FOOT_AT, slide.indexOf("</div>", FOOT_AT));
    const cta = footer.indexOf("Macht Notizen");
    const info = footer.indexOf("RISIKO_STATEMENT_INFO");
    expect(cta, "the notes button is missing from the footer").toBeGreaterThan(-1);
    expect(info, "the info sentence is missing from the footer").toBeGreaterThan(-1);
    expect(cta, "the info box still reads before the notes button").toBeLessThan(info);
  });

  test("leaves the work-split card its own sentence", () => {
    const footer = slide.slice(FOOT_AT, slide.indexOf("</div>", FOOT_AT));
    expect(footer).toContain("Verändere die prozentuale Verteilung der Anteile indem du eure Emojis nach links oder rechts ziehst");
  });

  test("leaves the Intimacy card alone", () => {
    const intimacy = deck.slice(deck.indexOf("case 7:"), deck.indexOf("Das war so hot"));
    expect(intimacy, "the Intimacy card shows the old helper sentence").not.toContain("Schiebt den schwarzen Kreis nach links und rechts");
    expect(intimacy).not.toContain("Die Aussage beschreibt");
  });

  test("shows the statement on its own, without quote marks", () => {
    const head = slide.slice(slide.indexOf('className="risiko-statement shrink-0"'));
    const inner = head.slice(head.indexOf(">") + 1, head.indexOf("</h2>"));
    expect(inner, "the statement is wrapped in quote marks again").toBe("{statement}");
    expect(slide, "a quote mark came back around the statement").not.toContain("\\u201E");
  });
});
