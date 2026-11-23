import { expect, test } from 'bun:test';
import { editSharedSetupData, mergeSharedSetupData } from './shared-setup-data';

const empty = () => ({ name1: '', name2: '', emoji1: '', emoji2: '', openRelationship: false, extraPartners: [] });
const seed = () => mergeSharedSetupData({ ...empty(), name1: 'Alex', name2: 'Chris', emoji1: '🐶', emoji2: '🐱' }, [], 'room', 0, 'host');
const merge = (local, other, index) => mergeSharedSetupData(local, [other], 'room', index, 'host');

test('both devices see the inviting Setup names and emojis in their own orientation', () => {
  const guest = merge(empty(), seed(), 1);
  expect([guest.name1, guest.name2, guest.emoji1, guest.emoji2]).toEqual(['Chris', 'Alex', '🐱', '🐶']);
});
test('either partner can edit the other name and emoji for both devices', () => {
  const host = seed();
  const guest = editSharedSetupData(merge(empty(), host, 1), { name2: 'Robin', emoji2: '🦊' }, 1, 'guest', 100);
  const updated = merge(host, guest, 0);
  expect(updated.name1).toBe('Robin'); expect(updated.emoji1).toBe('🦊');
  expect(merge(guest, updated, 1).name2).toBe('Robin');
});
test('independent simultaneous name edits merge without losing either change or reverting on stale polling', () => {
  const original = seed();
  const host = editSharedSetupData(original, { name1: 'alex' }, 0, 'host', 100);
  const guest = editSharedSetupData(merge(empty(), original, 1), { name1: 'chris' }, 1, 'guest', 100);
  const updated = merge(host, guest, 0);
  expect([updated.name1, updated.name2]).toEqual(['alex', 'chris']);
  expect(merge(updated, original, 0)).toBe(updated);
});
test('adding, editing and removing partners is shared with every joined device', () => {
  let host = editSharedSetupData(seed(), { extraPartners: [{ name: 'Sam', emoji: '🦉' }, { name: 'Lee', emoji: '🐸' }] }, 0, 'host', 100);
  let guest = merge(empty(), host, 1);
  expect(guest.extraPartners).toEqual([{ name: 'Sam', emoji: '🦉' }, { name: 'Lee', emoji: '🐸' }]);
  expect(merge(empty(), host, 2).name1).toBe('Sam');
  guest = editSharedSetupData(guest, { extraPartners: [guest.extraPartners[1]] }, 1, 'guest', 101);
  host = merge(host, guest, 0);
  expect(host.extraPartners).toEqual([{ name: 'Lee', emoji: '🐸' }]);
});
test('relationship state syncs in both directions and survives serialized reload', () => {
  const host = editSharedSetupData(seed(), { openRelationship: true }, 0, 'host', 100);
  const guest = editSharedSetupData(merge(empty(), host, 1), { openRelationship: false }, 1, 'guest', 101);
  expect(merge(JSON.parse(JSON.stringify(host)), guest, 0).openRelationship).toBe(false);
});
test('an old room cannot overwrite a new room Setup', () => {
  expect(mergeSharedSetupData(empty(), [seed()], 'new-room', 1, 'new-owner').sharedSetup).toBeUndefined();
});