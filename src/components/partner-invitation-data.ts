export type InvitationStatus = 'unavailable' | 'loading' | 'pending' | 'accepted';

export function invitationName(existingName: string): string {
  return existingName.trim().slice(0, 80) || 'Gast';
}

export function invitationStatus(
  sessionId: string | null,
  userId: string | undefined,
  members: readonly { user_id: string }[],
  loaded: boolean,
): InvitationStatus {
  if (!sessionId || !userId) return 'unavailable';
  if (!loaded) return 'loading';
  return members.some(member => member.user_id !== userId) ? 'accepted' : 'pending';
}

export function canResendInvitation(status: InvitationStatus, invite: string): boolean {
  return status === 'pending' && invite.length > 0;
}

/**
 * A status line is only worth showing once somebody has actually joined.
 * Before that the sheet just offers the link — no "waiting to join" hint.
 */
export function connectionHint(hasPartner: boolean, live: boolean): string | null {
  if (!hasPartner || live) return null;
  return 'Verbindung wird wiederhergestellt …';
}