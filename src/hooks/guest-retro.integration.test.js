import { test, expect } from 'bun:test';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const run = url && key ? test : test.skip;
run('private guest capabilities isolate rooms, preserve answers and revoke access on leave', async () => {
  const call = async body => {
    const response = await fetch(`${url}/functions/v1/guest-retro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };
  const owner = await call({ action: 'create', name: 'Guest integration A' });
  expect(owner.status).toBe(200);
  const unrelated = await call({ action: 'create', name: 'Guest integration outsider' });
  try {
    const guest = await call({ action: 'join', name: 'Guest integration B', invite: owner.data.invite });
    expect(guest.status).toBe(200);
    expect(guest.data.token).not.toBe(owner.data.token);
    expect((await call({ action: 'read', token: owner.data.invite })).status).toBe(403);
    expect((await call({ action: 'read', token: '0'.repeat(64) })).status).toBe(403);
    const own = { notes: { 105: { hc_p0_love: '1' } }, reflection: { thanks: 'Private guest test' } };
    await call({ action: 'update', token: owner.data.token, answers: own });
    await call({ action: 'update', token: guest.data.token, answers: { notes: { 105: { hc_p0_love: '5' } } } });
    const room = await call({ action: 'read', token: owner.data.token });
    expect(room.data.members.find(m => m.user_id === owner.data.memberId).answers).toEqual(own);
    expect(room.data.members.find(m => m.user_id === guest.data.memberId).answers.notes['105'].hc_p0_love).toBe('5');
    expect(room.data.members.some(m => 'token_hash' in m)).toBe(false);
    const outside = await call({ action: 'read', token: unrelated.data.token });
    expect(outside.data.members.some(m => m.user_id === owner.data.memberId)).toBe(false);
    const direct = await fetch(`${url}/rest/v1/retro_guest_members?select=*`, { headers: { apikey: key } });
    expect(direct.ok).toBe(false);
    await call({ action: 'leave', token: guest.data.token });
    expect((await call({ action: 'read', token: guest.data.token })).status).toBe(403);
    await call({ action: 'leave', token: owner.data.token });
    expect((await call({ action: 'join', name: 'Guest integration C', invite: owner.data.invite })).status).toBe(403);
  } finally {
    await call({ action: 'leave', token: owner.data.token });
    await call({ action: 'leave', token: unrelated.data.token });
  }
}, 30000);