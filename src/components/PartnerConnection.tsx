import { useState } from 'react';
import { Users, Copy, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import '@lovable.dev/cloud-auth-js/styles.css';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HEALTH_CATEGORIES, healthScore } from './health-check-data';

export default function PartnerConnection() {
  const s = usePartnerSession();
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('join') ?? '');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const link = `${location.origin}${location.pathname}?join=${s.invite}`;
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); } catch { s.setError('Die Verbindung ist gerade nicht möglich. Bitte erneut versuchen.'); } finally { setBusy(false); } };
  const sendLink = async () => {
    const url = new URL(location.href); if (code) url.searchParams.set('join', code);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: url.toString() } });
    if (error) s.setError(error.message); else setNotice('Der Anmeldelink ist unterwegs. Schau auch im Spam-Ordner nach.');
  };
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" className="partner-connect-trigger swiper-no-swiping"><Users size={16} />{s.partner ? `Verbunden mit ${s.partner.display_name}` : 'Zu zweit verbinden'}</Button></DialogTrigger>
    <DialogContent className="partner-dialog swiper-no-swiping">
      <DialogHeader><DialogTitle>Gemeinsame Retro</DialogTitle></DialogHeader>
      {!s.user ? <div className="space-y-3">
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => act(async () => { const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: location.href }); if (r.error) s.setError(r.error.message); })}>Mit Google fortfahren</Button>
        <Button className="lovable-auth-button w-full" disabled={busy} onClick={() => act(async () => { const r = await lovable.auth.signInWithOAuth('lovable', { redirect_uri: location.href }); if (r.error) s.setError(r.error.message); })}>Continue with Lovable</Button>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(sendLink); }}>
          <Input type="email" required maxLength={255} aria-label="E-Mail" placeholder="Deine E-Mail" value={email} onChange={e => setEmail(e.target.value)} />
          <Button type="submit" variant="outline" className="w-full" disabled={busy}>Anmeldelink senden</Button>
        </form>
      </div> : !s.sessionId ? <div className="space-y-3">
        <Input aria-label="Dein Name für die Verbindung" placeholder="Dein Name" maxLength={80} value={name} onChange={e => setName(e.target.value)} />
        <Button className="w-full" disabled={busy || !name.trim()} onClick={() => act(() => s.connect(name))}>Retro starten</Button>
        <Input aria-label="Einladungscode" placeholder="Einladungscode" value={code} onChange={e => setCode(e.target.value.trim().split('join=').pop() ?? '')} />
        <Button variant="outline" className="w-full" disabled={busy || !name.trim() || !code} onClick={() => act(() => s.connect(name, code))}>Retro beitreten</Button>
        <p className="text-sm text-muted-foreground">In dieser Retro teilt ihr eure Texte und Auswahlen miteinander.</p>
      </div> : <div className="space-y-4">
        <p>{s.partner ? `Mit ${s.partner.display_name} verbunden` : 'Warte auf deinen Partner'}</p>
        <p className="text-sm text-muted-foreground">{s.online ? 'Live-Verbindung aktiv' : 'Verbindung wird wiederhergestellt …'}</p>
        {!s.partner && s.invite && <><Input readOnly aria-label="Einladungslink" value={link} /><Button variant="outline" onClick={() => act(async () => { await navigator.clipboard.writeText(link); setNotice('Einladungslink kopiert'); })}><Copy size={16} /> Einladung kopieren</Button></>}
        <Button variant="outline" disabled={busy} onClick={() => act(s.leave)}><Unplug size={16} /> Verbindung trennen</Button>
        {s.partner && <div className="partner-live-notes"><h3>{s.partner.display_name} schreibt</h3><PartnerAnswers answers={s.partnerAnswers} /></div>}
      </div>}
      {notice && <p role="status" className="text-sm">{notice}</p>}{s.error && <p role="alert" className="text-sm text-destructive">{s.error}</p>}
    </DialogContent>
  </Dialog>;
}
function PartnerAnswers({ answers }: { answers: ReturnType<typeof usePartnerSession>['partnerAnswers'] }) {
  const rows: [string, string][] = [];
  if (answers.setup) {
    rows.push(['Setup', [ `${answers.setup.emoji1} ${answers.setup.name1}`, `${answers.setup.emoji2} ${answers.setup.name2}`, ...answers.setup.extraPartners.map(p => `${p.emoji} ${p.name}`), answers.setup.openRelationship ? 'Nicht monogam' : 'Monogam' ].join(' · ')]);
  }
  if (answers.question) rows.push(['Aktuelle Frage', answers.question]);
  const labels: Record<string,string> = { postIts: 'To talk about', takeaways: 'Takeaways', reflection: 'Feedback', nice: 'Perspektivwechsel', thanks: 'Danke für', unspoken: 'Letzte Chance' };
  for (const group of ['postIts','takeaways','reflection'] as const) for (const [key,value] of Object.entries(answers[group] ?? {})) if (value) rows.push([labels[key] ?? labels[group], value]);
  for (const [slide,fields] of Object.entries(answers.notes ?? {})) for (const [key,value] of Object.entries(fields)) if (value && !key.startsWith('hc_') && !key.startsWith('work_') && key !== 'scale') rows.push([slide === '105' || Number(slide) >= 200 ? 'Health Check' : slide === '7' ? 'Intimacy' : slide === '104' ? 'Ideas' : 'Notizen', value]);
  for (const category of HEALTH_CATEGORIES) {
    const rating = healthScore(answers.notes?.['105']?.[`hc_p0_${category.id}`]);
    if (rating !== null) rows.push([category.title, `${rating}/5`]);
  }
  const intimacy = answers.notes?.['7']?.scale;
  if (intimacy !== undefined && intimacy !== '') rows.push(['Körperliche Intimität', `${Math.round(Number(intimacy)/25)+1}/5`]);
  for (const [slide, positions] of Object.entries(answers.positions ?? {})) {
    if (slide !== '1' && slide !== '2') continue;
    for (const [person, position] of Object.entries((positions ?? {}) as Record<string,{ faceIndex?: number }>)) {
      if (typeof position.faceIndex === 'number') rows.push([slide === '1' ? 'Persönliches Gefühl' : 'Beziehungsgefühl', `${person === 'p0' ? 'Eigene Auswahl' : 'Partner-Auswahl'}: ${['😭','🙁','😐','🙂','😄'][position.faceIndex] ?? '–'}`]);
    }
  }
  return rows.length ? <dl>{rows.map(([label,value],i) => <div key={i}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Noch keine Texte geteilt.</p>;
}