/** Explicitly disable the hardware light when the browser exposes torch control. */
export async function disableCameraFlash(stream: MediaStream): Promise<void> {
  for (const track of stream.getVideoTracks()) {
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities?.torch) continue;
    try {
      await track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] });
    } catch {
      // Live video capture itself does not trigger a photographic flash.
    }
  }
}