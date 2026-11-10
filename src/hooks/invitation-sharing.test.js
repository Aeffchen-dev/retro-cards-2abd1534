import { describe, expect, test } from 'bun:test';
import { shareInvitation } from './invitation-sharing';

describe('private invitation sharing', () => {
  const link = 'https://retro.example/#invite=private-invitation';
  test('native sharing receives the invitation rather than the plain home page', async () => {
    let received = '';
    let copies = 0;
    expect(await shareInvitation(link, async data => { received = data.url ?? ''; }, async () => { copies++; })).toBe('shared');
    expect(received).toBe(link);
    expect(copies).toBe(0);
  });
  test('blocked native sharing copies the same private link', async () => {
    let copied = '';
    expect(await shareInvitation(link, async () => { throw new DOMException('Blocked', 'NotAllowedError'); }, async url => { copied = url; })).toBe('copied');
    expect(copied).toBe(link);
  });
  test('a browser without native sharing copies the link', async () => {
    let copied = '';
    expect(await shareInvitation(link, undefined, async url => { copied = url; })).toBe('copied');
    expect(copied).toBe(link);
  });
  test('cancelling the share dialog neither copies nor reports failure', async () => {
    let copies = 0;
    expect(await shareInvitation(link, async () => { throw new DOMException('Cancelled', 'AbortError'); }, async () => { copies++; })).toBe('cancelled');
    expect(copies).toBe(0);
  });
  test('clipboard failure remains a sharing failure, not success', async () => {
    await expect(shareInvitation(link, undefined, async () => { throw new Error('Cannot copy'); })).rejects.toThrow('Cannot copy');
  });
});