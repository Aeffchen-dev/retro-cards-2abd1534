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
  themes: [{ title: "Gemeinsame Zeit", summary: "Ihr wünscht euch mehr ungeteilte Aufmerksamkeit.", comparison: "Jana und Niklas nennen beide mehr bewusste Zeit.", status: "watch", recurring: true }],
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

  it("includes every kind of note and rating, while excluding the local p1 copy", () => {
    const answers = collectRetroAnswers("Jana", {
      notes: {
        3: { "q0-p0": "Projekt geschafft", "q5-p0": "Stolz", "q0-p1": "Partnerkopie" },
        5: { p0: "Nur verabredete Dates" },
        7: { scale: "75" },
        105: { self: "100", hc_p0_love: "5", work_p0: "60", "self-p0": "Ich kann ganz ich selbst sein" },
        200: { "love-p0": "Die kleinen Gesten" },
      },
    });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Letzte 4 Wochen – Ein voller Erfolg", answer: "Projekt geschafft" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Letzte 4 Wochen – 4 Wochen in einem Wort", answer: "Stolz" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Dates – Notiz", answer: "Nur verabredete Dates" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Intimacy – Zufriedenheit", answer: "4 von 5 Herzen" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Health Check – Ich kann in deiner Gegenwart so sein wie ich bin und fühle mich gesehen und respektiert", answer: "Trifft immer zu (100/100)" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Health Check – Liebe & Wertschätzung", answer: "5 von 5 – Sehr zufrieden" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Health Check – Beziehungsarbeit", answer: "60 % der Beziehungsarbeit" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Health Check – Notiz zu: Ich kann in deiner Gegenwart so sein wie ich bin und fühle mich gesehen und respektiert", answer: "Ich kann ganz ich selbst sein" });
    expect(answers).toContainEqual({ person: "Jana", prompt: "Health Check – Notiz zu: Wir zeigen uns aktiv, dass wir uns lieben", answer: "Die kleinen Gesten" });
    expect(answers.some(answer => answer.answer === "Partnerkopie")).toBe(false);
  });

  it("adds jointly edited Ideas once and fills missing local values from the shared session", () => {
    const answers = collectRetroAnswers(
      "Jana",
      { notes: { 104: { plans: "Samstag frühstücken", experiment: "Handyfreier Abend" } } },
      "Niklas",
      { notes: { 104: { plans: "Samstag frühstücken", experiment: "Handyfreier Abend", idea: "Aufgaben früher teilen" } } },
    );
    expect(answers.filter(answer => answer.person === "Gemeinsam")).toEqual([
      { person: "Gemeinsam", prompt: "Ideas – Plan", answer: "Samstag frühstücken" },
      { person: "Gemeinsam", prompt: "Ideas – Try", answer: "Handyfreier Abend" },
      { person: "Gemeinsam", prompt: "Ideas – Change", answer: "Aufgaben früher teilen" },
    ]);
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

  it("keeps older saved results readable without inventing a comparison", () => {
    const legacy = { ...result, themes: [{ title: "Vertrauen", summary: "Darüber habt ihr gesprochen.", recurring: false }] };
    expect(asRetroAiResult(legacy)?.themes[0]).toEqual({
      title: "Vertrauen",
      summary: "Darüber habt ihr gesprochen.",
      comparison: "",
      status: "watch",
      recurring: false,
    });
  });

  it("uses a local calendar day for one-entry-per-round replacement", () => {
    expect(localRetroDay(new Date(2026, 10, 22))).toBe("2026-11-22");
  });
});
