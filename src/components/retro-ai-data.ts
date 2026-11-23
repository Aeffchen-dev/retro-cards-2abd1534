import { STORAGE_KEYS } from "../lib/storage";

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

export interface RetroAiTheme {
  title: string;
  summary: string;
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

/** Collect only non-empty first-person answers; a connected partner's p0 slot is their own field. */
export function collectRetroAnswers(
  ownName: string,
  own: RetroAnswerSnapshot,
  partnerName?: string,
  partner?: RetroAnswerSnapshot,
): RetroAnswerInput[] {
  const answers: RetroAnswerInput[] = [];
  const addSnapshot = (snapshot: RetroAnswerSnapshot, person: string) => {
    const add = (prompt: string, value: unknown) => {
      const answer = clean(value);
      if (answer) answers.push({ person, prompt, answer });
    };
    add("To talk about", snapshot.postIts?.p0);
    add("Feedback – Spiegeln", snapshot.reflection?.nice);
    add("Feedback – Danke", snapshot.reflection?.thanks);
    add("Feedback – Ungesagt", snapshot.reflection?.unspoken);
    add("Intimacy – Das war hot", snapshot.notes?.[7]?.hot);
    add("Intimacy – Spicy thought", snapshot.notes?.[7]?.idea);
    add("Ideas – Plan", snapshot.notes?.[104]?.plans);
    add("Ideas – Try", snapshot.notes?.[104]?.experiment);
    add("Ideas – Change", snapshot.notes?.[104]?.idea);
    add("Takeaways – Erkenntnisse", snapshot.takeaways?.p0);
  };

  addSnapshot(own, clean(ownName) || "Du");
  if (partner) addSnapshot(partner, clean(partnerName) || "Partner");
  return answers;
}

const isTheme = (value: unknown): value is RetroAiTheme => {
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
  return { themes: result.themes, nextSteps: result.nextSteps };
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
  return readAiInsightHistory(storage)[0]?.result ?? null;
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
