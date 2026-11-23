import { describe, expect, it } from "bun:test";
import {
  asRetroAiResult,
  collectRetroAnswers,
  localRetroDay,
  previousAiThemes,
  readAiInsightHistory,
  saveAiInsight,
} from "./retro-ai-data";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

const own = {
  postIts: { p0: "Mehr Zeit ohne Handys", p1: "Nicht die lokale Partnerkopie" },
  reflection: { nice: "Du hörst zu", thanks: "Danke fürs Kochen", unspoken: "Ich brauche mehr Ruhe" },
  notes: { 7: { hot: "Der lange Spaziergang", idea: "Mehr Berührung" }, 104: { plans: "Samstag frühstücken", experiment: "Handyfreier Abend", idea: "Aufgaben früher teilen" } },
  takeaways: { p0: "Zeit bewusst planen" },
};

const result = {
  themes: [{ title: "Gemeinsame Zeit", summary: "Ihr wünscht euch mehr ungeteilte Aufmerksamkeit.", recurring: true }],
  nextSteps: [{ action: "Plant einen handyfreien Abend.", timing: "Diese Woche" }],
};

describe("retro AI answers", () => {
  it("uses both partners' own p0 answers and never the local p1 copy", () => {
    const answers = collectRetroAnswers("Jana", own, "Niklas", { postIts: { p0: "Mehr Pausen" }, takeaways: { p0: "Früher absprechen" } });
    expect(answers).toHaveLength(12);
    expect(answers.filter(answer => answer.person === "Niklas").map(answer => answer.answer)).toEqual(["Mehr Pausen", "Früher absprechen"]);
    expect(answers.some(answer => answer.answer === "Nicht die lokale Partnerkopie")).toBe(false);
  });

  it("omits empty fields instead of asking the model to interpret blanks", () => {
    expect(collectRetroAnswers("Jana", { reflection: { thanks: "  Danke  " } })).toEqual([{ person: "Jana", prompt: "Feedback – Danke", answer: "Danke" }]);
  });
});

describe("retro AI history", () => {
  it("excludes the current day from recurring evidence", () => {
    const storage = memoryStorage();
    saveAiInsight(result, storage, "2026-11-22");
    expect(previousAiThemes(storage, "2026-11-22")).toEqual([]);
    expect(previousAiThemes(storage, "2026-12-22")).toEqual(["Gemeinsame Zeit"]);
  });

  it("replaces one round per day and keeps the latest six rounds", () => {
    const storage = memoryStorage();
    for (let day = 1; day <= 7; day += 1) saveAiInsight(result, storage, `2026-10-${String(day).padStart(2, "0")}`);
    saveAiInsight({ ...result, themes: [{ ...result.themes[0], title: "Neue Version" }] }, storage, "2026-10-07");
    const history = readAiInsightHistory(storage);
    expect(history).toHaveLength(6);
    expect(history[0].result.themes[0].title).toBe("Neue Version");
    expect(history.some(entry => entry.day === "2026-10-01")).toBe(false);
  });

  it("accepts the concrete model contract and rejects malformed output", () => {
    expect(asRetroAiResult(result)).toEqual(result);
    expect(asRetroAiResult({ themes: [], nextSteps: [] })).toBeNull();
  });

  it("uses a local calendar day for one-entry-per-round replacement", () => {
    expect(localRetroDay(new Date(2026, 10, 22))).toBe("2026-11-22");
  });
});
