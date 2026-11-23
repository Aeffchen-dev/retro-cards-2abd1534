export type Point = { x: number; y: number };
export type MemojiAnswer = Point & { faceIndex?: number; answered?: boolean };
type Box = Point & { width: number; height: number };

/**
 * The first two Health Check cards share one centred face column.
 *
 * Five faces stand on one span, and the track's five grey lines fall on the
 * midpoints between neighbouring faces — so every smiley carries the line under
 * it, and none sits above the topmost one. The room between a smiley's lower
 * edge and its line is a quarter of the face-to-face distance minus the face's
 * own radius: the column has to be spread wide enough for that to read as air
 * rather than a line glued to the face (user: "health check smilies more
 * vertical space between smiley and line", after the gap had closed to 3.6px on
 * a phone).
 *
 * The span is derived from the track, not from a share of the column: the track
 * runs from the first smiley's top edge to the line under the last one, which
 * costs an eighth of a span more than the faces themselves. Deriving it that way
 * keeps the last line inside the column at every height — a plain percentage
 * span overflows the box as soon as the column grows tall.
 */
export const HC_FACE = 44;
/** Air above the first smiley and below the last line, inside the column. */
export const HC_TRACK_MARGIN = 16;
/** The track's own length in spans: the face span plus the line under the last face. */
const HC_TRACK_SPANS = 1.125;
/** The column's box, minus the two margins and the half face the last line needs. */
const HC_TRACK_BOX = `100% - ${2 * HC_TRACK_MARGIN + HC_FACE / 2}px`;

/** CSS top of the point sitting on fraction `f` (0 = first smiley, 1 = last) of the smiley span. */
export const hcSpanPoint = (f: number) =>
  `calc(${HC_TRACK_MARGIN}px + (${HC_TRACK_BOX}) * ${f / HC_TRACK_SPANS} + ${HC_FACE / 2}px)`;

/**
 * The gap in px between a smiley's lower edge and the line drawn under it, for
 * a face column `containerHeight` px tall. The line sits on the midpoint
 * between two faces, so it is half the face-to-face distance from either one.
 */
export function hcSmileyLineGap(containerHeight: number): number {
  const span = (containerHeight - 2 * HC_TRACK_MARGIN - HC_FACE / 2) / HC_TRACK_SPANS;
  return span / 8 - HC_FACE / 2;
}

// The resting positions are placeholders, not answers. Older saved drags did
// not carry `answered`, so a non-resting position still counts as an answer.
const RESTING_POSITIONS = new Set(["248,64", "248,136", "380,120", "380,192"]);

export function hasHealthCheckAnswer(position: MemojiAnswer | undefined): boolean {
  if (!position) return false;
  return position.answered === true || position.faceIndex !== undefined ||
    !RESTING_POSITIONS.has(`${position.x},${position.y}`);
}

export function shouldShowPartnerMemoji(own: MemojiAnswer | undefined, partner: MemojiAnswer | undefined): boolean {
  return hasHealthCheckAnswer(own) && hasHealthCheckAnswer(partner);
}

export type LabelSide = 'above' | 'below';

/**
 * Which side of the partner's emoji their name rides on.
 *
 * The name reads under the emoji, but the smiley rows sit closer together than
 * one emoji is tall (rows 51px apart, markers 56px) — so when your own emoji is
 * the row directly beneath the partner's, a name underneath would land on its
 * head. There it rides above instead.
 */
export function partnerLabelSide(
  partner: MemojiAnswer | undefined,
  own: MemojiAnswer | undefined,
  markerSize = 56,
): LabelSide {
  if (!partner || !own) return 'below';
  const dy = own.y - partner.y;
  const dx = Math.abs(own.x - partner.x);
  return dy > 0 && dy < markerSize && dx < markerSize ? 'above' : 'below';
}

export function besideSmiley(face: Box, container: Box, memojiSize = 56): Point {
  return {
    x: Math.max(0, Math.min(container.width - memojiSize, face.x - container.x + face.width + 16)),
    // The first/last smiley sit at the edges; centering may extend into the
    // scale's vertical margin, but never out of the card.
    y: face.y - container.y + (face.height - memojiSize) / 2,
  };
}

export function nearestMemoji(positions: Record<string, Point>, target: Point): string | undefined {
  return Object.keys(positions).reduce<string | undefined>((nearest, key) => {
    const point = positions[key];
    const previous = nearest === undefined ? undefined : positions[nearest];
    return !previous || Math.hypot(point.x - target.x, point.y - target.y) < Math.hypot(previous.x - target.x, previous.y - target.y)
      ? key : nearest;
  }, undefined);
}