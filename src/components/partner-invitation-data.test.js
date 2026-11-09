import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { invitationStatus, canResendInvitation } from './partner-invitation-data';

test('invitation is accepted only when another member has joined', () => {
  assert.equal(invitationStatus('retro', 'self', [{user_id:'self'}], true), 'pending');
  assert.equal(invitationStatus('retro', 'self', [{user_id:'self'}, {user_id:'other'}], true), 'accepted');
});
test('status remains loading until membership has been read', () => {
  assert.equal(invitationStatus('retro', 'self', [], false), 'loading');
  assert.equal(invitationStatus(null, 'self', [], true), 'unavailable');
  assert.equal(invitationStatus('retro', undefined, [], true), 'unavailable');
});
test('only a pending invitation with an existing link can be resent', () => {
  assert.equal(canResendInvitation('pending', 'existing-code'), true);
  for (const state of ['accepted', 'loading', 'unavailable']) assert.equal(canResendInvitation(state, 'existing-code'), false);
  assert.equal(canResendInvitation('pending', ''), false);
});