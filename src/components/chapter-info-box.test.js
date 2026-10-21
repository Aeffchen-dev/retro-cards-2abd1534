import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const chapter = src.slice(src.indexOf("const chapterIntro"), src.indexOf("export default RisikoSlide"));

describe("chapter intro sentence", () => {
  // The user asked to "remove the upper info text box from that slide": on screen
  // the card now ends answer → button → note, with the chapter's own words gone.
  test("no longer stands in an info box on screen", () => {
    expect(src, "the on-screen chapter box is gone").not.toMatch(/chapterBox/);
    expect(src, "no info box carries the chapter sentence").not.toMatch(
      /label=\{chapterIntro\(chapterMood, INK\)\}/,
    );
    expect(src, "the statement scales are built without a note underneath").toMatch(
      /page\.statements\.map\(\(\[k, t\]\) => scale\(k, t, readOnly\)\)/,
    );
  });

  test("is left to the printed sheet only", () => {
    expect(chapter).toMatch(/risiko-chapter shrink-0 w-full hidden print-only/);
    expect(chapter).toMatch(
      /<p className="risiko-chapter-info">\{chapterIntro\(chapterMood, CHAPTER_MOOD_GREY\)\}<\/p>/,
    );
  });

  test("the printed copy keeps the same words and the average-mood smiley", () => {
    expect(chapter).toContain("{RISIKO_CHAPTER_OPEN}");
    expect(chapter).toContain("{RISIKO_CHAPTER_INFO}");
    expect(chapter).toContain("Durchschnittliche Stimmung");
    expect(chapter.match(/chapterIntro\(chapterMood/g)?.length).toBe(1);
  });
});
