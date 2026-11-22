import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { partnerDisplayName } from './partner-live-data';
test('Setup name wins', () => assert.equal(partnerDisplayName('Gast', 'Jana'), 'Jana'));
test('Gast fallback never shown', () => { assert.equal(partnerDisplayName('Gast', ''), 'Partner'); assert.equal(partnerDisplayName('Gast B'), 'Partner'); });
test('the name beside the invitation is used until the partner enters their own', () => {
  assert.equal(partnerDisplayName('Gast', '', 'Sam'), 'Sam');
  assert.equal(partnerDisplayName('Gast B', '   ', '  Sam  '), 'Sam');
});
test('the partner’s own Setup name still wins over the invitation name', () => {
  assert.equal(partnerDisplayName('Gast', 'Sammy', 'Sam'), 'Sammy');
});
