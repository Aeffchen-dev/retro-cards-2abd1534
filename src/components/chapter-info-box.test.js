import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const chapter = src.slice(src.indexOf("const chapterIntro"), src.indexOf("export default RisikoSlide"));

describe("chapter intro lives in the info box", () => {
  test("the whole intro sentence stands inside the card's info box on screen", () => {
    expect(chapter).toMatch(/label=\{chapterIntro\(chapterMood, INK\)\}/);
    expect(chapter).toMatch(/\{isChapterStart && \(\s*<ActionRow className="risiko-helper" icon="IconInfo"/);
  });

  test("the sentence above the card is left to the printed sheet only", () => {
    expect(chapter).toMatch(/risiko-chapter shrink-0 w-full hidden print-only/);
    expect(chapter).toMatch(/<p className="risiko-chapter-info">\{chapterIntro\(chapterMood, FACE_GREY\)\}<\/p>/);
  });

  test("both copies carry the same words and the average-mood smiley", () => {
    expect(chapter).toContain("{RISIKO_CHAPTER_OPEN}");
    expect(chapter).toContain("{RISIKO_CHAPTER_INFO}");
    expect(chapter).toContain("Durchschnittliche Stimmung");
    expect(chapter.match(/isChapterStart && \(/g)?.length).toBe(2);
  });
});
