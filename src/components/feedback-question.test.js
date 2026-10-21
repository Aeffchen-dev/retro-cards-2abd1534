import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const fields = src.slice(src.indexOf("const REFLECTION_FIELDS"), src.indexOf("] as const;", src.indexOf("const REFLECTION_FIELDS")));
const slide = src.slice(src.indexOf("case SLIDE_REFLECTION:"), src.indexOf("case 7:"));

describe("Feedback headline question", () => {
  test("asks \"Du in meinen Augen\" with the remembering sentence", () => {
    expect(fields).toContain('["nice", "Du in meinen Augen", "Deine Antwort", "Eine Erinnerung an das was ich wahrnehme oder denke, wenn ich dich sehe. Etwas, dass dir vielleicht eine neue Perspektive auf dich selbst eröffnet"]');
  });

  test("keeps the saved answers of all four questions", () => {
    expect(fields).toContain('"nice"');
    expect(fields).toContain('"thanks"');
    expect(fields).toContain('"idea"');
    expect(fields).toContain('"unspoken"');
    expect(fields).toContain('"Dafür möchte ich Danke sagen"');
    expect(fields).toContain('"Das wünsche ich mir"');
  });

  test("shows the sentence as grey placeholder on screen and as a line on the printed page", () => {
    const cut = slide.indexOf("{/* Print-only */}");
    const screen = slide.slice(0, cut);
    const print = slide.slice(cut);
    // On screen the sentence is the writing area's own placeholder, not a line under the bar.
    expect(screen).toContain("placeholder={helper || placeholder}");
    expect(screen.match(/helper=\{helper\}/g)).toBe(null);
    // On the printed page it stays a grey sentence above the writing area.
    expect(print.match(/helper=\{helper\}/g)?.length).toBe(1);
    expect(slide.match(/REFLECTION_FIELDS\.map\(\(\[key, label, placeholder, helper\]\)/g)?.length).toBe(2);
  });
});
