import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sharedStrengths, talkTopics } from './retro-summary.ts';
const t = (id, own, partner) => ({ id, title: id, own, partner });
test('strengths need both partners at 4 or more', () => {
  assert.deepEqual(sharedStrengths([t('love', 5, 4), t('fun', 5, 3)], true), ['love']);
});
test('talk topics: a 2 or lower, or two points apart', () => {
  assert.deepEqual(talkTopics([t('love', 2, 4), t('fun', 5, 3), t('time', 4, 3)]).map(x => x.title), ['love', 'fun']);
});
