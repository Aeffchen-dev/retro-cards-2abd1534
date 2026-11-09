export type InvitationStatus = 'unavailable' | 'loading' | 'pending' | 'accepted';

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