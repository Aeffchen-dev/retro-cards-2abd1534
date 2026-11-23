import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HealthHistoryEntry, HistoryResults, HEALTH_HISTORY_KEY, parseHistoryResults, chronologicalHistory, readLocalHealthHistory, historyForPair, pastHealthHistory, upsertDailyEntry } from './health-history-data';

export default function HealthCheckHistory({ results, complete, categoryColor, categoryAccent, onSelect }: { results: HistoryResults; complete: boolean; categoryColor: string; categoryAccent: string; onSelect?: (results: HistoryResults | null) => void }) {
  const session = usePartnerSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<HealthHistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setEntries([]); setError(''); setLoading(true);
    const load = async () => {
      if (!session.user) { if (!cancelled) { setEntries(chronologicalHistory(readLocalHealthHistory())); setLoading(false); } return; }
      let query = supabase.from('retro_health_history').select('*').order('recorded_at');
      if (!session.sessionId) query = query.eq('owner_id', session.user.id).is('session_id', null);
      const { data, error: e } = await query;
      if (cancelled) return;
      if (e) setError('Der Verlauf konnte nicht geladen werden. Bitte versuche es erneut.');
      else {
        const parsedEntries = (data ?? []).flatMap(row => {
        const parsed = parseHistoryResults(row.results);
        return parsed ? [{...row, results: parsed}] : [];
        });
        setEntries(session.sessionId ? historyForPair(parsedEntries, session.partner ? [session.user.id, session.partner.user_id] : []) : chronologicalHistory(parsedEntries));
      }
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [session.user?.id, session.sessionId, session.partner?.user_id]);
  // Completed answers save themselves: one entry per day, replaced while answers change.
  const resultsKey = JSON.stringify(results);
  useEffect(() => {
    if (!complete || loading) return;
    const t = setTimeout(async () => {
      const ownerId = session.user?.id ?? null;
      const entry: HealthHistoryEntry = { id: crypto.randomUUID(), owner_id: ownerId, recorded_at: new Date().toISOString(), results: structuredClone(results) };
      try {
        if (session.user) {
          const existing = upsertDailyEntry(entries, entry).find(e => e.recorded_at === entry.recorded_at)!;
          const { error: e } = await supabase.from('retro_health_history').upsert({ id: existing.id, owner_id: session.user.id, session_id: session.sessionId, recorded_at: entry.recorded_at, results: entry.results as unknown as Json });
          if (e) throw e;
        } else localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(upsertDailyEntry(readLocalHealthHistory(), entry)));
        setEntries(current => upsertDailyEntry(current, entry));
        setError('');
      } catch { setError('Die Retro konnte nicht automatisch gespeichert werden.'); }
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, loading, resultsKey, session.user?.id, session.sessionId]);
  const remove = async (entry: HealthHistoryEntry) => {
    if (busy || !window.confirm('Diese gespeicherte Retro aus dem Verlauf löschen?')) return;
    setBusy(true); setError('');
    try {
      if (session.user) {
        const { error: e } = await supabase.from('retro_health_history').delete().eq('id',entry.id).eq('owner_id',session.user.id);
        if (e) throw e;
      } else localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(readLocalHealthHistory().filter(e => e.id !== entry.id)));
      setEntries(current => current.filter(e => e.id !== entry.id));
    } catch { setError('Die Retro konnte nicht gelöscht werden.'); }
    finally { setBusy(false); }
  };
  const pastEntries = pastHealthHistory(entries);
  const hasPast = pastEntries.length > 0;
  const pick = (entry: HealthHistoryEntry | null) => { setSelected(entry?.id ?? null); onSelect?.(entry ? entry.results : null); };
  const chosen = pastEntries.find(e => e.id === selected);
  return <div className="health-history">
    {hasPast && !loading && <div className="health-date-strip swiper-no-swiping" role="tablist" aria-label="Retro auswählen">
      <button type="button" role="tab" aria-selected={!chosen} className={`health-date-chip ${!chosen ? 'is-active' : ''}`} style={!chosen ? {background: categoryColor, color: categoryAccent} : undefined} onClick={() => pick(null)}>Heute</button>
      {[...pastEntries].reverse().map(entry => { const on = entry.id === selected; return <button key={entry.id} type="button" role="tab" aria-selected={on} className={`health-date-chip ${on ? 'is-active' : ''}`} style={on ? {background: categoryColor, color: categoryAccent} : undefined} onClick={() => pick(entry)}>{new Date(entry.recorded_at).toLocaleDateString('de-DE', {day:'numeric', month:'short', year:'2-digit'})}</button>; })}
    </div>}
    {chosen && (!session.user || chosen.owner_id === session.user.id) && <button type="button" className="health-date-delete" disabled={busy} onClick={() => void remove(chosen).then(() => pick(null))}><Trash2 size={14}/> Diese Retro löschen</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
