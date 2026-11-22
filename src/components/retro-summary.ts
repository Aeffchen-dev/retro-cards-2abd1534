import { RISIKO_STATEMENTS, RISIKO_HOT, SCALE_CAPTIONS, averageMood, moodFaceIndex, scaleValue, workloadShares } from "./risiko-data";
import { intimacyStars } from "./intimacy-rating";

/** Short topic names for the summary, keyed like the statement sliders. */
export const TOPIC_NAMES: Record<string, string> = {
  self: "Gesehen & respektiert",
  love: "Liebe zeigen",
  appreciation: "Respektvolle Kommunikation",
  conflicts: "Konflikte als Team",
  metime: "Me-Time",
  quality: "Gemeinsame Erlebnisse",
  curious: "Gemeinsam wachsen",
  hot: "Sexy & begehrt",
};

export interface RetroSummary {
  mood: string | null;
  strengths: string[];
  focus: string[];
  workload: { key: string; share: number }[] | null;
  intimacy: number;
  answered: number;
}

const KEYS = [...RISIKO_STATEMENTS.map(([k]) => k), RISIKO_HOT[0]];

/** Only sliders the couple actually set count: strengths are answers at
 *  "Trifft oft zu" or better, focus topics at "Trifft selten zu" or worse,
 *  each the two most pronounced. */
export function retroSummary(values: Record<string, string>, personKeys: string[], intimacy?: string): RetroSummary {
  const set = KEYS.filter((k) => values[k]?.trim()).map((k) => ({ k, v: scaleValue(values[k]) }));
  const avg = averageMood(values);
  const strengths = set.filter((s) => s.v >= 75).sort((a, b) => b.v - a.v).slice(0, 2).map((s) => TOPIC_NAMES[s.k]);
  const focus = set.filter((s) => s.v <= 25).sort((a, b) => a.v - b.v).slice(0, 2).map((s) => TOPIC_NAMES[s.k]);
  const touched = personKeys.some((k) => values[`work_${k}`]?.trim()) || !!values.allocation?.trim();
  const shares = touched ? workloadShares(personKeys, values) : null;
  return {
    mood: avg === null ? null : SCALE_CAPTIONS[moodFaceIndex(avg)],
    strengths,
    focus,
    workload: shares ? personKeys.map((key) => ({ key, share: shares[key] })) : null,
    intimacy: intimacyStars(intimacy),
    answered: set.length,
  };
}

export interface HealthInsights {
  average: number | null;
  partnerAverage: number | null;
  /** Topics where you two differ by two or more points, biggest first. */
  gaps: { title: string; own: number; partner: number }[];
  /** Change of your average against the previous retro. */
  trend: number | null;
  nextSteps: string[];
}

const mean = (xs: (number | null)[]) => {
  const n = xs.filter((v): v is number => v !== null);
  return n.length === xs.length && n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : null;
};

export function healthInsights(
  own: (number | null)[], partner: (number | null)[], titles: string[],
  previous: (number | null)[] | null, ideas: Record<string, string> = {},
): HealthInsights {
  const average = mean(own);
  const prev = previous ? mean(previous) : null;
  const gaps = titles
    .map((title, i) => ({ title, own: own[i], partner: partner[i] }))
    .filter((g): g is { title: string; own: number; partner: number } => g.own !== null && g.partner !== null && Math.abs(g.own - g.partner) >= 2)
    .sort((a, b) => Math.abs(b.own - b.partner) - Math.abs(a.own - a.partner))
    .slice(0, 3);
  const nextSteps = Object.values(ideas).flatMap(v => v.split('\n')).map(l => l.replace(/^[•\s-]+/, '').trim()).filter(Boolean).slice(0, 3);
  return {
    average, partnerAverage: mean(partner), gaps,
    trend: average !== null && prev !== null ? Math.round((average - prev) * 10) / 10 : null,
    nextSteps,
  };
}

/** One talking question per Health Check topic, used for the "Darüber reden" box. */
export const TALK_QUESTIONS: Record<string, string> = {
  love: "Wann hast du dich zuletzt richtig gesehen gefühlt – und was hat gefehlt?",
  communication: "Worüber fällt es dir gerade schwer, offen zu sprechen?",
  trust: "Was würde dir helfen, dich noch sicherer zu fühlen?",
  intimacy: "Welche Art von Nähe wünschst du dir gerade mehr?",
  time: "Welcher gemeinsame Moment hat dir zuletzt gutgetan – wie bekommen wir mehr davon?",
  freedom: "Wo wünschst du dir mehr Raum für dich?",
  fairness: "Welche Aufgabe würdest du gern abgeben oder teilen?",
  fun: "Was würde dir wieder richtig Spaß mit uns machen?",
};

export interface EvaluationTopic { id: string; title: string; own: number | null; partner: number | null }

/** Topics both rated 4 or better (or you alone, without a partner). */
export function sharedStrengths(topics: EvaluationTopic[], hasPartner: boolean): string[] {
  return topics.filter(t => t.own !== null && t.own >= 4 && (!hasPartner || (t.partner !== null && t.partner >= 4))).map(t => t.title);
}

/** Topics anyone rated 2 or lower, or rated two or more points apart — each with its question. */
export function talkTopics(topics: EvaluationTopic[]): { title: string; question: string }[] {
  return topics
    .filter(t => (t.own !== null && t.own <= 2) || (t.partner !== null && t.partner <= 2) || (t.own !== null && t.partner !== null && Math.abs(t.own - t.partner) >= 2))
    .map(t => ({ title: t.title, question: TALK_QUESTIONS[t.id] ?? "Was braucht ihr hier gerade?" }));
}
