export const PARTNER_REFRESH_INTERVAL_MS = 3000;

export function updatePartnerMember<T extends { user_id: string }>(members: readonly T[], updated: T): T[] {
  const index = members.findIndex(member => member.user_id === updated.user_id);
  return index < 0 ? [...members, updated] : members.map(member => member.user_id === updated.user_id ? updated : member);
}