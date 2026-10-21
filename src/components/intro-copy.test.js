import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case SLIDE_INTRO:"), src.indexOf("case SLIDE_SETUP:"));

// Supplied verbatim by the user on 2026-10-21; only "machts" -> "macht's" and the
// doubled full stop after "erzählt habt" were tidied.
const LEDE =
  "Eure monatliche Beziehungsweise Check-in Routine, mit Deep Talk Themen die eure Connection stärken und Reflexions-Fragen, die euch helfen eure Beziehungsqualität zu verbessern";
const PARAGRAPHS = [
  "Macht daraus eure Date Night, schnappt euch euer Lieblingsgetränk und macht's euch gemütlich.",
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

describe("intro card on short windows", () => {
  const block = (q) =>
    [...css.matchAll(new RegExp(`@media ${q} \\{[\\s\\S]*?\\n\\}`, "g"))]
      .map((m) => m[0])
      .find((b) => b.includes(".intro-lede")) ?? "";
  const shortPhone = block("\\(max-height: 690px\\) and \\(max-width: 767px\\)");
  const shortWide = block("\\(max-height: 690px\\) and \\(min-width: 768px\\)");

  test("steps both sizes down so the opening fits a short card", () => {
    expect(card, "the wrapper the short-window rule tightens is gone").toContain("intro-block");
    expect(shortPhone, "the short-phone block is gone").toContain(".intro-lede");
    expect(shortPhone.match(/#root \.intro-lede \{ font-size: (\d+)px/)?.[1], "short-phone lede size").toBe("16");
    expect(shortPhone.match(/#root \.intro-copy \{ font-size: (\d+)px/)?.[1], "short-phone copy size").toBe("12");
  });

  test("keeps every short-window size at or above the 12px floor", () => {
    for (const [name, b] of [["short phone", shortPhone], ["short wide", shortWide]]) {
      expect(b, `${name} block is gone`).toContain(".intro-copy");
      for (const size of [...b.matchAll(/font-size: (\d+)px/g)].map((m) => +m[1])) {
        expect(size, `${name} block reads under the 12px floor`).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test("tightens the gaps on short windows", () => {
    expect(shortPhone.match(/#root \.intro-block \{ gap: (\d+)px/)?.[1], "short-phone block gap").toBe("12");
    expect(shortPhone.match(/#root \.intro-copy \{[^}]*gap: (\d+)px/)?.[1], "short-phone paragraph gap").toBe("8");
    expect(shortWide.match(/#root \.intro-block \{ gap: (\d+)px/)?.[1], "short-wide block gap").toBe("16");
    expect(shortWide.match(/#root \.intro-copy \{[^}]*gap: (\d+)px/)?.[1], "short-wide paragraph gap").toBe("10");
  });
});

describe("intro card on desktop", () => {
  const tier = (h) =>
    [...css.matchAll(new RegExp(`@media \\(min-width: 1024px\\) and \\(min-height: ${h}px\\) \\{[\\s\\S]*?\\n\\}`, "g"))]
      .map((m) => m[0])
      .find((b) => b.includes(".intro-lede")) ?? "";
  const wide = tier(860);
  const narrow = tier(905);

  test("caps the lede and the paragraphs at a narrow column", () => {
    expect(wide, "the 320px desktop cap is gone").toContain(".intro-copy");
    expect(wide.match(/max-width: (\d+)px/)?.[1], "the 860px tier's cap moved").toBe("320");
    expect(narrow, "the 288px desktop cap is gone").toContain(".intro-copy");
    expect(narrow.match(/max-width: (\d+)px/)?.[1], "the 905px tier's cap moved").toBe("288");
  });

  test("only caps the column as far as the card can hold it", () => {
    // 320px needs ~661px of text (a ~847px window up); 288px needs ~711px (a ~902px window up).
    expect(wide.match(/min-height: (\d+)px/)?.[1], "the 320px cap waits for a shorter window than it fits").toBe("860");
    expect(narrow.match(/min-height: (\d+)px/)?.[1], "the 288px cap waits for a shorter window than it fits").toBe("905");
    expect(css.indexOf(narrow), "the narrower cap must be declared after the wider one").toBeGreaterThan(css.indexOf(wide));
  });
});

describe("intro card on a full-height phone", () => {
  const tall =
    [...css.matchAll(/@media \(max-width: 767px\) and \(min-height: (\d+)px\) \{[\s\S]*?\n\}/g)]
      .map((m) => m[0])
      .find((b) => b.includes(".intro-block")) ?? "";

  test("tightens the gaps so the longest opening still ends inside the card", () => {
    expect(tall, "the full-height-phone gap block is gone").toContain(".intro-copy");
    expect(tall.match(/min-height: (\d+)px/)?.[1], "the gap block starts below the short-window ceiling").toBe("691");
    expect(tall.match(/#root \.intro-block \{ gap: (\d+)px/)?.[1], "block gap").toBe("16");
    expect(tall.match(/#root \.intro-copy \{ gap: (\d+)px/)?.[1], "paragraph gap").toBe("10");
    expect(tall.match(/font-size: (\d+)px/)?.[1], "the gap block must not shrink any text").toBeFalsy();
  });
});
