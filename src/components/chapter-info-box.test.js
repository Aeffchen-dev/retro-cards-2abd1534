import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const chapter = src.slice(src.indexOf("const chapterIntro"), src.indexOf("export default RisikoSlide"));

describe("chapter intro lives in the info box", () => {
  test("the whole intro sentence stands inside the card's info box on screen", () => {
    expect(chapter).toMatch(/label=\{chapterIntro\(chapterMood, INK\)\}/);
    // The box is handed to the scale as its "below" node, so it stands inside the
    // scale's own block — straight under the rule, centred and moved with it.
    expect(src).toMatch(/scale\(k, t, readOnly,\s*!readOnly && isChapterStart && i === 0 \? chapterBox : undefined\)/);
    expect(src).toMatch(/className="risiko-scale-note screen-only shrink-0"/);
    // A press on the box belongs to the box: the field underneath listens for the
    // circle, so the note must not let that press through.
    expect(src).toMatch(/risiko-scale-note[^>]*onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}/);
  });

  test("the sentence above the card is left to the printed sheet only", () => {
    expect(chapter).toMatch(/risiko-chapter shrink-0 w-full hidden print-only/);
    expect(chapter).toMatch(/<p className="risiko-chapter-info">\{chapterIntro\(chapterMood, FACE_GREY\)\}<\/p>/);
  });

  test("both copies carry the same words and the average-mood smiley", () => {
    expect(chapter).toContain("{RISIKO_CHAPTER_OPEN}");
    expect(chapter).toContain("{RISIKO_CHAPTER_INFO}");
    expect(chapter).toContain("Durchschnittliche Stimmung");
    expect(chapter.match(/chapterIntro\(chapterMood/g)?.length).toBe(2);
  });
});
