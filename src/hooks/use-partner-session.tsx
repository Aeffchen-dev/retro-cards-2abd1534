import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { displayNameUpdate, invitationStatus } from '@/components/partner-invitation-data';
import { isTextEntryTarget, partnerDisplayName, PARTNER_REFRESH_INTERVAL_MS, samePartnerMembers, updatePartnerMember } from './partner-live-data';
import { readGuestAccess, guestRequest, parseGuestAccess, GUEST_STORAGE_KEY, isExpiredGuestAccess, type GuestAccess } from './guest-retro-client';
import type { SharedSetupData } from '@/components/shared-setup-data';

export type DeckSnapshot = { notes?: Record<string, Record<string, string>>; postIts?: Record<string, string>; takeaways?: Record<string, string>; reflection?: Record<string, string>; positions?: Record<string, unknown>; setup?: SharedSetupData; question?: string; activity?: { typingAt: number } };
type Member = { user_id: string; display_name: string; answers: Json; is_owner?: boolean };
function useSession() {
  const [guest, setGuest] = useState<GuestAccess | null>(readGuestAccess);
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => readGuestAccess()?.sessionId ?? localStorage.getItem('partner-session-id'));
  const [members, setMembers] = useState<Member[]>([]);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [online, setOnline] = useState(false);
  const snapshot = useRef<DeckSnapshot>({});
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const nameTimer = useRef<ReturnType<typeof setTimeout>>();
  const focusTimer = useRef<ReturnType<typeof setTimeout>>();
  const sharedName = useRef('');
  const membersRef = useRef<Member[]>([]);
  const pendingMembers = useRef<Member[] | null>(null);
  const applyMembers = useCallback((next: Member[]) => {
    membersRef.current = next;
    // Partner text must appear while you type: the own field keeps its local value,
    // so a repaint with an unchanged value never touches the caret.
    pendingMembers.current = null;
    setMembers(current => samePartnerMembers(current, next) ? current : next);
  }, []);
  useEffect(() => {
    const flush = () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => {
        if (isTextEntryTarget(document.activeElement) || !pendingMembers.current) return;
        const next = pendingMembers.current;
        pendingMembers.current = null;
        setMembers(current => samePartnerMembers(current, next) ? current : next);
      });
    };
    document.addEventListener('focusout', flush);
    return () => {
      document.removeEventListener('focusout', flush);
      if (focusTimer.current) clearTimeout(focusTimer.current);
    };
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const refresh = useCallback(async () => {
    if (guest) {
      try { const data = await guestRequest({action:'read', token:guest.token}); applyMembers(data.members ?? []); setInvite(guest.invite ?? ''); setLoadedSessionId(guest.sessionId); setOnline(true); }
      catch (e) {
        // A guest pass whose room was closed or removed can never work again:
        // drop it so the next "Link teilen" opens a fresh room instead of failing.
        if (isExpiredGuestAccess(e)) { localStorage.removeItem(GUEST_STORAGE_KEY); setGuest(null); setSessionId(null); setMembers([]); membersRef.current = []; setInvite(''); setLoadedSessionId(null); setOnline(false); setError(''); return; }
        setOnline(false); setError(e instanceof Error ? e.message : 'Verbindung nicht verfügbar'); }
      return;
    }
    if (!sessionId || !user) return;
    const { data, error: e } = await supabase.from('retro_members').select('user_id,display_name,answers').eq('session_id', sessionId);
    if (e) { setError(e.message); return; }
    applyMembers(data ?? []);
    const { data: room } = await supabase.from('retro_sessions').select('invite_code').eq('id', sessionId).maybeSingle();
    setInvite(room?.invite_code ?? '');
    setLoadedSessionId(sessionId);
  }, [sessionId, user, guest, applyMembers]);
  useEffect(() => {
    if (guest) {
      void refresh();
      const catchUp = () => { if (document.visibilityState === 'visible') void refresh(); };
      const interval = setInterval(catchUp, PARTNER_REFRESH_INTERVAL_MS);
      window.addEventListener('focus', catchUp); window.addEventListener('online', catchUp); document.addEventListener('visibilitychange', catchUp);
      return () => { clearInterval(interval); window.removeEventListener('focus', catchUp); window.removeEventListener('online', catchUp); document.removeEventListener('visibilitychange', catchUp); };
    }
    if (!sessionId || !user) { membersRef.current = []; pendingMembers.current = null; setMembers([]); setInvite(''); setLoadedSessionId(null); setOnline(false); return; }
    void refresh();
    const channel = supabase.channel(`partner-${sessionId}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'retro_members', filter: `session_id=eq.${sessionId}` }, payload => {
      const updated = payload.new;
      if (payload.eventType !== 'DELETE' && 'user_id' in updated && typeof updated.user_id === 'string' && typeof updated.display_name === 'string' && updated.answers && typeof updated.answers === 'object') {
        applyMembers(updatePartnerMember(membersRef.current, { user_id: updated.user_id, display_name: updated.display_name, answers: updated.answers }));
      } else void refresh();
    }).subscribe(status => {
      setOnline(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') void refresh();
    });
    // Catch up after mobile suspension or a silently stalled realtime connection.
    const catchUp = () => { if (document.visibilityState === 'visible') void refresh(); };
    const interval = setInterval(catchUp, PARTNER_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', catchUp);
    window.addEventListener('online', catchUp);
    document.addEventListener('visibilitychange', catchUp);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', catchUp);
      window.removeEventListener('online', catchUp);
      document.removeEventListener('visibilitychange', catchUp);
      void supabase.removeChannel(channel);
    };
  }, [sessionId, user, refresh, guest, applyMembers]);
  const publish = useCallback((value: DeckSnapshot) => {
    snapshot.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (guest) {
      timer.current = setTimeout(async () => { try { await guestRequest({action:'update',token:guest.token,answers:snapshot.current}); } catch(e) {if (isExpiredGuestAccess(e)) { void refresh(); return; } setError(e instanceof Error ? e.message : 'Änderungen konnten nicht geteilt werden');} },250);
      return;
    }
    if (!sessionId || !user) return;
    timer.current = setTimeout(async () => {
      const { error: e } = await supabase.from('retro_members').update({ answers: snapshot.current as Json, updated_at: new Date().toISOString() }).eq('session_id', sessionId).eq('user_id', user.id);
      if (e) setError('Deine Änderungen konnten nicht geteilt werden. Bitte prüfe die Verbindung.');
    }, 250);
  }, [sessionId, user, guest, refresh]);
  useEffect(() => { publish(snapshot.current); return () => { if (timer.current) clearTimeout(timer.current); }; }, [publish]);
  const shareTyping = useCallback((typingAt: number) => {
    publish({ ...snapshot.current, activity: { typingAt } });
  }, [publish]);
  // The name typed in Setup is the name the other person sees, so it travels
  // with every edit instead of staying the value picked when the room opened.
  const shareName = useCallback((raw: string) => {
    const name = displayNameUpdate(raw, sharedName.current);
    if (!name || (!guest && (!sessionId || !user))) return;
    if (nameTimer.current) clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => {
      sharedName.current = name;
      if (guest) {
        void guestRequest({ action: 'update', token: guest.token, answers: snapshot.current, name })
          .catch(e => { sharedName.current = ''; setError(e instanceof Error ? e.message : 'Dein Name konnte nicht geteilt werden'); });
        return;
      }
      if (!sessionId || !user) return;
      void supabase.from('retro_members').update({ display_name: name, updated_at: new Date().toISOString() }).eq('session_id', sessionId).eq('user_id', user.id)
        .then(({ error: e }) => { if (e) { sharedName.current = ''; setError('Dein Name konnte nicht geteilt werden'); } });
    }, 400);
  }, [guest, sessionId, user]);
  useEffect(() => () => { if (nameTimer.current) clearTimeout(nameTimer.current); }, []);
  const connect = async (name: string, code?: string) => {
    setError('');
    if (!name.trim() || name.length > 80) { setError('Bitte deinen Namen eingeben (maximal 80 Zeichen).'); return; }
    if (!user || (code && /^[a-f0-9]{64}$/.test(code))) {
      try {
        const data=await guestRequest(code ? {action:'join',name:name.trim(),invite:code} : {action:'create',name:name.trim()});
        const access=parseGuestAccess(data); localStorage.setItem(GUEST_STORAGE_KEY,JSON.stringify(access)); setGuest(access); setSessionId(access.sessionId); setInvite(access.invite ?? '');
        if (code) history.replaceState(null,'',location.pathname);
      } catch(e){setError(e instanceof Error ? e.message : 'Verbindung konnte nicht erstellt werden');}
      return;
    }
    if (code && !/^[0-9a-f-]{36}$/i.test(code)) { setError('Bitte den vollständigen Einladungscode eingeben.'); return; }
    const result = code ? await supabase.rpc('join_retro_session', { code, member_name: name.trim() }) : await supabase.rpc('create_retro_session', { member_name: name.trim() });
    if (result.error) { setError(result.error.message); return; }
    setSessionId(result.data); localStorage.setItem('partner-session-id', result.data);
  };
  const leave = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (guest) {
      try {await guestRequest({action:'leave',token:guest.token});}catch(e){setError(e instanceof Error ? e.message : 'Verbindung konnte nicht getrennt werden');return;}
      localStorage.removeItem(GUEST_STORAGE_KEY);setGuest(null);
    } else if (sessionId && user) {
      const { error: e } = await supabase.from('retro_members').delete().eq('session_id', sessionId).eq('user_id', user.id);
      if (e) { setError(e.message); return; }
    }
    if (nameTimer.current) clearTimeout(nameTimer.current);
    pendingMembers.current = null;
    membersRef.current = [];
    setSessionId(null); localStorage.removeItem('partner-session-id'); setMembers([]); setInvite(''); sharedName.current = '';
  };
  const remove = async (id: string) => {
    if (!guest) return;
    try { const data = await guestRequest({ action: 'remove', token: guest.token, memberId: id }); applyMembers(data.members ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Partner konnte nicht entfernt werden'); }
  };
  const memberId = guest?.memberId ?? user?.id;
  const others = members.filter(m => m.user_id !== memberId);
  const isOwner = Boolean(members.find(m => m.user_id === memberId)?.is_owner);
  const partner = members.find(m => m.user_id !== memberId);
  const partnerAnswers = (partner?.answers ?? {}) as DeckSnapshot;
  const partnerName = partnerDisplayName(partner?.display_name, partnerAnswers.setup?.name1);
  const invitation = invitationStatus(sessionId, memberId, members, loadedSessionId === sessionId);
  return { user, memberId, others, isOwner, remove, guest, sessionId, members, partner, partnerAnswers, partnerName, invite, invitation, error, setError, online, publish, shareTyping, shareName, connect, leave };
}
// Shared on globalThis so a hot-reloaded duplicate of this module reuses the same context.
type PartnerCtx = React.Context<ReturnType<typeof useSession> | null>;
const ctxHolder = globalThis as unknown as { __partnerSessionContext?: PartnerCtx };
const PartnerContext: PartnerCtx = ctxHolder.__partnerSessionContext ??= createContext<ReturnType<typeof useSession> | null>(null);
export function PartnerSessionProvider({ children }: { children: ReactNode }) { const value = useSession(); return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>; }
export function usePartnerSession() { const value = useContext(PartnerContext); if (!value) throw new Error('PartnerSessionProvider missing'); return value; }