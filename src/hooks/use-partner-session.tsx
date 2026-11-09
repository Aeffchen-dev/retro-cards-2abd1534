import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type DeckSnapshot = { notes?: Record<string, Record<string, string>>; postIts?: Record<string, string>; takeaways?: Record<string, string>; reflection?: Record<string, string>; positions?: Record<string, unknown>; setup?: { name1: string; name2: string; emoji1: string; emoji2: string; openRelationship: boolean; extraPartners: {name:string;emoji:string}[] }; question?: string };
type Member = { user_id: string; display_name: string; answers: Json };
function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('partner-session-id'));
  const [members, setMembers] = useState<Member[]>([]);
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
    if (!sessionId || !user) return;
    const { data, error: e } = await supabase.from('retro_members').select('user_id,display_name,answers').eq('session_id', sessionId);
    if (e) { setError(e.message); return; }
    setMembers(data ?? []);
    const { data: room } = await supabase.from('retro_sessions').select('invite_code').eq('id', sessionId).maybeSingle();
    setInvite(room?.invite_code ?? '');
  }, [sessionId, user]);
  useEffect(() => {
    if (!sessionId || !user) { setMembers([]); setOnline(false); return; }
    void refresh();
    const channel = supabase.channel(`partner-${sessionId}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'retro_members', filter: `session_id=eq.${sessionId}` }, () => void refresh()).subscribe(status => {
      setOnline(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') void refresh();
    });
    return () => { void supabase.removeChannel(channel); };
  }, [sessionId, user, refresh]);
  const publish = useCallback((value: DeckSnapshot) => {
    snapshot.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (!sessionId || !user) return;
    timer.current = setTimeout(async () => {
      const { error: e } = await supabase.from('retro_members').update({ answers: snapshot.current as Json, updated_at: new Date().toISOString() }).eq('session_id', sessionId).eq('user_id', user.id);
      if (e) setError('Deine Änderungen konnten nicht geteilt werden. Bitte prüfe die Verbindung.');
    }, 250);
  }, [sessionId, user]);
  useEffect(() => { publish(snapshot.current); return () => { if (timer.current) clearTimeout(timer.current); }; }, [publish]);
  const connect = async (name: string, code?: string) => {
    setError('');
    if (!user || !name.trim() || name.length > 80) { setError('Bitte anmelden und deinen Namen eingeben.'); return; }
    if (code && !/^[0-9a-f-]{36}$/i.test(code)) { setError('Bitte den vollständigen Einladungscode eingeben.'); return; }
    const result = code ? await supabase.rpc('join_retro_session', { code, member_name: name.trim() }) : await supabase.rpc('create_retro_session', { member_name: name.trim() });
    if (result.error) { setError(result.error.message); return; }
    setSessionId(result.data); localStorage.setItem('partner-session-id', result.data);
  };
  const leave = async () => {
    if (sessionId && user) {
      const { error: e } = await supabase.from('retro_members').delete().eq('session_id', sessionId).eq('user_id', user.id);
      if (e) { setError(e.message); return; }
    }
    setSessionId(null); localStorage.removeItem('partner-session-id'); setMembers([]); setInvite('');
  };
  const partner = members.find(m => m.user_id !== user?.id);
  const partnerAnswers = (partner?.answers ?? {}) as DeckSnapshot;
  return { user, sessionId, members, partner, partnerAnswers, invite, error, setError, online, publish, connect, leave };
}
const PartnerContext = createContext<ReturnType<typeof useSession> | null>(null);
export function PartnerSessionProvider({ children }: { children: ReactNode }) { const value = useSession(); return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>; }
export function usePartnerSession() { const value = useContext(PartnerContext); if (!value) throw new Error('PartnerSessionProvider missing'); return value; }