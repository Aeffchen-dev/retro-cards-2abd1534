import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseHistoryResults, historyScore, chronologicalHistory } from './health-history-data';
test('historical scores preserve eight 1–5 ratings per partner', () => {
  const people = [{id:'a',name:'A',scores:Array(8).fill(1)},{id:'b',name:'B',scores:Array(8).fill(5)}];
  assert.deepEqual(parseHistoryResults({people}), {people});
  assert.equal(parseHistoryResults({people:[{...people[0],scores:[1]}]}),null);
  assert.equal(parseHistoryResults({people:[{...people[0],scores:Array(8).fill(6)}]}),null);
});
test('trends use chronological retro order without changing saved answers', () => {
  const rows = [{id:'new',recorded_at:'2026-11-09'}, {id:'old',recorded_at:'2026-10-09'}];
  assert.deepEqual(chronologicalHistory(rows).map(e=>e.id),['old','new']);
  assert.equal(rows[0].id,'new');
});
test('average includes all eight ratings and never fills missing partner answers', () => {
  assert.equal(historyScore([1,2,3,4,5,4,3,2],'average'),3);
  assert.equal(historyScore([null,2,3,4,5,4,3,2],'average'),null);
  assert.equal(historyScore([1,2,3,4,5,4,3,2],'love'),1);
});