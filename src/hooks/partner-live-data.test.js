import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { updatePartnerMember } from './partner-live-data';

test('incoming partner edits replace remote answers without overwriting own answers', () => {
  const own = {user_id:'self',answers:{text:'Mein Text'}};
  const oldPartner = {user_id:'other',answers:{text:'Vorher'}};
  const result = updatePartnerMember([own, oldPartner], {user_id:'other',answers:{text:'Live geändert'}});
  assert.equal(result[0], own);
  assert.equal(result[1].answers.text, 'Live geändert');
  assert.equal(oldPartner.answers.text, 'Vorher');
});
test('newly joined partner is added without duplicating existing members', () => {
  const own={user_id:'self'};
  const result=updatePartnerMember([own], {user_id:'other'});
  assert.equal(result.length,2);
  assert.equal(updatePartnerMember(result,{user_id:'other'}).length,2);
});