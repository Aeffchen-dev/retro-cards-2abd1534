export type Point = { x: number; y: number };
export type MemojiAnswer = Point & { faceIndex?: number; answered?: boolean };
type Box = Point & { width: number; height: number };

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