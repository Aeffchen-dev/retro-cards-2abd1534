import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isTextEntryTarget, samePartnerMembers } from '../hooks/partner-live-data.ts';

const read = relative => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

test('only active writing fields defer incoming partner repaints', () => {
  assert.equal(isTextEntryTarget({ tagName: 'TEXTAREA' }), true);
  assert.equal(isTextEntryTarget({ tagName: 'INPUT', type: 'text' }), true);
  assert.equal(isTextEntryTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTextEntryTarget({ tagName: 'INPUT', type: 'checkbox' }), false);
  assert.equal(isTextEntryTarget({ tagName: 'BUTTON' }), false);
  assert.equal(isTextEntryTarget(null), false);
});

test('unchanged polling responses retain the current member array', () => {
  const current = [{ user_id: 'a', display_name: 'Jana', answers: { postIts: { p0: 'Hallo' } } }];
  assert.equal(samePartnerMembers(current, JSON.parse(JSON.stringify(current))), true);
  assert.equal(samePartnerMembers(current, [{ ...current[0], display_name: 'Niklas' }]), false);
});

test('writing and Setup fields disable automatic capitals, correction and spelling changes', () => {
  for (const file of ['./PostItField.tsx', './RetroCards.tsx', './EmojiPicker.tsx']) {
    const source = read(file);
    assert.match(source, /autoCapitalize="none"/, file);
    assert.match(source, /autoCorrect="off"/, file);
    assert.match(source, /spellCheck=\{false\}/, file);
  }
});

test('typing activity is shared through a ref instead of repainting the deck', () => {
  const deck = read('./RetroCards.tsx');
  assert.match(deck, /const typingAt = useRef\(0\)/);
  assert.match(deck, /partnerSession\.shareTyping\(now\)/);
  assert.doesNotMatch(deck, /setTypingAt/);
});

test('own write replies and name replies do not repaint member state', () => {
  const hook = read('../hooks/use-partner-session.tsx');
  const publish = hook.slice(hook.indexOf('const publish ='), hook.indexOf('const shareTyping ='));
  const shareName = hook.slice(hook.indexOf('const shareName ='), hook.indexOf('const connect ='));
  assert.doesNotMatch(publish, /setMembers/);
  assert.doesNotMatch(shareName, /setMembers/);
  assert.match(shareName, /nameTimer\.current = setTimeout/);
});

test('incoming room state is held while a field is focused and flushed on focusout', () => {
  const hook = read('../hooks/use-partner-session.tsx');
  assert.match(hook, /if \(isTextEntryTarget\(document\.activeElement\)\) \{ pendingMembers\.current = next; return; \}/);
  assert.match(hook, /document\.addEventListener\('focusout', flush\)/);
  assert.match(hook, /document\.removeEventListener\('focusout', flush\)/);
});
