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

export function historyForPair(entries: HealthHistoryEntry[], userIds: string[]) {
  if (userIds.length !== 2 || new Set(userIds).size !== 2) return [];
  return chronologicalHistory(entries.filter(entry => entry.results.people.length === 2 &&
    userIds.every(id => entry.results.people.some(person => person.id === id))));
}

export function pastHealthHistory(entries: HealthHistoryEntry[], now = new Date()) {
  const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = day(now);
  return chronologicalHistory(entries.filter(entry => day(new Date(entry.recorded_at)) < today));
}

export function healthTrend(current: (number | null)[], previous: (number | null)[], topic: string) {
  const currentScore = historyScore(current, topic), previousScore = historyScore(previous, topic);
  return currentScore === null || previousScore === null ? null : Math.round((currentScore - previousScore) * 100) / 100;
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
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

/** One automatic entry per day: today's retro replaces any earlier save from the same day. */
export function upsertDailyEntry(entries: HealthHistoryEntry[], entry: HealthHistoryEntry) {
  const day = dayKey(new Date(entry.recorded_at));
  const same = entries.find(e => dayKey(new Date(e.recorded_at)) === day && e.owner_id === entry.owner_id);
  const next = same ? { ...entry, id: same.id } : entry;
  return chronologicalHistory([...entries.filter(e => e !== same), next]);
}

export const YEAR_REVIEW_MIN = 12;
export type YearReview = { count: number; best: { id: string; title: string; score: number } | null; change: { id: string; title: string; delta: number } | null };

/** After twelve retros: best category on average and the biggest change from first to latest, for one person. */
export function yearReview(entries: HealthHistoryEntry[], personId: string): YearReview | null {
  const rows = chronologicalHistory(entries).slice(-YEAR_REVIEW_MIN).map(e => e.results.people.find(p => p.id === personId)?.scores).filter((s): s is (number|null)[] => Boolean(s));
  if (rows.length < YEAR_REVIEW_MIN) return null;
  let best: YearReview['best'] = null, change: YearReview['change'] = null;
  HEALTH_CATEGORIES.forEach((c, i) => {
    const values = rows.map(r => r[i]).filter((n): n is number => n !== null);
    if (!values.length) return;
    const avg = Math.round(values.reduce((a,b) => a+b,0) / values.length * 100) / 100;
    if (!best || avg > best.score) best = { id: c.id, title: c.title, score: avg };
    const delta = values[values.length-1] - values[0];
    if (!change || Math.abs(delta) > Math.abs(change.delta)) change = { id: c.id, title: c.title, delta };
  });
  return { count: rows.length, best, change };
}
