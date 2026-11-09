import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { moodValue, moodChange, revealedMood } from './mood-check-data';

test('before and after mood change requires both actual answers', () => {
  assert.equal(moodChange(undefined, '75'), null);
  assert.equal(moodChange('25', ''), null);
  assert.equal(moodChange('25', '75'), 50);
  assert.equal(moodChange('75', '25'), -50);
  assert.equal(moodChange('50', '50'), 0);
});
test('mood scale retains continuous bounded answers including the lowest value', () => {
  assert.equal(moodValue('0'), 0);
  assert.equal(moodValue('63'), 63);
  assert.equal(moodValue('100'), 100);
  for (const value of ['', undefined, '-1', '101', 'NaN']) assert.equal(moodValue(value), null);
});
test('partner mood is hidden until the matching own answer exists', () => {
  assert.deepEqual(revealedMood({ before: '0' }, { before: '80', after: '90' }), { before: 80, after: null });
  assert.deepEqual(revealedMood({}, { before: '80', after: '90' }), { before: null, after: null });
});
test('partner changes never overwrite the own mood', () => {
  const own = { before: '25', after: '75' };
  assert.deepEqual(revealedMood(own, { before: '100', after: '0' }), { before: 100, after: 0 });
  assert.deepEqual(own, { before: '25', after: '75' });
  assert.equal(moodChange(own.before, own.after), 50);
});