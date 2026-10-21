import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const consts = src.slice(src.indexOf("const HC_FACE"), src.indexOf("const SLIDE_PILLS"));
const card = src.slice(src.indexOf("case 1:"), src.indexOf("case 3:"));
const guide = css.slice(css.indexOf(".health-check-guide {"), css.indexOf(".health-check-guide {") + 600);
const chrome = src.slice(src.indexOf("Edit/Close action row"), src.indexOf("Left navigation zone"));

describe("Health Check smiley scale", () => {
  test("smileys stand 29px, a fifth larger than the 24px they had", () => {
    expect(consts).toContain("const HC_FACE = 29;"); // was 24px, which was 30% under the original 34px
    expect(consts).toContain("const HC_SPAN_PCT = 70;"); // was the full field
    expect(card).toContain("h-[29px] w-[29px]");
    expect(card).toContain("[&_svg]:size-[29px]"); // the drawn face follows the button box
    expect(card).not.toMatch(/34px|size=\{34\}|h-\[24px\]/);
  });

  test("the shrunken column is centred in the field", () => {
    expect(consts).toContain("const HC_OFFSET_PCT = (100 - HC_SPAN_PCT) / 2;");
  });

  test("faces, guides and the anchored Memoji read one shared geometry", () => {
    expect(card.match(/hcSpanPoint/g)?.length).toBe(3);
    expect(card).toMatch(/hcSpanPoint\(faceIndex \/ 4\)\} - 28px/); // centred on the 56px Memoji
  });

  test("the dashed tracks wear the statement scales' guide colour", () => {
    expect(guide).toContain("border-top: 1px dashed var(--risiko-line);");
    expect(guide).not.toContain("var(--risiko-caption)");
  });

  test("the dashed tracks stop short of the card's right edge", () => {
    // The track used to run to the Memoji's own resting place; three quarters of
    // that span leaves the smiley column standing with its guides, as on the
    // statement scales.
    expect(guide).toMatch(/width: max\(0px, calc\(min\(var\(--health-guide-end\), calc\(100% - 56px\)\) \* 0\.75 - 16px\)\);/);
  });

  test("the notes button closes the card and the helper sits above it", () => {
    expect(card).toContain("bottom: '68px'"); // the helper row, clear of the button
    expect(chrome).toContain("bottom: '28px'"); // the "Macht Notizen" button, at the card's own padding
    expect(chrome).not.toContain("slideId === 1"); // no per-slide lift for these two cards any more
  });
});
