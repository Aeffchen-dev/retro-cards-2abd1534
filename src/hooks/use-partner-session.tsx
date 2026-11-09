import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { invitationStatus } from '@/components/partner-invitation-data';
import { PARTNER_REFRESH_INTERVAL_MS, updatePartnerMember } from './partner-live-data';
import { readGuestAccess, guestRequest, parseGuestAccess, GUEST_STORAGE_KEY, type GuestAccess } from './guest-retro-client';

export type DeckSnapshot = { notes?: Record<string, Record<string, string>>; postIts?: Record<string, string>; takeaways?: Record<string, string>; reflection?: Record<string, string>; positions?: Record<string, unknown>; setup?: { name1: string; name2: string; emoji1: string; emoji2: string; openRelationship: boolean; extraPartners: {name:string;emoji:string}[] }; question?: string; activity?: { typingAt: number } };
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
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const refresh = useCallback(async () => {
    if (guest) {
      try { const data = await guestRequest({action:'read', token:guest.token}); setMembers(data.members ?? []); setInvite(guest.invite ?? ''); setLoadedSessionId(guest.sessionId); setOnline(true); }
      catch (e) { setOnline(false); setError(e instanceof Error ? e.message : 'Verbindung nicht verfügbar'); }
      return;
    }
    if (!sessionId || !user) return;
    const { data, error: e } = await supabase.from('retro_members').select('user_id,display_name,answers').eq('session_id', sessionId);
    if (e) { setError(e.message); return; }
    setMembers(data ?? []);
    const { data: room } = await supabase.from('retro_sessions').select('invite_code').eq('id', sessionId).maybeSingle();
    setInvite(room?.invite_code ?? '');
    setLoadedSessionId(sessionId);
  }, [sessionId, user, guest]);
  useEffect(() => {
    if (guest) {
      void refresh();
      const catchUp = () => { if (document.visibilityState === 'visible') void refresh(); };
      const interval = setInterval(catchUp, PARTNER_REFRESH_INTERVAL_MS);
      window.addEventListener('focus', catchUp); window.addEventListener('online', catchUp); document.addEventListener('visibilitychange', catchUp);
      return () => { clearInterval(interval); window.removeEventListener('focus', catchUp); window.removeEventListener('online', catchUp); document.removeEventListener('visibilitychange', catchUp); };
    }
    if (!sessionId || !user) { setMembers([]); setInvite(''); setLoadedSessionId(null); setOnline(false); return; }
    void refresh();
    const channel = supabase.channel(`partner-${sessionId}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'retro_members', filter: `session_id=eq.${sessionId}` }, payload => {
      const updated = payload.new;
      if (payload.eventType !== 'DELETE' && 'user_id' in updated && typeof updated.user_id === 'string' && typeof updated.display_name === 'string' && updated.answers && typeof updated.answers === 'object') {
        setMembers(current => updatePartnerMember(current, { user_id: updated.user_id, display_name: updated.display_name, answers: updated.answers }));
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
  }, [sessionId, user, refresh, guest]);
  const publish = useCallback((value: DeckSnapshot) => {
    snapshot.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (guest) {
      timer.current = setTimeout(async () => { try { const data = await guestRequest({action:'update',token:guest.token,answers:snapshot.current}); setMembers(data.members ?? []); } catch(e) {setError(e instanceof Error ? e.message : 'Änderungen konnten nicht geteilt werden');} },250);
      return;
    }
    if (!sessionId || !user) return;
    timer.current = setTimeout(async () => {
      const { error: e } = await supabase.from('retro_members').update({ answers: snapshot.current as Json, updated_at: new Date().toISOString() }).eq('session_id', sessionId).eq('user_id', user.id);
      if (e) setError('Deine Änderungen konnten nicht geteilt werden. Bitte prüfe die Verbindung.');
    }, 250);
  }, [sessionId, user, guest]);
  useEffect(() => { publish(snapshot.current); return () => { if (timer.current) clearTimeout(timer.current); }; }, [publish]);
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
    setSessionId(null); localStorage.removeItem('partner-session-id'); setMembers([]); setInvite('');
  };
  const remove = async (id: string) => {
    if (!guest) return;
    try { const data = await guestRequest({ action: 'remove', token: guest.token, memberId: id }); setMembers(data.members ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Partner konnte nicht entfernt werden'); }
  };
  const memberId = guest?.memberId ?? user?.id;
  const others = members.filter(m => m.user_id !== memberId);
  const isOwner = Boolean(members.find(m => m.user_id === memberId)?.is_owner);
  const partner = members.find(m => m.user_id !== memberId);
  const partnerAnswers = (partner?.answers ?? {}) as DeckSnapshot;
  const invitation = invitationStatus(sessionId, memberId, members, loadedSessionId === sessionId);
  return { user, memberId, others, isOwner, remove, guest, sessionId, members, partner, partnerAnswers, invite, invitation, error, setError, online, publish, connect, leave };
}
// Shared on globalThis so a hot-reloaded duplicate of this module reuses the same context.
type PartnerCtx = React.Context<ReturnType<typeof useSession> | null>;
const ctxHolder = globalThis as unknown as { __partnerSessionContext?: PartnerCtx };
const PartnerContext: PartnerCtx = ctxHolder.__partnerSessionContext ??= createContext<ReturnType<typeof useSession> | null>(null);
export function PartnerSessionProvider({ children }: { children: ReactNode }) { const value = useSession(); return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>; }
export function usePartnerSession() { const value = useContext(PartnerContext); if (!value) throw new Error('PartnerSessionProvider missing'); return value; }