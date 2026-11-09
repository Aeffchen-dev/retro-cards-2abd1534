import { useState } from 'react';
import { Users, Copy, Unplug, Share2 } from 'lucide-react';
import ActionRow from './ActionRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HEALTH_CATEGORIES, healthScore } from './health-check-data';

export default function PartnerConnection({ accent = 'var(--retro-info-rule)', initialName = '' }: { accent?: string; initialName?: string }) {
  const s = usePartnerSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('join') ?? '');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const link = s.invite ? `${location.origin}${location.pathname}?join=${s.invite}` : `${location.origin}${location.pathname}`;
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); } catch { s.setError('Die Verbindung ist gerade nicht möglich. Bitte erneut versuchen.'); } finally { setBusy(false); } };
  const shareLink = async () => {
    if (navigator.share) {
      try { await navigator.share({title:'Unsere gemeinsame Retro',text:'Mach mit bei unserer Retro.',url:link}); }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; throw error; }
    } else { await navigator.clipboard.writeText(link); setNotice('Link kopiert'); }
  };
  return <Sheet open={open} onOpenChange={setOpen}>
    <ActionRow accent={accent} iconNode={<Users size={16}/>} iconColor="var(--retro-black)" label={s.partner ? `Verbunden mit ${s.partner.display_name}` : 'Zu zweit verbinden'} className="partner-connect-trigger" onClick={() => { if (!name) setName(initialName); setOpen(true); }} />
    <SheetContent side="bottom" className="partner-dialog partner-bottom-sheet swiper-no-swiping">
      <SheetHeader className="partner-sheet-header"><SheetTitle className="retro-heading partner-sheet-title">Zu zweit verbinden?</SheetTitle><SheetDescription className="partner-sheet-description">Teile euren Einladungslink mit deinem Partner. Sobald ihr beide angemeldet und verbunden seid, seht ihr eure Texte und Auswahlen auf allen Karten live. Eure eigenen Antworten bleiben getrennt; eure Health-Check-Ergebnisse könnt ihr gemeinsam vergleichen.</SheetDescription></SheetHeader>
      {s.user && !s.sessionId && <p className="text-sm text-muted-foreground">Starte eine Retro, um einen privaten Einladungslink zu erhalten.</p>}
      {!s.user ? <div className="space-y-3">
        <ActionRow accent={accent} iconNode={<Share2 size={16}/>} iconColor="var(--retro-black)" label="Link teilen" onClick={() => { if (!busy) void act(shareLink); }} />
        <p className="text-sm text-muted-foreground">Dieser Link öffnet die Retro. Ohne Anmeldung werden eure Antworten noch nicht live miteinander geteilt.</p>
      </div> : !s.sessionId ? <div className="space-y-3">
        <Input aria-label="Dein Name für die Verbindung" placeholder="Dein Name" maxLength={80} value={name} onChange={e => setName(e.target.value)} />
        <Button className="w-full" disabled={busy || !name.trim()} onClick={() => act(() => s.connect(name))}>Retro starten</Button>
        <Input aria-label="Einladungscode" placeholder="Einladungscode" value={code} onChange={e => setCode(e.target.value.trim().split('join=').pop() ?? '')} />
        <Button variant="outline" className="w-full" disabled={busy || !name.trim() || !code} onClick={() => act(() => s.connect(name, code))}>Retro beitreten</Button>
        <p className="text-sm text-muted-foreground">In dieser Retro teilt ihr eure Texte und Auswahlen miteinander.</p>
      </div> : <div className="space-y-4">
        <p>{s.partner ? `Mit ${s.partner.display_name} verbunden` : 'Warte auf deinen Partner'}</p>
        <p className="text-sm text-muted-foreground">{s.online ? 'Live-Verbindung aktiv' : 'Verbindung wird wiederhergestellt …'}</p>
        {s.invite && <><Input readOnly aria-label="Einladungslink" value={link} /><div className="flex flex-wrap gap-2"><ActionRow accent={accent} iconNode={<Share2 size={16}/>} iconColor="var(--retro-black)" label="Link teilen" onClick={() => { if (!busy) void act(shareLink); }} /><ActionRow accent={accent} iconNode={<Copy size={16}/>} iconColor="var(--retro-black)" label="Link kopieren" onClick={() => { if (!busy) void act(async () => { await navigator.clipboard.writeText(link); setNotice('Einladungslink kopiert'); }); }} /></div></>}
        <Button variant="outline" disabled={busy} onClick={() => act(s.leave)}><Unplug size={16} /> Verbindung trennen</Button>
        {s.partner && <div className="partner-live-notes"><h3>{s.partner.display_name} schreibt</h3><PartnerAnswers answers={s.partnerAnswers} /></div>}
      </div>}
      {notice && <p role="status" className="text-sm">{notice}</p>}{s.error && <p role="alert" className="text-sm text-destructive">{s.error}</p>}
    </SheetContent>
  </Sheet>;
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