import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const fields = src.slice(src.indexOf("const REFLECTION_FIELDS"), src.indexOf("] as const;", src.indexOf("const REFLECTION_FIELDS")));
const slide = src.slice(src.indexOf("case SLIDE_REFLECTION:"), src.indexOf("case 7:"));
const vorhaben = readFileSync(new URL("./vorhaben-data.ts", import.meta.url), "utf8");

describe("Feedback card is labelled Feedback above and titled A review for you, my love", () => {
  test("shows \"Feedback\" as the pill above the card", () => {
    const pills = src.slice(src.indexOf("const SLIDE_PILLS"), src.indexOf("};", src.indexOf("const SLIDE_PILLS")));
    expect(pills).toContain('102: "Feedback"');
    expect(pills, "the card still carries the long sentence above it").not.toContain('102: "Monthly review for you, my love"');
  });

  test("shows the short label in the card and the sentence as its heading and notes header", () => {
    expect(slide).toContain('<span className="retro-label">Feedback</span>');
    expect(slide, "the card's own label still carries the old sentence").not.toContain('<span className="retro-label">Monthly review for you, my love</span>');
    expect(slide).toContain('text="A review for you, my love"');
    const header = src.slice(src.indexOf("const getSlideQuestion"), src.indexOf("return questions[slideId]"));
    expect(header).toContain('[SLIDE_REFLECTION]: "A review for you, my love"');
  });
});

describe("Feedback headline question", () => {
  test("asks \"Perspektivwechsel\" with the remembering sentence", () => {
    expect(fields).toContain('["nice", "Perspektivwechsel", "Deine Antwort", "Eine Erinnerung an das was ich wahrnehme oder denke, wenn ich dich sehe. Etwas, dass dir vielleicht eine neue Perspektive auf dich selbst eröffnet"]');
  });

  test("keeps the saved answers of the three questions it asks", () => {
    expect(fields).toContain('"nice"');
    expect(fields).toContain('"thanks"');
    expect(fields).toContain('"plans"');
    expect(fields).toContain('"Danke für"');
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

  test("asks the last-chance question on the Ideas card", () => {
    // Only the list of prompts counts here, not the comment above it.
    const list = vorhaben.slice(vorhaben.indexOf("export const VORHABEN_QUESTIONS"));
    expect(list).toContain('["unspoken", "Letzte Chance"]');
    expect(list, "Ideas still asks for next month's plans").not.toContain('"plans"');
    expect(list).not.toContain("Das wollen wir kommenden Monat machen");
    // Ideas still asks three things: the moved question plus its own two.
    expect(list.match(/^\s+\["/gm)?.length).toBe(3);
  });

  test("moves an answer written on Ideas over to Feedback, in storage", () => {
    const mig = src.slice(src.indexOf("const migrateMovedAnswers"), src.indexOf("const RetroCards: React.FC"));
    expect(mig, "the startup migration is gone").toBeTruthy();
    // The saved answer is read from the Ideas notes when Feedback has none yet...
    expect(mig).toContain('carry(ideas, "plans", here, "plans")');
    // ...and the Ideas card drops its copy once Feedback holds it.
    expect(mig).toContain('[ideas, "plans"]');
  });

  test("moves an answer written on Feedback over to Ideas, in storage", () => {
    const mig = src.slice(src.indexOf("const migrateMovedAnswers"), src.indexOf("const RetroCards: React.FC"));
    expect(mig).toContain('carry(here, "unspoken", ideas, "unspoken")');
    expect(mig).toContain('[here, "unspoken"]');
    // Both stores are written back straight away, so the answer is safe before any card
    // is opened: a card only saves its own copy once something is typed into it.
    expect(mig).toContain("saveToStorage(STORAGE_KEYS.REFLECTION_TEXTS, here)");
    expect(mig).toContain("saveToStorage(STORAGE_KEYS.EDIT_MODE_NOTES");
  });

  test("runs before any card reads its saved answers", () => {
    const called = src.indexOf("migrateMovedAnswers();");
    expect(called, "the startup migration is never called").toBeGreaterThan(-1);
    expect(called, "a card reads its answers before the moves have run").toBeLessThan(src.indexOf("const [currentCard"));
    // The moves no longer live inside a card's own state, where the answer could be lost.
    const init = src.slice(src.indexOf("const [reflectionTexts"), src.indexOf("const [editModeNotes"));
    expect(init).not.toContain("loadFromStorage<Record<string, any>>(STORAGE_KEYS.EDIT_MODE_NOTES)");
    const notesInit = src.slice(src.indexOf("const [editModeNotes"), src.indexOf("const personPlaceholder"));
    expect(notesInit).not.toContain("STORAGE_KEYS.REFLECTION_TEXTS");
  });

  test("clearing all data clears the moved answer too", () => {
    expect(src).toContain("setReflectionTexts({ nice: '', thanks: '', plans: '' })");
  });

  test("keeps the wish that moved to Ideas earlier", () => {
    expect(vorhaben).toContain('["idea", "Das wünsche ich mir"]');
    expect(vorhaben).toContain('"experiment"');
    const mig = src.slice(src.indexOf("const migrateMovedAnswers"), src.indexOf("const RetroCards: React.FC"));
    expect(mig).toContain('carry(here, "idea", ideas, "idea")');
    expect(mig).toContain('[here, "idea"]');
  });
});
