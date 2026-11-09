import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { healthScore, healthResults, HEALTH_CATEGORIES, healthScaleValue, healthScaleScore, answeredHealthTopics, revealedPartnerResults } from './health-check-data';
test('ratings are bounded from 1 to 5', () => {
  assert.equal(healthScore('1'),1); assert.equal(healthScore('5'),5);
  for (const n of ['0','6','2.5','',undefined,'NaN']) assert.equal(healthScore(n),null);
});
test('the screenshot supplies eight separate rating axes', () => {
  assert.equal(HEALTH_CATEGORIES.length,8);
  assert.equal(new Set(HEALTH_CATEGORIES.map(c => c.id)).size,8);
});
test('both partners retain distinct selections', () => {
  const values = { hc_p0_love:'1',hc_p1_love:'5' };
  assert.equal(healthResults(values,'p0')[0],1);
  assert.equal(healthResults(values,'p1')[0],5);
  assert.equal(healthResults(values,'p0')[1],null);
});
test('smiley endpoints keep the existing satisfaction scores and saved answers', () => {
  assert.equal(healthScaleScore('0'), '1');
  assert.equal(healthScaleScore('100'), '5');
  assert.equal(healthScaleValue(null), undefined);
  for (const score of [1,2,3,4,5]) assert.equal(healthScaleScore(healthScaleValue(score)), String(score));
});
test('missing answers remain absent rather than being scored as zero', () => {
  assert.deepEqual(healthResults({hc_p0_love:'4'},'p0'),[4,null,null,null,null,null,null,null]);
});
test('partner result is revealed only after own answer for that topic', () => {
  assert.deepEqual(revealedPartnerResults([null, 3, 1, null], [5, 4, null, 2]), [null, 4, null, null]);
  assert.deepEqual(revealedPartnerResults([], [5]), [null]);
});
test('evaluation includes only topics answered by at least one partner', () => {
  assert.deepEqual(answeredHealthTopics([4,null,null,null,null,null,null,null], [null,null,2,null,null,null,null,null]), [0,2]);
  assert.deepEqual(answeredHealthTopics(Array(8).fill(null), Array(8).fill(null)), []);
});