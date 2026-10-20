export const RISIKO_STATEMENTS = [
  ["appreciation", "Wir kommunizieren wertschätzend"],
  ["conflicts", "Wir lösen Konflikte"],
  ["self", "Wir vernachlässigen uns nicht selbst für den anderen"],
  ["metime", "Wir haben genug Me Time"],
  ["quality", "Wir verbringen genug Quality Time"],
] as const;

export const RISIKO_HOT = ["hot", "Ich fühle mich hot & begehrt"] as const;

export interface RisikoPage {
  statements: (readonly [string, string])[];
  personKeys: string[];
}

/** Keep the two sections separate, and add pages rather than shrink or scroll. */
export function risikoPages(personKeys: string[], height: number, width: number): RisikoPage[] {
  const contentWidth = Math.max(180, Math.min(500, width - 48) - 56);
  const budget = Math.max(150, (height - 48) * 0.88 - 56 - 148);
  const textHeight = (text: string) => Math.ceil(text.length / Math.max(18, Math.floor(contentWidth / 8))) * 22;
  const pages: RisikoPage[] = [];
  for (const section of [RISIKO_STATEMENTS.slice(0, 3), [...RISIKO_STATEMENTS.slice(3), RISIKO_HOT]]) {
    let page: RisikoPage = { statements: [], personKeys: [] };
    let used = 0;
    for (const statement of section) {
      const cost = textHeight(statement[1]) + 64;
      if (used && used + cost > budget) {
        pages.push(page);
        page = { statements: [], personKeys: [] };
        used = 0;
      }
      page.statements.push(statement);
      used += cost;
    }
    pages.push(page);
  }
  let page = pages[pages.length - 1];
  if (!page) return pages;
  let used = page.statements.reduce((sum, [, text]) => sum + textHeight(text) + 64, 0);
  const titleCost = textHeight(personKeys.length > 2 ? "Wer leistet wie viel Beziehungsarbeit?" : "Verteilung der Beziehungsarbeit") + 16;
  for (const key of personKeys) {
    const cost = 52 + (page.personKeys.length ? 0 : titleCost);
    if (used && used + cost > budget) {
      page = { statements: [], personKeys: [] };
      pages.push(page);
      used = 0;
    }
    used += 52 + (page.personKeys.length ? 0 : titleCost);
    page.personKeys.push(key);
  }
  return pages;
}


/** 0 = sad (left) … 100 = happy (right); default neutral middle. */
export const scaleValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};
