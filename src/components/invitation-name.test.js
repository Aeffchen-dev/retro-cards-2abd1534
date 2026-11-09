import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { invitationName } from './partner-invitation-data';

test('creating an invitation requires no entered name', () => {
  assert.equal(invitationName(''), 'Gast');
  assert.equal(invitationName('   '), 'Gast');
});

test('creating an invitation reuses the existing name', () => {
  assert.equal(invitationName(' Jana '), 'Jana');
});