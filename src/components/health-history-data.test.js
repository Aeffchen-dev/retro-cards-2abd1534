import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseHistoryResults, historyScore, chronologicalHistory, historyForPair, pastHealthHistory, healthTrend } from './health-history-data';
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
test('shared timeline contains only retros from the exact connected pair across sessions', () => {
  const entry = (id, ids) => ({id, recorded_at:'2026-11-09', results:{people:ids.map(id=>({id,name:id,scores:Array(8).fill(4)}))}});
  const rows = [entry('together',['a','b']),entry('reversed',['b','a']),entry('other',['a','c']),entry('solo',['a'])];
  assert.deepEqual(historyForPair(rows,['a','b']).map(e=>e.id),['together','reversed']);
  assert.deepEqual(historyForPair(rows,['a']),[]);
});
test('history CTA requires a retro before today, not today or in the future', () => {
  const rows = ['2026-11-08','2026-11-09','2026-11-10'].map(recorded_at=>({id:recorded_at,recorded_at:`${recorded_at}T12:00:00`}));
  assert.deepEqual(pastHealthHistory(rows,new Date('2026-11-09T15:00:00')).map(e=>e.id),['2026-11-08']);
});
test('trends compare current answers to the past without inventing missing values', () => {
  assert.equal(healthTrend(Array(8).fill(4),Array(8).fill(2),'average'),2);
  assert.equal(healthTrend(Array(8).fill(1),Array(8).fill(5),'love'),-4);
  assert.equal(healthTrend(Array(8).fill(null),Array(8).fill(5),'love'),null);
});import { upsertDailyEntry, yearReview } from './health-history-data';
test('automatic saving keeps one entry per day and replaces the same-day retro', () => {
  const a = {id:'a',owner_id:null,recorded_at:'2026-11-09T08:00:00',results:{people:[]}};
  const b = {id:'b',owner_id:null,recorded_at:'2026-11-09T20:00:00',results:{people:[]}};
  const c = {id:'c',owner_id:null,recorded_at:'2026-12-09T20:00:00',results:{people:[]}};
  const once = upsertDailyEntry([a], b);
  assert.equal(once.length, 1); assert.equal(once[0].id, 'a'); assert.equal(once[0].recorded_at, b.recorded_at);
  assert.equal(upsertDailyEntry(once, c).length, 2);
});
test('year review appears only after 12 retros with best category and biggest change', () => {
  const entry = (m, scores) => ({id:String(m),owner_id:null,recorded_at:`2026-${String(m).padStart(2,'0')}-01`,results:{people:[{id:'me',name:'Me',scores}]}});
  const rows = Array.from({length:11},(_,i) => entry(i+1,[5,1,3,3,3,3,3,3]));
  assert.equal(yearReview(rows,'me'), null);
  rows.push(entry(12,[5,5,3,3,3,3,3,3]));
  const r = yearReview(rows,'me');
  assert.equal(r.count, 12); assert.equal(r.best.score, 5); assert.equal(r.change.delta, 4);
});
