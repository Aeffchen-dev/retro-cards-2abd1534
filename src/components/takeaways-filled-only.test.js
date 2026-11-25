// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { filledTopics } from "./retro-summary";

const root = resolve(import.meta.dir, "../..");
const summary = readFileSync(resolve(root, "src/components/RetroSummary.tsx"), "utf8");
const insights = readFileSync(resolve(root, "src/components/RetroAiInsights.tsx"), "utf8");
const fn = readFileSync(resolve(root, "supabase/functions/retro-insights/index.ts"), "utf8");

describe("Takeaways evaluation summarises only filled answers", () => {
  test("topics without any answer are dropped from the theme list", () => {
    const topics = [
      { id: "a", title: "A", own: 4, partner: null },
      { id: "b", title: "B", own: null, partner: 2 },
      { id: "c", title: "C", own: null, partner: null },
    ];
    expect(filledTopics(topics).map(t => t.id)).toEqual(["a", "b"]);
  });

  test("every topic filled still stands, so nothing is invented or dropped", () => {
    const topics = [
      { id: "a", title: "A", own: 5, partner: 5 },
      { id: "b", title: "B", own: 1, partner: 4 },
    ];
    expect(filledTopics(topics)).toEqual(topics);
  });

  test("the card never states how many topics are still open", () => {
    expect(summary).not.toContain("Noch offen");
    expect(summary).not.toContain("retro-eval-open");
    expect(summary).not.toContain("onOpenHealthCheck");
  });

  test("empty averages and empty bars are not drawn as placeholders", () => {
    expect(summary).not.toContain("'–'");
    expect(summary).not.toContain("?? 'offen'");
    expect(summary).toContain("filled.length > 0");
    expect(summary).toContain("t.own !== null &&");
    expect(summary).toContain("t.partner !== null &&");
  });

  test("sections with nothing in them stay hidden instead of reporting a gap", () => {
    expect(summary).not.toContain("Noch kein gemeinsames Highlight");
    expect(summary).not.toContain("Keine offenen Baustellen");
    expect(summary).not.toContain("Noch keine Ideas eingetragen");
    expect(insights).not.toContain("Daraus lässt sich gerade kein eindeutiger Stärkebereich ableiten");
    expect(insights).toContain("if (!themes.length) return null;");
  });

  test("the model is told to speak only about entered answers", () => {
    expect(fn).toContain("Erwähne niemals fehlende, leere oder unbeantwortete Angaben");
  });
});
