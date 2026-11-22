export const PARTNER_REFRESH_INTERVAL_MS = 3000;

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
