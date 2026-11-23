import { expect, test } from 'bun:test';
import { mergeSharedSetupChoice, toggleSharedSetupChoice } from './shared-setup-choice';

test('either partner can turn Nicht monogam on and off for both devices', () => {
  let host = { openRelationship: false, name1: 'Jana' };
  let guest = { openRelationship: false, name1: 'Niklas' };
  host = toggleSharedSetupChoice(host, guest, 'host', 100);
  guest = mergeSharedSetupChoice(guest, host, false);
  expect(guest.openRelationship).toBe(true);
  guest = toggleSharedSetupChoice(guest, host, 'guest', 101);
  host = mergeSharedSetupChoice(host, guest, true);
  expect(host.openRelationship).toBe(false);
  expect(host.name1).toBe('Jana');
  expect(guest.name1).toBe('Niklas');
});

test('delayed polling and echoed edits cannot revert a newer choice', () => {
  const old = { openRelationship: true, openRelationshipRevision: 100, openRelationshipEditor: 'host' };
  const current = toggleSharedSetupChoice(old, old, 'guest', 101);
  expect(mergeSharedSetupChoice(current, old, true)).toBe(current);
  expect(mergeSharedSetupChoice(current, current, false)).toBe(current);
  expect(current.openRelationship).toBe(false);
});

test('a newly joined guest inherits the inviting partner legacy checkbox', () => {
  expect(mergeSharedSetupChoice({ openRelationship: false }, { openRelationship: true }, false).openRelationship).toBe(true);
  expect(mergeSharedSetupChoice({ openRelationship: true }, { openRelationship: false }, true).openRelationship).toBe(true);
});

test('simultaneous edits converge and slow clocks advance the shared revision', () => {
  const a = { openRelationship: true, openRelationshipRevision: 100, openRelationshipEditor: 'a' };
  const b = { openRelationship: false, openRelationshipRevision: 100, openRelationshipEditor: 'b' };
  expect(mergeSharedSetupChoice(a, b, true).openRelationship).toBe(false);
  expect(mergeSharedSetupChoice(b, a, false).openRelationship).toBe(false);
  expect(toggleSharedSetupChoice(b, a, 'a', 10).openRelationshipRevision).toBe(101);
});