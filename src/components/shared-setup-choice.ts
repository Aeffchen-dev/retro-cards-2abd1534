export type SharedSetupChoice = {
  openRelationship: boolean;
  openRelationshipRevision?: number;
  openRelationshipEditor?: string;
};

/** Replicas keep the original edit version when adopting it, never echo a new edit. */
export function mergeSharedSetupChoice<T extends SharedSetupChoice>(local: T, remote: SharedSetupChoice | undefined, isOwner: boolean): T {
  if (!remote || typeof remote.openRelationship !== 'boolean') return local;
  const ownRevision = local.openRelationshipRevision ?? 0;
  const revision = remote.openRelationshipRevision ?? 0;
  const newer = revision > ownRevision || (revision === ownRevision && revision > 0 && (remote.openRelationshipEditor ?? '') > (local.openRelationshipEditor ?? ''));
  const legacyJoin = !isOwner && ownRevision === 0 && revision === 0;
  if (!newer && !legacyJoin) return local;
  if (local.openRelationship === remote.openRelationship && ownRevision === revision && local.openRelationshipEditor === remote.openRelationshipEditor) return local;
  return { ...local, openRelationship: remote.openRelationship, openRelationshipRevision: revision, openRelationshipEditor: remote.openRelationshipEditor };
}

export function toggleSharedSetupChoice<T extends SharedSetupChoice>(local: T, remote: SharedSetupChoice | undefined, editor: string, now = Date.now()): T {
  return { ...local, openRelationship: !local.openRelationship, openRelationshipRevision: Math.max(now, (local.openRelationshipRevision ?? 0) + 1, (remote?.openRelationshipRevision ?? 0) + 1), openRelationshipEditor: editor };
}