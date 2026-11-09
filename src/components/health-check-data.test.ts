import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { healthScore, healthResults, HEALTH_CATEGORIES } from './health-check-data';
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