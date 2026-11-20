import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const deck = readFileSync(fileURLToPath(new URL('./RetroCards.tsx', import.meta.url)), 'utf8');
const listener = deck.slice(deck.indexOf('const onInput = (e: Event)'), deck.indexOf('// State for setup'));

test('typing activity cannot reset a controlled field before React reads its first character', () => {
  assert.match(listener, /document\.addEventListener\('input', onInput\);/);
  assert.match(listener, /document\.removeEventListener\('input', onInput\);/);
  assert.doesNotMatch(listener, /addEventListener\('input', onInput, true\)/);
});

test('phone autocorrect composition is not interrupted by the typing indicator', () => {
  assert.match(listener, /if \(\(e as InputEvent\)\.isComposing\) return;/);
});
