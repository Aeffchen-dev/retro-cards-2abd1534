import type { SharedSetupChoice } from './shared-setup-choice';

export type SetupPerson = { name: string; emoji: string };
type SharedValue = string | boolean | string[];
type SetupEdit = { value: SharedValue; revision: number; editor: string };
export type SharedSetupFields = { sessionId: string; fields: Record<string, SetupEdit> };
export type SharedSetupData = SharedSetupChoice & {
  name1: string; name2: string; emoji1: string; emoji2: string;
  extraPartners: SetupPerson[];
  sharedSetup?: SharedSetupFields;
};

function newer(a: SetupEdit, b?: SetupEdit) {
  return !b || a.revision > b.revision || (a.revision === b.revision && a.editor > b.editor);
}

function roster(shared: SharedSetupFields): string[] {
  const value = shared.fields.roster?.value;
  return Array.isArray(value) ? value : ['0', '1'];
}

/** Local first-person fields are views of a single canonical room roster. */
function viewOrder(ids: string[], ownIndex: number): string[] {
  const own = ids[ownIndex] ?? ids[1];
  return [own, ...ids.filter(id => id !== own)];
}

function project<T extends SharedSetupData>(local: T, shared: SharedSetupFields, ownIndex: number): T {
  const order = viewOrder(roster(shared), ownIndex);
  const people = order.map(id => ({
    name: String(shared.fields[`name:${id}`]?.value ?? ''),
    emoji: String(shared.fields[`emoji:${id}`]?.value ?? ''),
  }));
  const result = {
    ...local, sharedSetup: shared,
    name1: people[0]?.name ?? '', emoji1: people[0]?.emoji ?? '',
    name2: people[1]?.name ?? '', emoji2: people[1]?.emoji ?? '',
    extraPartners: people.slice(2),
    openRelationship: Boolean(shared.fields.openRelationship?.value),
  };
  return JSON.stringify(result) === JSON.stringify(local) ? local : result;
}

/** Only the owner seeds legacy Setup; later merges are per-field, never whole snapshots. */
export function mergeSharedSetupData<T extends SharedSetupData>(local: T, sources: (SharedSetupData | undefined)[], sessionId: string, ownIndex: number, ownerId: string): T {
  const fields: Record<string, SetupEdit> = {};
  for (const source of [local, ...sources]) {
    if (source?.sharedSetup?.sessionId !== sessionId) continue;
    for (const [key, edit] of Object.entries(source.sharedSetup.fields)) {
      if (newer(edit, fields[key])) fields[key] = edit;
    }
  }
  if (!fields.roster) {
    if (ownIndex !== 0) return local;
    const people = [{ name: local.name1, emoji: local.emoji1 }, { name: local.name2, emoji: local.emoji2 }, ...local.extraPartners];
    fields.roster = { value: people.map((_, i) => String(i)), revision: 0, editor: ownerId };
    fields.openRelationship = { value: local.openRelationship, revision: local.openRelationshipRevision ?? 0, editor: ownerId };
    people.forEach((person, i) => {
      fields[`name:${i}`] = { value: person.name, revision: 0, editor: ownerId };
      fields[`emoji:${i}`] = { value: person.emoji, revision: 0, editor: ownerId };
    });
  }
  // A newly connected third person needs a stable slot even without a pre-added row.
  const ids = Array.isArray(fields.roster.value) ? [...fields.roster.value] : ['0', '1'];
  while (ids.length <= ownIndex) ids.push(`member-${ids.length}`);
  if (JSON.stringify(ids) !== JSON.stringify(fields.roster.value)) {
    fields.roster = { value: ids, revision: fields.roster.revision + 1, editor: ownerId };
  }
  return project(local, { sessionId, fields }, ownIndex);
}

/** Stamps only fields actually changed by this edit, preserving simultaneous partner edits. */
export function editSharedSetupData<T extends SharedSetupData>(local: T, change: Partial<T>, ownIndex: number, editor: string, now = Date.now()): T {
  if (!local.sharedSetup) return { ...local, ...change };
  const shared = { ...local.sharedSetup, fields: { ...local.sharedSetup.fields } };
  const put = (key: string, value: SharedValue) => {
    const previous = shared.fields[key];
    if (JSON.stringify(previous?.value) === JSON.stringify(value)) return;
    shared.fields[key] = { value, revision: Math.max(now, (previous?.revision ?? 0) + 1), editor };
  };
  const ids = roster(shared);
  const order = viewOrder(ids, ownIndex);
  for (const [key, field, index] of [['name1', 'name', 0], ['name2', 'name', 1], ['emoji1', 'emoji', 0], ['emoji2', 'emoji', 1]] as const) {
    const value = change[key];
    if (typeof value === 'string') put(`${field}:${order[index]}`, value);
  }
  if (typeof change.openRelationship === 'boolean') put('openRelationship', change.openRelationship);
  if (change.extraPartners) {
    const extraIds = order.slice(2);
    const nextExtraIds = change.extraPartners.map((person, index) => {
      // Retain identity on removal instead of assigning the next person's data to it.
      const oldIndex = local.extraPartners.indexOf(person);
      const id = extraIds[oldIndex >= 0 ? oldIndex : index] ?? crypto.randomUUID();
      put(`name:${id}`, person.name); put(`emoji:${id}`, person.emoji);
      return id;
    });
    put('roster', ids.filter(id => !extraIds.includes(id) || nextExtraIds.includes(id)).concat(nextExtraIds.filter(id => !ids.includes(id))));
  }
  return project(local, shared, ownIndex);
}