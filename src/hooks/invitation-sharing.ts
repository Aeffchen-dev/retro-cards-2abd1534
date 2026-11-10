export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

export async function shareInvitation(
  url: string,
  share: ((data: ShareData) => Promise<void>) | undefined,
  copy: (url: string) => Promise<void>,
): Promise<ShareOutcome> {
  if (share) {
    try {
      await share({ title: 'Unsere gemeinsame Retro', text: 'Mach mit bei unserer Retro.', url });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
      // Embedded previews and browser permissions can block native sharing.
      // The invitation remains valid, so copy it instead of reporting a connection error.
    }
  }
  await copy(url);
  return 'copied';
}

export async function copyInvitation(url: string): Promise<void> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return;
    }
  } catch {
    // Older browsers and embedded previews may deny the Clipboard API.
  }
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = url;
  field.readOnly = true;
  field.setAttribute('aria-label', 'Einladungslink');
  (previousFocus?.closest('[role="dialog"]') ?? document.body).append(field);
  field.select();
  field.setSelectionRange(0, url.length);
  try {
    if (!document.execCommand('copy')) throw new Error('Einladungslink konnte nicht kopiert werden. Bitte in einem normalen Browser erneut versuchen.');
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  }
}