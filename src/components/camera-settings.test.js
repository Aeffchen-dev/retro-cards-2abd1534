import { test, expect } from 'bun:test';
import { disableCameraFlash } from './camera-settings';
test('supported camera light is explicitly disabled', async () => {
  const applied = [];
  await disableCameraFlash({ getVideoTracks: () => [{ getCapabilities: () => ({ torch: true }), applyConstraints: async value => applied.push(value) }] });
  expect(applied).toEqual([{ advanced: [{ torch: false }] }]);
});
test('cameras without light support still open', async () => {
  let calls = 0;
  await disableCameraFlash({ getVideoTracks: () => [{ getCapabilities: () => ({}), applyConstraints: async () => calls++ }] });
  expect(calls).toBe(0);
});