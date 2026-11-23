import { expect, test } from 'bun:test';
import { mergeFeelingPositions, moveFeelingPosition } from './shared-feeling-positions';
const bounds = { w: 300, h: 400 };
const move = (state, card, key, who, editor, x, y, now) => moveFeelingPosition(state, card, key, { x, y }, bounds, 'room', who, editor, now);
test('either partner can move both emojis on both feeling cards', () => {
  let host = {}, guest = {};
  for (const card of [1, 2]) {
    host = move(host, card, 'p0', 'host', 'host', 60, 100, 10);
    host = move(host, card, 'p1', 'guest', 'host', 80, 200, 11);
    guest = mergeFeelingPositions(guest, [{ memberId: 'host', positions: host }], 'room', 'guest', 'host');
    expect(guest[card].p0.y).toBe(200); expect(guest[card].p1.y).toBe(100);
    guest = move(guest, card, 'p0', 'guest', 'guest', 90, 250, 12);
    guest = move(guest, card, 'p1', 'host', 'guest', 70, 150, 13);
    host = mergeFeelingPositions(host, [{ memberId: 'guest', positions: guest }], 'room', 'host', 'guest');
    expect(host[card].p0.y).toBe(150); expect(host[card].p1.y).toBe(250);
  }
});
test('stale replies do not undo a move and independent concurrent moves are retained', () => {
  const original = move({}, 1, 'p0', 'host', 'host', 60, 100, 10);
  const host = move(original, 1, 'p0', 'host', 'host', 70, 150, 11);
  const guest = move({}, 1, 'p0', 'guest', 'guest', 80, 200, 11);
  const merged = mergeFeelingPositions(host, [{ memberId: 'guest', positions: guest }], 'room', 'host', 'guest');
  expect([merged[1].p0.y, merged[1].p1.y]).toEqual([150, 200]);
  expect(mergeFeelingPositions(merged, [{ memberId: 'host', positions: original }], 'room', 'host', 'guest')).toBe(merged);
});
test('dragging clears a saved face anchor and carries proportional placement across screen sizes', () => {
  const saved = { 1: { p1: { x: 60, y: 100, faceIndex: 2 } } };
  const updated = move(saved, 1, 'p1', 'guest', 'host', 150, 200, 10);
  expect(updated[1].p1.faceIndex).toBeUndefined();
  expect([updated[1].p1.xRatio, updated[1].p1.yRatio]).toEqual([0.5, 0.5]);
});
test('legacy own answers migrate while foreign room positions and unrelated scales stay untouched', () => {
  const local = { 105: { p0: { x: 5, y: 5 } } };
  const legacy = { 1: { p0: { x: 60, y: 100, answered: true } } };
  const merged = mergeFeelingPositions(local, [{ memberId: 'guest', positions: legacy }], 'room', 'host', 'guest');
  expect(merged[1].p1.y).toBe(100); expect(merged[105]).toBe(local[105]);
  expect(mergeFeelingPositions({}, [{ memberId: 'guest', positions: move({}, 1, 'p0', 'guest', 'guest', 80, 200, 11) }], 'other', 'host', 'guest')).toEqual({});
});