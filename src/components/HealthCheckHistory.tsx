import { useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import ActionRow from './ActionRow';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HEALTH_CATEGORIES } from './health-check-data';
import { HealthHistoryEntry, HistoryResults, HEALTH_HISTORY_KEY, parseHistoryResults, chronologicalHistory, readLocalHealthHistory, historyScore, historyForPair, pastHealthHistory, healthTrend, upsertDailyEntry, yearReview } from './health-history-data';
import { readMemoryThumbs } from './memory-thumbs';

export default function HealthCheckHistory({ results, complete, categoryColor, categoryAccent }: { results: HistoryResults; complete: boolean; categoryColor: string; categoryAccent: string }) {
  const session = usePartnerSession();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HealthHistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [topic, setTopic] = useState('average');
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
  const people = results.people.filter(p => entries.some(e => e.results.people.some(person => person.id === p.id)));
  const pastEntries = pastHealthHistory(entries);
  void notice; void setNotice;
  const hasPast = pastEntries.length > 0;
  const latest = pastEntries[pastEntries.length - 1];
  const review = yearReview(entries, results.people[0]?.id ?? '');
  const thumbs = review ? readMemoryThumbs() : [];
  const photo = thumbs[thumbs.length - 1];
  const timeline = [...pastEntries, {id:'current',owner_id:null,recorded_at:new Date().toISOString(),results}];
  const chart = timeline.map((e, i) => ({ index: i+1, date: e.id === 'current' ? 'Aktuell' : new Date(e.recorded_at).toLocaleDateString('de-DE'), ...Object.fromEntries(people.map(p => [p.id, historyScore(e.results.people.find(person => person.id === p.id)?.scores ?? [],topic)])) }));
  return <div className={`health-history ${open ? 'health-history-open' : ''}`}>
    <div className="health-history-actions">
      {hasPast && !loading && <ActionRow iconNode={<History size={16}/>} label="Verlauf" accent={categoryAccent} fieldBg={categoryColor} className="health-history-trigger" onClick={() => setOpen(value => !value)} />}
    </div>
    {!open && error && <p role="alert">{error}</p>}
    {review && <section className="health-year-review" aria-label="Jahresrückblick">
      <h3>Jahresrückblick · {review.count} Retros</h3>
      {review.best && <p>Beste Kategorie: <strong>{review.best.title}</strong> ({review.best.score.toLocaleString('de-DE')}/5)</p>}
      {review.change && review.change.delta !== 0 && <p>Größte Veränderung: <strong>{review.change.title}</strong> ({review.change.delta > 0 ? '+' : ''}{review.change.delta})</p>}
      {photo && <figure><img src={photo.src} alt="Memory-Foto aus dem Jahr" /><figcaption>Memory vom {new Date(photo.at).toLocaleDateString('de-DE')}</figcaption></figure>}
    </section>}
    {open && hasPast && <section className="health-history-content swiper-no-swiping" aria-label="Health Check im Verlauf">
      <h3>Health Check im Verlauf</h3>
      {error && <p role="alert">{error}</p>}
      <Select value={topic} onValueChange={setTopic}><SelectTrigger aria-label="Thema im Verlauf"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="average">Durchschnitt</SelectItem>{HEALTH_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select>
      <div className="health-trends" aria-label="Trends zur letzten Retro">{people.map((person,i) => {
        const delta = healthTrend(person.scores,latest?.results.people.find(p=>p.id===person.id)?.scores ?? [],topic);
        return delta === null ? null : <p key={person.id} className={i===0?'health-one':'health-two'}>{person.name}: {delta > 0 ? '↗ +' : delta < 0 ? '↘ ' : '→ '}{delta.toLocaleString('de-DE')} zur letzten Retro</p>;
      })}</div>
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