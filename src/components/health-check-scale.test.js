import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const consts = src.slice(src.indexOf("const HC_FACE"), src.indexOf("const SLIDE_PILLS"));
const card = src.slice(src.indexOf("case 1:"), src.indexOf("case 3:"));

describe("Health Check smiley scale", () => {
  test("smileys and guides are 30% smaller than they were", () => {
    expect(consts).toContain("const HC_FACE = 24;"); // was 34px
    expect(consts).toContain("const HC_SPAN_PCT = 70;"); // was the full field
    expect(card).toContain("h-[24px] w-[24px]");
    expect(card).not.toMatch(/34px|size=\{34\}/);
  });

  test("the shrunken column is centred in the field", () => {
    expect(consts).toContain("const HC_OFFSET_PCT = (100 - HC_SPAN_PCT) / 2;");
  });

  test("faces, guides and the anchored Memoji read one shared geometry", () => {
    expect(card.match(/hcSpanPoint/g)?.length).toBe(3);
    expect(card).toMatch(/hcSpanPoint\(faceIndex \/ 4\)\} - 28px/); // centred on the 56px Memoji
  });
});
