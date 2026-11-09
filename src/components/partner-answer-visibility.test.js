import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { revealSelection } from './partner-answer-visibility';

test('intimacy and other selections stay hidden until an own answer exists', () => {
  for (const own of [undefined, null, '']) assert.equal(revealSelection(own, '75'), undefined);
  assert.equal(revealSelection('0', '75'), '75');
});
test('feeling selections are revealed only after an own selection', () => {
  assert.equal(revealSelection(undefined, '🙂'), undefined);
  assert.equal(revealSelection(0, '🙂'), '🙂');
});