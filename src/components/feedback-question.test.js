import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const fields = src.slice(src.indexOf("const REFLECTION_FIELDS"), src.indexOf("] as const;", src.indexOf("const REFLECTION_FIELDS")));
const slide = src.slice(src.indexOf("case SLIDE_REFLECTION:"), src.indexOf("case 7:"));

describe("Feedback headline question", () => {
  test("asks \"Du in meinen Augen\" with the remembering sentence", () => {
    expect(fields).toContain('["nice", "Du in meinen Augen", "Deine Antwort", "Eine Erinnerung an das was ich wahrnehme oder denke, wenn ich dich sehe. Etwas, dass dir vielleicht eine neue Perspektive auf dich selbst eröffnet"]');
  });

  test("keeps the saved answers of all three questions", () => {
    expect(fields).toContain('"nice"');
    expect(fields).toContain('"thanks"');
    expect(fields).toContain('"idea"');
    expect(fields).toContain('"Dafür möchte ich Danke sagen"');
    expect(fields).toContain('"Das wünsche ich mir"');
  });

  test("shows the sentence on screen and on the printed page", () => {
    expect(slide.match(/helper=\{helper\}/g)?.length).toBe(2);
    expect(slide.match(/REFLECTION_FIELDS\.map\(\(\[key, label, placeholder, helper\]\)/g)?.length).toBe(2);
  });
});
