import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { EMOJI_GROUPS, ALL_EMOJIS, filterEmojis } from './emoji-data';

test('every picker group offers emojis and none repeats across groups', () => {
  assert.ok(EMOJI_GROUPS.length >= 5);
  for (const group of EMOJI_GROUPS) {
    assert.ok(group.label.length > 0, 'a group needs a label');
    assert.ok(group.emojis.length > 0, `${group.id} is empty`);
  }
  assert.equal(new Set(ALL_EMOJIS).size, ALL_EMOJIS.length, 'an emoji appears in two groups');
});

test('every offered emoji is one grapheme cluster', () => {
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const emoji of ALL_EMOJIS) {
    assert.equal(Array.from(seg.segment(emoji)).length, 1, `${emoji} is more than one grapheme`);
  }
});

test('an empty search returns every group untouched', () => {
  assert.equal(filterEmojis('').length, EMOJI_GROUPS.length);
  assert.equal(filterEmojis('   ').length, EMOJI_GROUPS.length);
});

test('searching finds an emoji by keyword, ignoring case and accents', () => {
  const hearts = filterEmojis('HERZ');
  assert.ok(hearts.some((g) => g.emojis.includes('❤️')), 'herz does not find the heart');
  const umlaut = filterEmojis('grÜße');
  assert.ok(umlaut.some((g) => g.emojis.includes('👋')), 'gruesse does not find the waving hand');
});

test('searching by group name returns that whole group', () => {
  const animals = filterEmojis('Tiere');
  assert.ok(animals.some((g) => g.id === 'nature' && g.emojis.includes('🐶')));
});

test('an unknown word finds nothing', () => {
  assert.equal(filterEmojis('zqxjw').length, 0);
});
