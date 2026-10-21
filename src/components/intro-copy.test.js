import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case SLIDE_INTRO:"), src.indexOf("case SLIDE_SETUP:"));

// Supplied verbatim by the user on 2026-10-21; only "machts" -> "macht's" and the
// doubled full stop after "erzählt habt" were tidied.
const LEDE =
  "Eure interaktive monatliche Date Night Routine, mit Deep Talk Themen die eure Connection stärken und Reflexions-Fragen, die euch helfen eure Beziehungsqualität zu verbessern.";
const PARAGRAPHS = [
  "Macht daraus eure Date Night, schnappt euch euer Lieblingsgetränk, macht's euch gemütlich.",
  "Nehmt euch Zeit füreinander und connected euch bei Deep Talks über das, was euch am anderen fasziniert und euch verbindet. Bleibt neugierig dafür, was euch jeweils wirklich bewegt, stärkt, Angst macht und was ihr euch vielleicht noch nie erzählt habt.",
  "Und ganz nebenbei bekommt eure Beziehung ein Upgrade: Entlarvt ungesunde Muster, entdeckt, was euch wirklich zusammenschweißt, und macht mehr von dem, was eure Connection besonders macht.",
  "Hört einander zu, bleibt neugierig und denkt immer daran: Ihr seid ein Team.",
];

describe("intro card copy", () => {
  test("opens with the lede, in the card's own display face", () => {
    expect(card, "the lede is gone or reworded").toContain(LEDE);
    expect(card, "the lede no longer wears the display face").toMatch(
      /className="retro-heading intro-lede/
    );
    expect(card, "the old headline is back").not.toContain("Stärkt eure Connection");
  });

  test("carries the four paragraphs, verbatim and in order", () => {
    let at = -1;
    for (const p of PARAGRAPHS) {
      const found = card.indexOf(p);
      expect(found, `paragraph missing: ${p.slice(0, 32)}…`).toBeGreaterThan(-1);
      expect(found, `paragraph out of order: ${p.slice(0, 32)}…`).toBeGreaterThan(at);
      at = found;
    }
    expect([...card.matchAll(/<p>/g)].length, "a paragraph was added or dropped").toBe(4);
  });

  test("keeps the typo fixes the copy was rendered with", () => {
    expect(card, "the apostrophe in macht's was dropped").toContain("macht's euch gemütlich");
    expect(card, "the doubled full stop is back").not.toContain("erzählt habt..");
  });

  test("sizes the lede and the paragraphs so the card holds both without scrolling", () => {
    const lede = css.match(/#root \.intro-lede \{ font-size: (\d+)px/)?.[1];
    const copy = css.match(/#root \.intro-copy \{ font-size: (\d+)px/)?.[1];
    expect(lede, "the lede's size moved off its token").toBe("24");
    expect(copy, "the paragraphs' size moved off the body default").toBe("16");
    // Phones: both step down again, and nothing reads smaller than the 12px floor.
    // Several 767px blocks exist — take the one that carries the Intro card's rules.
    const phone =
      [...css.matchAll(/@media \(max-width: 767px\) \{[\s\S]*?\n\}/g)]
        .map((m) => m[0])
        .find((b) => b.includes(".intro-lede")) ?? "";

    expect(phone.match(/#root \.intro-lede \{ font-size: (\d+)px/)?.[1], "phone lede size").toBe("20");
    expect(phone.match(/#root \.intro-copy \{ font-size: (\d+)px/)?.[1], "phone copy size").toBe("14");
  });
});
