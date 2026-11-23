import { STORAGE_KEYS } from "../lib/storage";
import { HEALTH_CATEGORIES, HEALTH_SATISFACTION_CAPTIONS, healthScore } from "./health-check-data";
import { intimacyStars } from "./intimacy-rating";
import { RISIKO_HOT, RISIKO_STATEMENTS, SCALE_CAPTIONS, scaleValue } from "./risiko-data";

export interface RetroAnswerInput {
  person: string;
  prompt: string;
  answer: string;
}

export interface RetroAnswerSnapshot {
  postIts?: Record<string, string>;
  takeaways?: Record<string, string>;
  reflection?: Record<string, string>;
  notes?: Record<string | number, Record<string, string>>;
}

export type RetroAiThemeStatus = "works" | "watch";

export interface RetroAiTheme {
  title: string;
  summary: string;
  comparison: string;
  status: RetroAiThemeStatus;
  recurring: boolean;
}

export interface RetroAiNextStep {
  action: string;
  timing: string;
}

export interface RetroAiResult {
  themes: RetroAiTheme[];
  nextSteps: RetroAiNextStep[];
}

interface AiHistoryEntry {
  day: string;
  createdAt: string;
  result: RetroAiResult;
}

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

const LAST_WEEKS_PROMPTS = [
  "Ein voller Erfolg",
  "Ein schöner Moment",
  "Das habe ich gelernt",
  "Das hat mich Kraft gekostet",
  "Was beschäftigt mich grade?",
  "4 Wochen in einem Wort",
] as const;

const STATEMENT_PROMPTS = new Map<string, string>([...RISIKO_STATEMENTS, RISIKO_HOT]);
const IDEA_FIELDS = [
  ["plans", "Ideas – Plan"],
  ["experiment", "Ideas – Try"],
  ["idea", "Ideas – Change"],
] as const;

const personNotePrompt = (slideId: number) => {
  if (slideId === 1) return "Health Check – Eigenes Gefühl";
  if (slideId === 2) return "Health Check – Beziehungsgefühl";
  if (slideId === 5) return "Dates – Notiz";
  return `Notizen – Karte ${slideId}`;
};

/** Collect every non-empty first-person answer. A connected partner's p0 slot is
 * their own field; p1 is only the local copy and must never be sent twice. */
export function collectRetroAnswers(
  ownName: string,
  own: RetroAnswerSnapshot,
  partnerName?: string,
  partner?: RetroAnswerSnapshot,
): RetroAnswerInput[] {
  const answers: RetroAnswerInput[] = [];
  const add = (person: string, prompt: string, value: unknown) => {
    const answer = clean(value);
    if (answer) answers.push({ person, prompt, answer });
  };

  const addSnapshot = (snapshot: RetroAnswerSnapshot, person: string) => {
    add(person, "To talk about", snapshot.postIts?.p0);
    add(person, "Feedback – Spiegeln", snapshot.reflection?.nice);
    add(person, "Feedback – Danke", snapshot.reflection?.thanks);
    add(person, "Feedback – Ungesagt", snapshot.reflection?.unspoken);
    add(person, "Intimacy – Das war hot", snapshot.notes?.[7]?.hot);
    add(person, "Intimacy – Spicy thought", snapshot.notes?.[7]?.idea);
    const intimacy = intimacyStars(snapshot.notes?.[7]?.scale);
    if (intimacy) add(person, "Intimacy – Zufriedenheit", `${intimacy} von 5 Herzen`);

    for (const [rawSlideId, fields] of Object.entries(snapshot.notes ?? {})) {
      const slideId = Number(rawSlideId);
      if (slideId === 7 || slideId === 104) continue;
      for (const [key, value] of Object.entries(fields)) {
        const answer = clean(value);
        if (!answer || key === "p1" || key.endsWith("-p1")) continue;

        if (key === "p0") {
          add(person, personNotePrompt(slideId), answer);
          continue;
        }
        if (key.endsWith("-p0")) {
          const noteKey = key.slice(0, -3);
          const lastWeeksIndex = slideId === 3 && /^q[0-5]$/.test(noteKey) ? Number(noteKey.slice(1)) : -1;
          const prompt = lastWeeksIndex >= 0
            ? `Letzte 4 Wochen – ${LAST_WEEKS_PROMPTS[lastWeeksIndex]}`
            : STATEMENT_PROMPTS.has(noteKey)
              ? `Health Check – Notiz zu: ${STATEMENT_PROMPTS.get(noteKey)}`
              : `${personNotePrompt(slideId)} – ${noteKey}`;
          add(person, prompt, answer);
          continue;
        }
        if (slideId === 105 || slideId >= 200) {
          if (STATEMENT_PROMPTS.has(key)) {
            const scale = scaleValue(answer);
            add(person, `Health Check – ${STATEMENT_PROMPTS.get(key)}`, `${SCALE_CAPTIONS[Math.round(scale / 25)]} (${scale}/100)`);
            continue;
          }
          if (key.startsWith("hc_p0_")) {
            const category = HEALTH_CATEGORIES.find(item => item.id === key.slice("hc_p0_".length));
            const score = healthScore(answer);
            if (category && score !== null) {
              add(person, `Health Check – ${category.title}`, `${score} von 5 – ${HEALTH_SATISFACTION_CAPTIONS[score - 1]}`);
              continue;
            }
          }
          if (key === "work_p0" || key === "allocation") {
            add(person, "Health Check – Beziehungsarbeit", `${scaleValue(answer)} % der Beziehungsarbeit`);
            continue;
          }
        }
        // Future free-text fields are included as well instead of silently disappearing.
        if (Number.isNaN(Number(answer))) add(person, `${personNotePrompt(slideId)} – ${key}`, answer);
      }
    }
    add(person, "Takeaways – Erkenntnisse", snapshot.takeaways?.p0);
  };

  addSnapshot(own, clean(ownName) || "Du");
  if (partner) addSnapshot(partner, clean(partnerName) || "Partner");

  // Ideas are jointly edited in a shared session: include one shared copy, never
  // two identical votes. Prefer each local value and fill gaps from the partner.
  for (const [key, prompt] of IDEA_FIELDS) {
    add("Gemeinsam", prompt, clean(own.notes?.[104]?.[key]) || clean(partner?.notes?.[104]?.[key]));
  }
  return answers;
}

