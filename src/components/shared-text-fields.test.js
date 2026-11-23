import { describe, it, expect } from 'vitest';
import { editSharedText, mergeSharedTexts } from './shared-text-fields';
describe('shared Ideas fields', () => {
  it('adopts a newer partner edit', () => {
    const own = editSharedText({}, 'plan', 'alt', 100);
    const remote = editSharedText({}, 'plan', 'neu', 200);
    expect(mergeSharedTexts(own, remote, ['plan']).plan).toBe('neu');
  });
  it('keeps my newer edit against a stale reply', () => {
    const own = editSharedText({}, 'plan', 'meins', 300);
    const remote = editSharedText({}, 'plan', 'alt', 200);
    expect(mergeSharedTexts(own, remote, ['plan']).plan).toBe('meins');
  });
});
