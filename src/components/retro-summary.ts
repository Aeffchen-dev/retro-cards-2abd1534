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