const isTheme = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  const theme = value as Record<string, unknown>;
  return typeof theme.title === "string" && typeof theme.summary === "string" && typeof theme.recurring === "boolean";
};

const isNextStep = (value: unknown): value is RetroAiNextStep => {
  if (!value || typeof value !== "object") return false;
  const step = value as Record<string, unknown>;
  return typeof step.action === "string" && typeof step.timing === "string";
};

export function asRetroAiResult(value: unknown): RetroAiResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.themes) || !Array.isArray(result.nextSteps)) return null;
  if (result.themes.length < 1 || result.themes.length > 4 || !result.themes.every(isTheme)) return null;
  if (result.nextSteps.length < 1 || result.nextSteps.length > 3 || !result.nextSteps.every(isNextStep)) return null;
  return {
    themes: result.themes.map(theme => ({
      title: clean(theme.title),
      summary: clean(theme.summary),
      comparison: clean(theme.comparison),
      status: theme.status === "works" ? "works" : "watch",
      recurring: theme.recurring as boolean,
    })),
    nextSteps: result.nextSteps,
  };
}

export function localRetroDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readAiInsightHistory(storage?: Storage): AiHistoryEntry[] {
  try {
    const target = storage ?? window.localStorage;
    const parsed = JSON.parse(target.getItem(STORAGE_KEYS.AI_INSIGHT_HISTORY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is AiHistoryEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return typeof candidate.day === "string" && typeof candidate.createdAt === "string" && Boolean(asRetroAiResult(candidate.result));
    }).slice(0, 6);
  } catch {
    return [];
  }
}

/** A second generation on the same day is a revision, not evidence of recurrence. */
export function previousAiThemes(storage?: Storage, day = localRetroDay()): string[] {
  return readAiInsightHistory(storage)
    .filter(entry => entry.day !== day)
    .flatMap(entry => entry.result.themes.map(theme => theme.title))
    .slice(0, 24);
}

export function latestAiInsight(storage?: Storage): RetroAiResult | null {
  const result = readAiInsightHistory(storage)[0]?.result;
  return result ? asRetroAiResult(result) : null;
}

export function saveAiInsight(result: RetroAiResult, storage?: Storage, day = localRetroDay()): AiHistoryEntry[] {
  const entry: AiHistoryEntry = { day, createdAt: new Date().toISOString(), result };
  const history = [entry, ...readAiInsightHistory(storage).filter(item => item.day !== day)].slice(0, 6);
  try {
    const target = storage ?? window.localStorage;
    target.setItem(STORAGE_KEYS.AI_INSIGHT_HISTORY, JSON.stringify(history));
  } catch {
    // The generated result remains usable even when private browsing blocks storage.
  }
  return history;
}
