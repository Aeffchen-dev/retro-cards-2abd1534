/** Preserve legacy whole hearts (0 = 1, 100 = 5); half a heart maps to -12.5. */
export function intimacyStars(value?: string): number {
  if (value === undefined || value.trim() === "") return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((Math.max(-12.5, Math.min(100, number)) / 25 + 1) * 2) / 2;
}

export function intimacyScale(stars: number): string {
  return String((Math.max(0.5, Math.min(5, Math.round(stars * 2) / 2)) - 1) * 25);
}