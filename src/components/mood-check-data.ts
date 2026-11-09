export const MOOD_NOTES_ID = 106;
export const MOOD_AFTER_ID = 107;
export type MoodPhase = 'before' | 'after';

export function moodValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export function moodChange(before: unknown, after: unknown): number | null {
  const start = moodValue(before);
  const end = moodValue(after);
  return start === null || end === null ? null : end - start;
}

export function revealedMood(own: Record<string, string>, remote: Record<string, string>) {
  return {
    before: moodValue(own.before) === null ? null : moodValue(remote.before),
    after: moodValue(own.after) === null ? null : moodValue(remote.after),
  };
}