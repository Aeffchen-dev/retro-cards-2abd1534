import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { displayNameUpdate } from './partner-invitation-data.ts';

const read = relative => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

test('the shared name follows Setup: trimmed, capped, and only sent when it changed', () => {
  assert.equal(displayNameUpdate(' Jana ', ''), 'Jana');
  assert.equal(displayNameUpdate('Jana', 'Jana'), null);
  assert.equal(displayNameUpdate('   ', ''), null);
  assert.equal(displayNameUpdate('', 'Jana'), null);
  assert.equal(displayNameUpdate('a'.repeat(90), ''), 'a'.repeat(80));
});

test('the deck shares the name typed in Setup with the other person', () => {
  const deck = read('./RetroCards.tsx');
  assert.match(deck, /partnerSession\.shareName\(setupData\.name1\)/);
});

test('the session pushes the name for guests and for connected accounts', () => {
  const hook = read('../hooks/use-partner-session.tsx');
  assert.match(hook, /const shareName = useCallback/);
  assert.match(hook, /action: 'update', token: guest\.token, answers: snapshot\.current, name/);
  assert.match(hook, /display_name: name/);
  assert.match(hook, /shareName,/);
});

test('the backend stores a name that arrives with an update', () => {
  const fn = read('../../supabase/functions/guest-retro/index.ts');
  const rules = read('../../supabase/functions/guest-retro/validation.ts');
  assert.match(fn, /patch\.display_name=body\.name\.trim\(\)/);
  assert.match(rules, /action:z\.literal\('update'\).*name:z\.string\(\)\.trim\(\)\.min\(1\)\.max\(80\)\.optional\(\)/s);
});
