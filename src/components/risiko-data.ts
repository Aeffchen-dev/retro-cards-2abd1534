export const RISIKO_STATEMENTS = [
  ["self", "Ich kann ich selbst sein und fühle mich gesehen und respektiert"],
  ["love", "Wir zeigen uns aktiv, dass wir uns lieben"],
  ["appreciation", "Unsere Kommunikation bleibt immer respektvoll"],
  ["conflicts", "Wir lösen Konflikte fair und als Team"],
  ["metime", "Wir räumen uns ausreichend Me-Time ein und machen auch Dinge ohne den anderen"],
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
  // The helper sentence needs its own second line once the card gets narrow.
  const footerCost = contentWidth < 292 ? 160 : 140;
  const budget = Math.max(130, (height - 48) * 0.88 - 56 - footerCost);
  const textHeight = (text: string) => Math.ceil(text.length / Math.max(18, Math.floor(contentWidth / 8))) * 22;
  const pages: RisikoPage[] = [];
  for (const section of [RISIKO_STATEMENTS.slice(0, 3), [...RISIKO_STATEMENTS.slice(3), RISIKO_HOT]]) {
    let page: RisikoPage = { statements: [], personKeys: [] };
    let used = 0;
    for (const statement of section) {
      const cost = textHeight(statement[1]) + 74;
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
  let used = page.statements.reduce((sum, [, text]) => sum + textHeight(text) + 74, 0);
  const titleCost = textHeight(personKeys.length > 2 ? "Wer leistet wie viel Beziehungsarbeit?" : "Verteilung der Beziehungsarbeit") + 26;
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

/** Continuous expression: -1 is sad, 0 neutral, +1 happy. */
export const scaleExpression = (value: number): number => (scaleValue(String(value)) - 50) / 50;

/** Blend the exact scale faces, positioned at 0, 25, 50, 75 and 100. */
export const scaleFaceBlend = (value: number): { index: number; mix: number } => {
  const position = scaleValue(String(value)) / 25;
  const index = Math.min(3, Math.floor(position));
  return { index, mix: position - index };
};

// Shared cubic topology lets the outline morph, rather than fade between icons.
// The anchors reproduce Angry, Frown, Meh, Smile and Laugh in the header.
const FACE_ANCHORS = [
  { eyeY: 10, brow: 1, mouth: [8,16, 8,16,9.5,14,12,14, 14.5,14,16,16,16,16, 16,16,14.5,14,12,14, 9.5,14,8,16,8,16] },
  { eyeY: 9, brow: 0, mouth: [8,16, 8,16,9.5,14,12,14, 14.5,14,16,16,16,16, 16,16,14.5,14,12,14, 9.5,14,8,16,8,16] },
  { eyeY: 9, brow: 0, mouth: [8,15, 8,15,10,15,12,15, 14,15,16,15,16,15, 16,15,14,15,12,15, 10,15,8,15,8,15] },
  { eyeY: 9, brow: 0, mouth: [8,14, 8,14,9.5,16,12,16, 14.5,16,16,14,16,14, 16,14,14.5,16,12,16, 9.5,16,8,14,8,14] },
  { eyeY: 9, brow: 0, mouth: [6,13, 6,13,9,13,12,13, 15,13,18,13,18,13, 17.51,15.9,14.94,18,12,18, 9.06,18,6.49,15.9,6,13] },
];

export function scaleFaceGeometry(value: number) {
  const { index, mix } = scaleFaceBlend(value);
  const from = FACE_ANCHORS[index];
  const to = FACE_ANCHORS[index + 1];
  const lerp = (a: number, b: number) => a + (b - a) * mix;
  return {
    eyeY: lerp(from.eyeY, to.eyeY),
    brow: lerp(from.brow, to.brow),
    mouth: from.mouth.map((coordinate, i) => lerp(coordinate, to.mouth[i])),
  };
}
