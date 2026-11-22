import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { partnerDisplayName } from './partner-live-data';
test('Setup name wins', () => assert.equal(partnerDisplayName('Gast', 'Jana'), 'Jana'));
test('Gast fallback never shown', () => { assert.equal(partnerDisplayName('Gast', ''), 'Partner'); assert.equal(partnerDisplayName('Gast B'), 'Partner'); });
