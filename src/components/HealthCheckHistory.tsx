import { useEffect, useState } from 'react';
import { History, Save, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import ActionRow from './ActionRow';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HEALTH_CATEGORIES } from './health-check-data';
import { HealthHistoryEntry, HistoryResults, HEALTH_HISTORY_KEY, parseHistoryResults, chronologicalHistory, readLocalHealthHistory, historyScore, historyForPair } from './health-history-data';

export default function HealthCheckHistory({ results, complete }: { results: HistoryResults; complete: boolean }) {
  const session = usePartnerSession();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HealthHistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [topic, setTopic] = useState('average');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  });
  useEffect(() => {
    if (!open) return;
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
  }, [open, session.user?.id, session.sessionId, session.partner?.user_id]);
  const save = async () => {
    if (!complete || busy || loading || !date) return;
    setBusy(true); setError(''); setNotice('');
    const entry: HealthHistoryEntry = { id: crypto.randomUUID(), owner_id: session.user?.id ?? null, recorded_at: new Date(`${date}T12:00:00`).toISOString(), results: structuredClone(results) };
    try {
      if (session.user) {
        const { error: e } = await supabase.from('retro_health_history').insert({ id: entry.id, owner_id: session.user.id, session_id: session.sessionId, recorded_at: entry.recorded_at, results: entry.results as unknown as Json });
        if (e) throw e;
      } else localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify([...readLocalHealthHistory(), entry]));
      setEntries(current => chronologicalHistory([...current, entry]));
      setNotice('Retro gespeichert.');
    } catch { setError('Die Retro konnte nicht gespeichert werden. Bitte versuche es erneut.'); }
    finally { setBusy(false); }
  };
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
  const people = results.people.filter(p => entries.some(e => e.results.people.some(person => person.id === p.id)));
  const chart = entries.map((e, i) => ({ index: i+1, date: new Date(e.recorded_at).toLocaleDateString('de-DE'), ...Object.fromEntries(people.map(p => [p.id, historyScore(e.results.people.find(person => person.id === p.id)?.scores ?? [],topic)])) }));
  return <div className={`health-history ${open ? 'health-history-open' : ''}`}>
    <ActionRow iconNode={<History size={16}/>} label="Verlauf" accent="var(--retro-textarea-bg)" fieldBg="transparent" iconColor="var(--color-text-primary)" labelColor="var(--color-text-primary)" className="health-history-trigger" onClick={() => setOpen(value => !value)} />
    {open && <section className="health-history-content swiper-no-swiping" aria-label="Health Check im Verlauf">
      <h3>Health Check im Verlauf</h3>
      <div className="health-history-save"><label>Retro-Datum<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><Button disabled={!complete || busy || loading || !date} onClick={() => void save()}><Save size={16}/>{busy ? 'Speichert …' : 'Retro speichern'}</Button></div>
      {!complete && <p className="health-history-muted">Beantworte zuerst deine acht Health-Check-Fragen.</p>}
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <Select value={topic} onValueChange={setTopic}><SelectTrigger aria-label="Thema im Verlauf"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="average">Durchschnitt</SelectItem>{HEALTH_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select>
      {loading ? <p>Verlauf wird geladen …</p> : entries.length === 0 ? <p className="health-history-empty">Noch keine Retro gespeichert.</p> : <>
        <div className="health-history-chart" aria-label="Bewertungen von Retro zu Retro"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{top:16,right:16,bottom:8,left:-20}}><CartesianGrid stroke="var(--retro-info-rule)"/><XAxis dataKey="index" tick={{fill:'var(--color-text-primary)',fontSize:12}}/><YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{fill:'var(--color-text-primary)',fontSize:12}}/><Tooltip labelFormatter={(_,payload) => payload?.[0]?.payload?.date ?? ''} contentStyle={{background:'var(--risiko-face-fill)',borderColor:'var(--retro-info-rule)',color:'var(--color-text-primary)'}}/>{people.map((p,i) => <Line key={p.id} dataKey={p.id} name={p.name} stroke={i === 0 ? 'var(--health-partner-one)' : 'var(--health-partner-two)'} strokeWidth={2} dot={{r:4}} connectNulls={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div>
        <div className="health-legend">{people.map((p,i) => <span key={p.id} className={i===0?'health-one':'health-two'}>{p.name}</span>)}</div>
        <div className="health-history-table" role="table" aria-label="Gespeicherte Retro-Bewertungen"><div role="row"><span role="columnheader">Retro</span>{people.map(p => <span role="columnheader" key={p.id}>{p.name}</span>)}<span/></div>{entries.map((entry,i) => <div role="row" key={entry.id}><span role="cell">{i+1} · {new Date(entry.recorded_at).toLocaleDateString('de-DE')}</span>{people.map(p => {
          const score = historyScore(entry.results.people.find(person => person.id === p.id)?.scores ?? [],topic);
          const previous = i>0 ? historyScore(entries[i-1].results.people.find(person => person.id === p.id)?.scores ?? [],topic) : null;
          const delta = score !== null && previous !== null ? Math.round((score-previous)*100)/100 : null;
          return <span role="cell" key={p.id}>{score === null ? '–' : `${score.toLocaleString('de-DE')}/5`}{delta !== null && <small>{delta > 0 ? '+' : ''}{delta.toLocaleString('de-DE')}</small>}</span>;
        })}<span>{(!session.user || entry.owner_id === session.user.id) && <Button size="icon" variant="ghost" disabled={busy} aria-label={`Retro ${i+1} löschen`} title="Retro löschen" onClick={() => void remove(entry)}><Trash2 size={16}/></Button>}</span></div>)}</div>
      </>}
    </section>}
  </div>;
}