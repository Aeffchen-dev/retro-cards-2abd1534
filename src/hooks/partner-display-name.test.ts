import { test, expect } from 'bun:test';
import { partnerDisplayName } from './partner-live-data';
test('Setup name wins', () => expect(partnerDisplayName('Gast', 'Jana')).toBe('Jana'));
test('Gast fallback never shown', () => { expect(partnerDisplayName('Gast', '')).toBe('Partner'); expect(partnerDisplayName('Gast B')).toBe('Partner'); });
