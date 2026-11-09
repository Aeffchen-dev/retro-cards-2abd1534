import { healthScore, HEALTH_CATEGORIES } from './health-check-data';

export type HistoryPerson = { id: string; name: string; scores: (number | null)[] };
export type HistoryResults = { people: HistoryPerson[] };
export type HealthHistoryEntry = { id: string; owner_id: string | null; recorded_at: string; results: HistoryResults };
export const HEALTH_HISTORY_KEY = 'retro-health-history-v1';

export function parseHistoryResults(value: unknown): HistoryResults | null {
  if (!value || typeof value !== 'object' || !('people' in value) || !Array.isArray(value.people)) return null;
  const people: HistoryPerson[] = [];
  for (const p of value.people) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string' || typeof p.name !== 'string' || !Array.isArray(p.scores) || p.scores.length !== HEALTH_CATEGORIES.length) return null;
    if (p.scores.some((score: unknown) => score !== null && healthScore(score) === null)) return null;
    people.push({ id: p.id, name: p.name, scores: p.scores.map(healthScore) });
  }
  return people.length >= 1 && people.length <= 2 ? { people } : null;
}

export function historyScore(scores: (number | null)[], topic: string): number | null {
  if (topic !== 'average') {
    const index = HEALTH_CATEGORIES.findIndex(c => c.id === topic);
    return scores[index] ?? null;
  }
  const answered = scores.filter((n): n is number => n !== null);
  return answered.length === HEALTH_CATEGORIES.length ? Math.round(answered.reduce((a,b) => a+b,0) / answered.length * 100) / 100 : null;
}

export function chronologicalHistory(entries: HealthHistoryEntry[]) {
  return [...entries].sort((a,b) => a.recorded_at.localeCompare(b.recorded_at));
}

export function readLocalHealthHistory(): HealthHistoryEntry[] {
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(HEALTH_HISTORY_KEY) ?? '[]');
    if (!Array.isArray(entries)) return [];
    return entries.flatMap(e => {
      const results = parseHistoryResults(e?.results);
      return results && typeof e.id === 'string' && typeof e.recorded_at === 'string' ? [{ id: e.id, owner_id: null, recorded_at: e.recorded_at, results }] : [];
    });
  } catch { return []; }
}