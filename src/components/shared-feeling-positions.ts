import { hasHealthCheckAnswer, type MemojiAnswer } from './health-check-position';

export type SharedFeelingPosition = MemojiAnswer & {
  sharedMemberId?: string; sharedSessionId?: string; revision?: number; editor?: string;
  xRatio?: number; yRatio?: number;
};
export type FeelingPositions = Record<number, Record<string, SharedFeelingPosition>>;
type Source = { memberId: string; positions: FeelingPositions };

/** Resolve each person's marker independently, including edits made by their partner. */
export function mergeFeelingPositions(local: FeelingPositions, sources: Source[], sessionId: string, ownId: string, partnerId: string): FeelingPositions {
  let result = local;
  for (const card of [1, 2]) {
    for (const [key, memberId] of [['p0', ownId], ['p1', partnerId]]) {
      let best = local[card]?.[key];
      // An old room's metadata cannot compete with the current room's markers.
      if (best?.sharedSessionId && best.sharedSessionId !== sessionId) best = undefined;
      for (const source of sources) {
        for (const [sourceKey, candidate] of Object.entries(source.positions[card] ?? {})) {
          const id = candidate.sharedMemberId ?? (sourceKey === 'p0' ? source.memberId : undefined);
          if (id !== memberId || (candidate.sharedSessionId && candidate.sharedSessionId !== sessionId) || !hasHealthCheckAnswer(candidate)) continue;
          const revision = candidate.revision ?? 0;
          if (!best || !hasHealthCheckAnswer(best) || revision > (best.revision ?? 0) || (revision === (best.revision ?? 0) && (candidate.editor ?? '') > (best.editor ?? ''))) best = candidate;
        }
      }
      if (best && JSON.stringify(best) !== JSON.stringify(local[card]?.[key])) {
        result = { ...result, [card]: { ...result[card], [key]: best } };
      }
    }
  }
  return result;
}

export function moveFeelingPosition(local: FeelingPositions, card: number, key: string, point: MemojiAnswer, bounds: { w: number; h: number }, sessionId?: string | null, memberId?: string, editor = 'local', now = Date.now()): FeelingPositions {
  const previous = local[card]?.[key];
  return { ...local, [card]: { ...local[card], [key]: {
    ...point, answered: true,
    ...(sessionId && memberId ? {
      sharedSessionId: sessionId, sharedMemberId: memberId,
      revision: Math.max(now, (previous?.revision ?? 0) + 1), editor,
      xRatio: point.x / Math.max(1, bounds.w), yRatio: point.y / Math.max(1, bounds.h),
    } : {}),
  } } };
}