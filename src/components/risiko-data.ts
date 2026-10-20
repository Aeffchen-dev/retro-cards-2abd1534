export const RISIKO_STATEMENTS = [
  ["self", "Ich kann mit dir ich selbst sein und fühle mich gesehen und respektiert"],
  ["love", "Wir zeigen uns aktiv, dass wir uns lieben"],
  ["appreciation", "Unsere Kommunikation bleibt immer respektvoll"],
  ["conflicts", "Wir lösen Konflikte fair und als Team"],
  ["metime", "Wir räumen einander ausreichend Me-Time ein und machen auch Dinge ohne den anderen"],
  ["quality", "Wir verbringen genug Quality Time"],
] as const;

export const RISIKO_HOT = ["hot", "Wir geben uns gegenseitig das Gefühl sexy und begehrt zu sein und unser Sexleben erfüllt uns beide"] as const;

export interface RisikoPage {
  statements: (readonly [string, string])[];
  personKeys: string[];
}

/** Keep the two sections separate, and add pages rather than shrink or scroll. */
export function risikoPages(personKeys: string[], height: number, width: number): RisikoPage[] {
  const contentWidth = Math.max(180, Math.min(500, width - 48) - 56);
  // The helper sentence needs its own second line once the card gets narrow.
  const footerCost = contentWidth < 292 ? 160 : 140;
  // 72 = smiley header with its tiny end labels plus the card's top padding.
  const budget = Math.max(130, (height - 48) * 0.88 - 72 - footerCost);
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
  // One shared line plus a wrapping row of individually selectable shares.
  const shareRows = Math.ceil(personKeys.length / Math.max(1, Math.floor(contentWidth / 110)));
  const allocationCost = textHeight("Wer leistet wie viel der Beziehungsarbeit?") + 64 + shareRows * 32;
  if (personKeys.length) {
    if (used && used + allocationCost > budget) {
      page = { statements: [], personKeys: [] };
      pages.push(page);
      used = 0;
    }
    page.personKeys = [...personKeys];
    used += allocationCost;
  }
  return pages;
}


/** 0 = sad (left) … 100 = happy (right); default neutral middle. */
export const scaleValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};

/** Largest-remainder rounding keeps integer percentages at exactly the target. */
function distributeShares(keys: string[], weights: number[], target: number): Record<string, number> {
  if (!keys.length) return {};
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map(weight => target * (total > 0 ? weight / total : 1 / keys.length));
  const rounded = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const remainder = target - rounded.reduce((sum, value) => sum + value, 0);
  for (const { index } of order.slice(0, remainder)) rounded[index] += 1;
  return Object.fromEntries(keys.map((key, index) => [key, rounded[index]]));
}

/** Normalize old independent values; new partners start with equal weights. */
export function workloadShares(keys: string[], stored: Record<string, string>): Record<string, number> {
  return distributeShares(keys, keys.map(key => scaleValue(stored[`work_${key}`] ?? stored.allocation)), 100);
}

/** Keep the dragged share exact and distribute the remainder among the others. */
export function adjustWorkloadShares(keys: string[], current: Record<string, number>, key: string, value: number): Record<string, number> {
  if (!keys.includes(key)) return current;
  if (keys.length === 1) return { [key]: 100 };
  const share = Math.round(scaleValue(String(value)));
  const others = keys.filter(other => other !== key);
  return { ...distributeShares(others, others.map(other => current[other] ?? 0), 100 - share), [key]: share };
}

/** Contiguous widths, shared by screen and print. */
export function workloadSegments(keys: string[], shares: Record<string, number>) {
  let start = 0;
  return keys.map(key => {
    const width = shares[key] ?? 0;
    const segment = { key, start, end: start + width, width };
    start += width;
    return segment;
  });
}

/** Move a divider: only the two adjoining widths change, never their total. */
export function adjustWorkloadBoundary(keys: string[], shares: Record<string, number>, index: number, value: number) {
  const segments = workloadSegments(keys, shares);
  const left = segments[index];
  const right = segments[index + 1];
  if (!left || !right) return shares;
  const boundary = Math.max(left.start, Math.min(right.end, Math.round(value)));
  return { ...shares, [left.key]: boundary - left.start, [right.key]: right.end - boundary };
}

/** Continuous expression: -1 is sad, 0 neutral, +1 happy. */
export const scaleExpression = (value: number): number => (scaleValue(String(value)) - 50) / 50;

/** Blend the four scale faces, evenly positioned from 0 to 100. */
export const scaleFaceBlend = (value: number): { index: number; mix: number } => {
  const position = scaleValue(String(value)) * 3 / 100;
  const index = Math.min(2, Math.floor(position));
  return { index, mix: position - index };
};

// Shared cubic topology lets the outline morph, rather than fade between icons.
// The anchors reproduce Frown, Meh, Smile and Laugh in the header.
const FACE_ANCHORS = [
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
