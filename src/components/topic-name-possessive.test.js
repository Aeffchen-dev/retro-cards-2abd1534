import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./RetroCards.tsx', import.meta.url), 'utf8');
const declaration = source.match(/const topicNamePossessive = \(name: string\): string => ([^;]+);/);
assert.ok(declaration, 'Topic-name formatter exists');
const possessive = runInNewContext(`(name) => ${declaration[1]}`);

test('a name ending in s takes an apostrophe without another s', () => {
  assert.equal(possessive('Chris'), 'Chris’');
  assert.equal(possessive('CHRIS'), 'CHRIS’');
});

test('other names retain apostrophe s', () => {
  assert.equal(possessive('Jana'), 'Jana’s');
});