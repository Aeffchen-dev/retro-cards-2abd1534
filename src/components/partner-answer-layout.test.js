import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const tsx = readFileSync(new URL('./PostItField.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('a partner answer uses a compact preview and opens its full text on demand', () => {
  assert.match(tsx, /className="partner-field-summary swiper-no-swiping"/);
  assert.match(tsx, /aria-haspopup="dialog"/);
  assert.match(tsx, /className="partner-answer-full"/);
});

test('the preview cannot force horizontal overflow, including with a long partner name', () => {
  const preview = css.slice(css.indexOf('.partner-field-preview {'), css.indexOf('}', css.indexOf('.partner-field-preview {')));
  assert.match(preview, /min-width: 0/);
  assert.match(preview, /max-width: 100%/);
  assert.match(preview, /overflow: hidden/);
  assert.match(preview, /white-space: nowrap/);
  assert.match(preview, /text-overflow: ellipsis/);
  assert.match(css, /\.partner-field-topline \.partner-field-name,\s*\.partner-field-empty \.partner-field-name\s*\{[^}]*overflow: hidden;[^}]*text-overflow: ellipsis;/s);
});

test('the full answer scrolls inside the reading view instead of stretching the card', () => {
  const full = css.slice(css.indexOf('.partner-answer-full {'), css.indexOf('}', css.indexOf('.partner-answer-full {')));
  assert.match(full, /min-height: 0/);
  assert.match(full, /overflow-y: auto/);
  assert.match(full, /overflow-wrap: anywhere/);
  const dialog = css.slice(css.indexOf('.partner-answer-dialog {'), css.indexOf('}', css.indexOf('.partner-answer-dialog {')));
  assert.match(dialog, /max-height: calc\(100dvh - 48px\)/);
  assert.match(dialog, /overflow: hidden/);
});

test('print keeps the complete partner answer inline without the reading control', () => {
  assert.match(tsx, /className="partner-field partner-field-print hidden print-only"/);
  assert.doesNotMatch(tsx.slice(tsx.indexOf('partner-field-print'), tsx.indexOf('{hasAnswer ? (', tsx.indexOf('partner-field-print'))), /partner-field-summary/);
});
