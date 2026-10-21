/** Keep the existing 0–100 answer compatible with the five-star control. */
export function intimacyStars(value?: string): number {
  if (value === undefined || value.trim() === "") return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(Math.max(0, Math.min(100, number)) / 25) + 1;
}

export function intimacyScale(stars: number): string {
  return String((Math.max(1, Math.min(5, Math.round(stars))) - 1) * 25);
}