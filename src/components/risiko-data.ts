export const RISIKO_STATEMENTS = [
  ["self", "Ich kann in deiner Gegenwart so sein wie ich bin und fühle mich gesehen und respektiert"],
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
/** Split the statements over cards of `perPage` statements each. A card that is
 *  too short for two asks for one, so the second statement is never clipped away. */
export function risikoPages(personKeys: string[], perPage: number = RISIKO_PER_PAGE): RisikoPage[] {
  const all = [...RISIKO_STATEMENTS, RISIKO_HOT];
  const size = Math.max(1, Math.min(Math.floor(perPage) || RISIKO_PER_PAGE, all.length));
  const pages: RisikoPage[] = [];
  for (let i = 0; i < all.length; i += size) pages.push({ statements: all.slice(i, i + size), personKeys: [] });
  if (personKeys.length) pages.push({ statements: [], personKeys: [...personKeys] });
  return pages;
}



/** 0 = sad (left) … 100 = happy (right); default neutral middle. */
export const scaleValue = (stored?: string): number => {
  const value = stored?.trim() ? Number(stored) : 50;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
};

/** How far the circle's centre stops short of each scale end. The scale spans its
 *  whole container, so the inset is the circle's own radius: at 0 and 100 its edge
 *  lands exactly on the container's edges — fully visible, never cut off, never
 *  reaching past the card. */
export const scaleEndInset = (markerSize: number): number => markerSize / 2;

/** The circle's centre at a scale value, measured from the end of the travel. The
 *  smileys and the dashed guides are placed with the same maths, so the circle
 *  always sits exactly under the face it points at; the value is continuous, so it
 *  can stop anywhere in between. */
export const markerInset = (value: number, endInset: number): number =>
  endInset - (scaleValue(String(value)) * (2 * endInset)) / 100;

/** Grey column bands for a scale with `faces` smileys: one band per smiley, as
 *  [start, end] scale values. The bands sit directly against each other and
 *  together span the whole scale from edge to edge, so the row of fields fills
 *  its container with nothing showing between them. */
export const columnBands = (faces: number): [number, number][] => {
  if (faces < 1) return [];
  // One equal band per face, together filling the scale's full width; each
  // face sits in the middle of its own band. Positions are container %.
  const width = 100 / faces;
  return Array.from({ length: faces }, (_, i) => [i * width, (i + 1) * width] as [number, number]);
};

/** One label per scale column, from the leftmost field to the rightmost: the five
 *  faces the circle can rest under, named in the couple's own words. Screen and
 *  print read the same list, so the printed page never disagrees with the card. */
export const SCALE_CAPTIONS = [
  "Trifft noch nie zu",
  "Trifft selten zu",
  "Trifft teilweise zu",
  "Trifft oft zu",
  "Trifft immer zu",
] as const;

/** On a narrow phone one column is only ~48px wide, so "teilweise" cannot fit on a
 *  line of its own. Without a break point the browser splits it mid-word without a
 *  hyphen ("Teilweis" / "e"). The correct German break point is offered as a soft
 *  hyphen instead: it stays invisible wherever the word fits and prints as a real
 *  hyphen ("Teil-" / "weise") only when the column really is tight. The split sits
 *  inside the word, so the label keeps whatever capitalisation it was written with. */
export const softHyphenate = (caption: string) => caption.replace("eilweise", "eil\u00ADweise");



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
/** The mouth's four cubic segments as one open stroke — the very same trace the
 *  small scale faces draw, so the dragged dot and the smiley never disagree. */
export const mouthPath = (mouth: number[]) =>
  `M ${mouth.slice(0, 2).join(" ")} ${[2, 8, 14, 20].map(i => `C ${mouth.slice(i, i + 6).join(" ")}`).join(" ")}`;

/** The crying face's tear — shared by the scale face and the dot so both draw
 *  the same drop: full at the sad end, shrinking to nothing at 25. It hangs a
 *  little out from the eye so its bulb stays clear of the open downturn below. */
export const CRYING_TEAR = 0.6;
export const TEAR_SHIFT = [-1, 0.3];
/** `hang` drops the tear a little lower: the dragged dot draws heavier eyes, so
 *  its drop has to start further down to hang from the eye instead of inside it. */
export const tearTransform = (tear: number, hang: [number, number] = [0, 0]) =>
  `translate(${TEAR_SHIFT[0] + hang[0]} ${TEAR_SHIFT[1] + hang[1]}) translate(8.9 9.7) scale(${tear}) translate(-8.9 -9.7)`;

// The laughing mouth flipped about the face's midline (y → 30 − y): the same
// wide, open curve turned into a downturn. The sad face next to it is the happy
// smile flipped the same way — each sad face is its happy twin in negative.
export const CRYING_MOUTH = [6,17, 6,17,9,17,12,17, 15,17,18,17,18,17, 17.51,14.1,14.94,12,12,12, 9.06,12,6.49,14.1,6,17];

const FACE_ANCHORS = [
  // Crying: the laughing mouth in negative, the same round-dot eyes, no brows,
  // and the single tear under the left eye — what sets it apart from the sad
  // face next to it.
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: CRYING_TEAR, mouth: CRYING_MOUTH },

  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,16, 8,16,9.5,14,12,14, 14.5,14,16,16,16,16, 16,16,14.5,14,12,14, 9.5,14,8,16,8,16] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,15, 8,15,10,15,12,15, 14,15,16,15,16,15, 16,15,14,15,12,15, 10,15,8,15,8,15] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [8,14, 8,14,9.5,16,12,16, 14.5,16,16,14,16,14, 16,14,14.5,16,12,16, 9.5,16,8,14,8,14] },
  { eye: [9, 9, 9.01, 9, 15, 9, 15.01, 9], eyeW: 1.5, brow: 0, tear: 0, mouth: [6,13, 6,13,9,13,12,13, 15,13,18,13,18,13, 17.51,15.9,14.94,18,12,18, 9.06,18,6.49,15.9,6,13] },
];

/** Every partner reserves one band on the work-split line: its own circle and
 *  room for its centred name. Adjacent circles always sit exactly one band
 *  apart, touching with no margin between them. The band may never
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
