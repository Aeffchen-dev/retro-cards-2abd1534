export const RISIKO_STATEMENTS = [
  ["self", "Ich kann mit dir ich selbst sein und fühle mich gesehen und respektiert"],
  ["love", "Wir zeigen uns aktiv, dass wir uns lieben"],
  ["appreciation", "Unsere Kommunikation bleibt immer respektvoll"],
  ["conflicts", "Wir lösen Konflikte fair und als Team"],
  ["metime", "Wir räumen einander ausreichend Me-Time ein und machen auch mal Dinge ohne den anderen"],
  ["quality", "Wir nehmen uns auch im Alltag Zeit für gemeinsame Erlebnisse und schaffen Nähe, bleiben neugierig auf das, was uns bewegt, und unterstützen einander dabei zu wachsen"],
] as const;

export const RISIKO_HOT = ["hot", "Wir geben uns gegenseitig das Gefühl sexy und begehrt zu sein und unser Sexleben erfüllt uns beide"] as const;

/** The display-size question on the card that asks about the work split. */
export const RISIKO_ALLOCATION_HEADING = "Wer leistet aktuell wie viel der Beziehungsarbeit?";

export interface RisikoPage {
  statements: (readonly [string, string])[];
  personKeys: string[];
}

/** Two statements per card, each with its own scale. */
export const RISIKO_PER_PAGE = 2;
export function risikoPages(personKeys: string[]): RisikoPage[] {
  const all = [...RISIKO_STATEMENTS, RISIKO_HOT];
  const pages: RisikoPage[] = [];
  for (let i = 0; i < all.length; i += RISIKO_PER_PAGE) pages.push({ statements: all.slice(i, i + RISIKO_PER_PAGE), personKeys: [] });
  if (personKeys.length) pages.push({ statements: [], personKeys: [...personKeys] });
  return pages;
}


/** 0 = sad (left) … 100 = happy (right); default neutral middle. */
export const scaleValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};

/** The circle's centre sits half a face in from each end, so it lines up with the
 *  outer smileys. The value is continuous, so it can stop anywhere in between. */
export const markerInset = (value: number, endInset: number): number =>
  endInset - (scaleValue(String(value)) * (2 * endInset)) / 100;

/** Dashed guideline positions for a scale with `faces` smileys: one under each
 *  face and one midway between neighbours, as scale values. */
export const guidePositions = (faces: number): number[] => {
  if (faces < 2) return [0];
  const step = 100 / (faces - 1);
  return Array.from({ length: faces * 2 - 1 }, (_, i) => (i * step) / 2);
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

/** Blend the five scale faces, evenly positioned from 0 to 100. */
export const scaleFaceBlend = (value: number): { index: number; mix: number } => {
  const position = scaleValue(String(value)) * 4 / 100;
  const index = Math.min(3, Math.floor(position));
  return { index, mix: position - index };
};

// Shared cubic topology lets the outline morph, rather than fade between icons.
// The anchors reproduce SadFace, Frown, Meh, Smile and Laugh in the header. An
// eye is one stroke (x1,y1 → x2,y2); a dot is the same stroke with no length.
const FACE_ANCHORS = [
  // Crying: eyes squeezed shut and slanting down to the nose, a tear hanging
  // below each eye, inner brows raised and a deeper downturn than the sad face.
  { eye: [7.2, 8.4, 10.2, 9.7, 16.8, 8.4, 13.8, 9.7], eyeW: 1.2, brow: 1, tear: 1, mouth: [8,18.2, 8,18.2,9.5,15.2,12,15.2, 14.5,15.2,16,18.2,16,18.2, 16,18.2,14.5,15.2,12,15.2, 9.5,15.2,8,18.2,8,18.2] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,16, 8,16,9.5,14,12,14, 14.5,14,16,16,16,16, 16,16,14.5,14,12,14, 9.5,14,8,16,8,16] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,15, 8,15,10,15,12,15, 14,15,16,15,16,15, 16,15,14,15,12,15, 10,15,8,15,8,15] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,14, 8,14,9.5,16,12,16, 14.5,16,16,14,16,14, 16,14,14.5,16,12,16, 9.5,16,8,14,8,14] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [6,13, 6,13,9,13,12,13, 15,13,18,13,18,13, 17.51,15.9,14.94,18,12,18, 9.06,18,6.49,15.9,6,13] },
];

/** Every partner reserves one band on the work-split line: its own circle, room
 *  for its centred name and clear air to the neighbour's circle. Adjacent circles
 *  always sit exactly one band apart, so they never touch. The band may never
 *  grow past the share of the lane each partner can use — otherwise the circles
 *  would run out of room to move. */
export const workloadBand = (slot: number, maxBand: number, count: number): string =>
  `min(${maxBand}px, calc((100cqw - ${slot}px) / ${Math.max(1, count)}))`;

export function scaleFaceGeometry(value: number) {
  const { index, mix } = scaleFaceBlend(value);
  const from = FACE_ANCHORS[index];
  const to = FACE_ANCHORS[index + 1];
  const lerp = (a: number, b: number) => a + (b - a) * mix;
  return {
    eye: from.eye.map((coordinate, i) => lerp(coordinate, to.eye[i])),
    eyeW: lerp(from.eyeW, to.eyeW),
    brow: lerp(from.brow, to.brow),
    tear: lerp(from.tear, to.tear),
    mouth: from.mouth.map((coordinate, i) => lerp(coordinate, to.mouth[i])),
  };
}
