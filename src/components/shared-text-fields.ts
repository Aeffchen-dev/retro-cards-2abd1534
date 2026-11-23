// Shared writing fields (Ideas): every editor stamps a field with `${key}__t`;
// the newest stamp wins, so stale replies never overwrite a newer edit.
export type SharedTexts = Record<string, string>;
const stamp = (key: string) => `${key}__t`;

export function editSharedText(values: SharedTexts, key: string, value: string, now = Date.now()): SharedTexts {
  const prev = Number(values[stamp(key)] ?? 0);
  return { ...values, [key]: value, [stamp(key)]: String(Math.max(now, prev + 1)) };
}

export function mergeSharedTexts(own: SharedTexts, remote: SharedTexts | undefined, keys: readonly string[]): SharedTexts {
  if (!remote) return own;
  let next = own;
  for (const key of keys) {
    const theirs = Number(remote[stamp(key)] ?? 0);
    if (theirs > Number(own[stamp(key)] ?? 0)) {
      if (next === own) next = { ...own };
      next[key] = remote[key] ?? '';
      next[stamp(key)] = String(theirs);
    }
  }
  return next;
}
