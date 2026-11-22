export const PARTNER_REFRESH_INTERVAL_MS = 1500;

export function updatePartnerMember<T extends { user_id: string }>(members: readonly T[], updated: T): T[] {
  const index = members.findIndex(member => member.user_id === updated.user_id);
  return index < 0 ? [...members, updated] : members.map(member => member.user_id === updated.user_id ? updated : member);
}

/** A focused writing field must not receive an asynchronous deck repaint. */
export function isTextEntryTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const element = target as { tagName?: string; type?: string; isContentEditable?: boolean };
  return element.isContentEditable === true || element.tagName === 'TEXTAREA' ||
    (element.tagName === 'INPUT' && (element.type ?? 'text') === 'text');
}

/** Polling often returns the same room; retaining the old array avoids a render. */
export function samePartnerMembers(current: readonly unknown[], next: readonly unknown[]): boolean {
  return current === next || JSON.stringify(current) === JSON.stringify(next);
}

/** Their own Setup name wins; the name assigned to their invitation is the next fallback. */
export function partnerDisplayName(stored?: string, setupName?: string, invitedName?: string): string {
  // The name the inviting person typed into the partner field wins, so everyone
  // sees the partner under the name chosen in Setup; their own entry is the fallback.
  const invited = (invitedName ?? '').trim();
  if (invited) return invited.slice(0, 80);
  const typed = (setupName ?? '').trim();
  if (typed) return typed.slice(0, 80);
  const saved = (stored ?? '').trim();
  // "Gast" / "Gast B" are join-time fallbacks, never a real name.
  return saved && !/^gast(\s|$)/i.test(saved) ? saved : 'Partner';
}
