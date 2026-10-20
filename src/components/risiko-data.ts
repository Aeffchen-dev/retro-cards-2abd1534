export const RISIKO_STATEMENTS = [
  ["love", "Wir zeigen uns, dass wir uns lieben"],
  ["appreciation", "Wir kommunizieren wertschätzend"],
  ["conflicts", "Wir lösen Konflikte"],
  ["self", "Wir vernachlässigen uns nicht selbst für den anderen"],
  ["metime", "Wir verbringen genug Me Time"],
  ["quality", "Wir verbringen genug Quality Time"],
] as const;

export const RISIKO_HOT = ["hot", "Ich fühle mich hot & begehrt"] as const;


/** 0 = sad (left) … 100 = happy (right); default neutral middle. */
export const scaleValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};
