import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const fields = src.slice(src.indexOf("const REFLECTION_FIELDS"), src.indexOf("] as const;", src.indexOf("const REFLECTION_FIELDS")));
const slide = src.slice(src.indexOf("case SLIDE_REFLECTION:"), src.indexOf("case 7:"));
const vorhaben = readFileSync(new URL("./vorhaben-data.ts", import.meta.url), "utf8");

describe("Feedback card is titled Monthly review for you, my love", () => {
  test("shows the new name as the pill above the card", () => {
    const pills = src.slice(src.indexOf("const SLIDE_PILLS"), src.indexOf("};", src.indexOf("const SLIDE_PILLS")));
    expect(pills).toContain('102: "Monthly review for you, my love"');
    expect(pills, "the card still carries the old name above it").not.toContain('102: "Feedback"');
  });

  test("shows the new name inside the card and in the notes header", () => {
    expect(slide).toContain('<span className="retro-label">Monthly review for you, my love</span>');
    expect(slide, "the card's own heading still reads Feedback").not.toContain('<span className="retro-label">Feedback</span>');
    expect(slide).toContain('text="Monthly review for you, my love"');
    const header = src.slice(src.indexOf("const getSlideQuestion"), src.indexOf("return questions[slideId]"));
    expect(header).toContain('[SLIDE_REFLECTION]: "Monthly review for you, my love"');
  });
});

describe("Feedback headline question", () => {
  test("asks \"Du in meinen Augen\" with the remembering sentence", () => {
    expect(fields).toContain('["nice", "Du in meinen Augen", "Deine Antwort", "Eine Erinnerung an das was ich wahrnehme oder denke, wenn ich dich sehe. Etwas, dass dir vielleicht eine neue Perspektive auf dich selbst eröffnet"]');
  });

  test("keeps the saved answers of the three questions it asks", () => {
    expect(fields).toContain('"nice"');
    expect(fields).toContain('"thanks"');
    expect(fields).toContain('"plans"');
    expect(fields).toContain('"Dafür möchte ich Danke sagen"');
    // The questions that moved away are no longer asked here.
    expect(fields).not.toContain('"idea"');
    expect(fields).not.toContain("Das wünsche ich mir");
    expect(fields).not.toContain('"unspoken"');
    expect(fields).not.toContain("Gab es etwas");
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

describe("The two cards swapped their last and first question", () => {
  test("asks \"Das wollen wir kommenden Monat machen\" on the Feedback card", () => {
    expect(fields).toContain('["plans", "Das wollen wir kommenden Monat machen", "Deine Antwort", ""]');
    expect(slide).toContain("reflectionTexts[key]");
  });

  test("asks the unspoken-thoughts question on the Ideas card", () => {
    expect(vorhaben).toContain('["unspoken", "Gab es etwas, dass du gedacht aber nicht angesprochen hast?"]');
    expect(vorhaben, "Ideas still asks for next month's plans").not.toContain('"plans"');
    expect(vorhaben).not.toContain("Das wollen wir kommenden Monat machen");
    // Ideas still asks three things: the moved question plus its own two.
    expect(vorhaben.match(/^\s+\["/gm)?.length).toBe(3);
  });

  test("carries an answer already written on Ideas over to Feedback", () => {
    const init = src.slice(src.indexOf("const [reflectionTexts"), src.indexOf("const [editModeNotes"));
    // The saved answer is read from the Ideas notes when Feedback has none yet...
    expect(init).toContain("STORAGE_KEYS.EDIT_MODE_NOTES");
    expect(init).toContain("SLIDE_VORHABEN");
    expect(init).toContain("?.plans");
    // ...and Feedback stops holding a copy of the question that moved away.
    expect(init).toContain("delete (texts as any).unspoken");
  });

  test("carries an answer already written on Feedback over to Ideas", () => {
    const notesInit = src.slice(src.indexOf("const [editModeNotes"), src.indexOf("const personPlaceholder"));
    // The old Feedback answer is copied into the Ideas notes...
    expect(notesInit).toContain("STORAGE_KEYS.REFLECTION_TEXTS");
    expect(notesInit).toContain("?.unspoken");
    expect(notesInit).toContain("here.unspoken = savedUnspoken");
    // ...and Ideas stops holding a copy of the question that moved to Feedback.
    expect(notesInit).toContain("delete migrated[SLIDE_VORHABEN as any].plans");
  });

  test("clearing all data clears the moved answer too", () => {
    expect(src).toContain("setReflectionTexts({ nice: '', thanks: '', plans: '' })");
  });

  test("keeps the wish that moved to Ideas earlier", () => {
    expect(vorhaben).toContain('["idea", "Das wünsche ich mir"]');
    expect(vorhaben).toContain('"experiment"');
    const notesInit = src.slice(src.indexOf("const [editModeNotes"), src.indexOf("const personPlaceholder"));
    expect(notesInit).toContain("here.idea = savedWish");
  });
});
