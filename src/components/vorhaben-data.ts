export const VORHABEN_QUESTIONS = [
  ["unspoken", "Gab es etwas, dass du gedacht aber nicht angesprochen hast?"],
  ["allocation", "Verteilung der Beziehungsarbeit"],
  ["plans", "Das wollen wir kommenden Monat machen"],
  ["experiment", "Das könnten wir (neues) ausprobieren"],
] as const;

export const allocationValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};