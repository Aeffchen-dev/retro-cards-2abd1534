import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const risiko = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

/**
 * The shared "Notizen öffnen" CTA: user: "left side color black" — the pencil
 * tile reads ink on every card that shows the button, while the grey label
 * field keeps the deck's standard field grey. Edit mode ("Fertig") keeps the
 * card's own pill colour.
 */
describe("notes CTA colours", () => {
  test("the Risikofaktoren notes button reads an ink tile", () => {
    const row = risiko.slice(
      risiko.indexOf('<ActionRow icon="IconPencil"'),
      risiko.indexOf("/>", risiko.indexOf('<ActionRow icon="IconPencil"')),
    );
    expect(row, "the label is Notizen öffnen").toContain('label="Notizen öffnen"');
    expect(row, "the left tile is ink").toContain('accent="#201C1D"');
    expect(row, "the pencil draws white with a 1px pen").toContain('iconColor="#FFFFFF"');
    expect(row).toContain("iconStrokeWidth={1}");
  });

  test("the Health Check stack's notes button reads an ink tile outside edit mode", () => {
    const stack = cards.slice(
      cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[cardId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(stack, "edit mode keeps the pill colour").toMatch(
      /accent=\{editModeSlides\[cardId\] \? pillColorOf\(cardId\) : "#201C1D"\}/,
    );
  });

  test("the shared notes button reads an ink tile outside edit mode", () => {
    const overlay = cards.slice(
      cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}'),
      cards.indexOf("/>", cards.indexOf('label={editModeSlides[slideId] ? "Fertig" : "Notizen öffnen"}')),
    );
    expect(overlay, "edit mode keeps the pill colour").toMatch(
      /accent=\{editModeSlides\[slideId\] \? pillColorOf\(slideId\) : "#201C1D"\}/,
    );
  });
});
