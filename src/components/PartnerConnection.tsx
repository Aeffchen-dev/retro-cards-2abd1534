import { useEffect, useState } from 'react';
import { Users, Copy, Unplug, Share2 } from 'lucide-react';
import ActionRow from './ActionRow';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { HEALTH_CATEGORIES, healthScore } from './health-check-data';
import { invitationName } from './partner-invitation-data';
import { revealSelection } from './partner-answer-visibility';
import { invitationFromUrl } from '@/hooks/guest-retro-client';
import { RISIKO_STATEMENTS, RISIKO_HOT } from './risiko-data';

export default function PartnerConnection({ accent = 'var(--retro-info-rule)', initialName = '' }: { accent?: string; initialName?: string }) {
  const s = usePartnerSession();
  const [open, setOpen] = useState(() => Boolean(invitationFromUrl()));
  const [code, setCode] = useState(() => invitationFromUrl());
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  useEffect(() => {
    if (code && s.sessionId) { setOpen(false); setCode(''); }
    if (disconnecting && !s.sessionId) { setOpen(false); setConfirmDisconnect(false); setDisconnecting(false); }
  }, [code, s.sessionId, disconnecting]);
  const link = s.invite ? `${location.origin}${location.pathname}${s.guest ? '#invite=' : '?join='}${s.invite}` : '';
  const connect = () => {
    if (busy) return;
    setNotice(''); s.setError('');
    void act(() => s.connect(invitationName(initialName), code || undefined));
  };
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); } catch { s.setError('Die Verbindung ist gerade nicht möglich. Bitte erneut versuchen.'); } finally { setBusy(false); } };
  return <Sheet open={open} onOpenChange={setOpen}>
    <ActionRow accent={accent} iconNode={<Users size={16}/>} iconColor="var(--retro-black)" label="Partner einladen" className="partner-connect-trigger" onClick={() => { setNotice(''); s.setError(''); setOpen(true); if (!s.sessionId && !code && !busy) connect(); }} />
    <SheetContent side="bottom" className="partner-dialog partner-bottom-sheet swiper-no-swiping">
      <SheetHeader className="partner-sheet-header"><SheetTitle className="retro-heading partner-sheet-title">{!s.sessionId && code ? 'Gemeinsam zur Retro' : 'Partner einladen?'}</SheetTitle><SheetDescription className="partner-sheet-description">{!s.sessionId && code ? 'Mach bei der gemeinsamen Retro mit – ohne Registrierung. Eure Antworten bleiben getrennt und lassen sich vergleichen.' : 'Teile euren privaten Link und macht die Retro gemeinsam – ohne Registrierung. Eure Antworten bleiben getrennt und lassen sich vergleichen.'}</SheetDescription></SheetHeader>
      {!s.sessionId ? <div className="space-y-3">
        {code ? <ActionRow accent={accent} iconNode={<Users size={16}/>} label={busy ? 'Verbindet …' : 'Retro beitreten'} onClick={connect} />
        : busy ? <p role="status" className="text-sm text-muted-foreground">Einladungslink wird erstellt …</p>
        : s.error ? <ActionRow accent={accent} iconNode={<Share2 size={16}/>} label="Erneut versuchen" onClick={connect} /> : null}
      </div> : <div className="space-y-4">
        <p role="status" aria-live="polite">{s.invitation === 'accepted' && s.partner ? s.online ? `${s.partner.display_name} ist verbunden` : 'Verbindung wird wiederhergestellt …' : s.invitation === 'pending' ? 'Wartet auf Beitritt' : 'Verbindung wird geprüft …'}</p>
        {s.partner && <div className="partner-live-notes"><h3>{s.partner.display_name} schreibt</h3><PartnerAnswers answers={s.partnerAnswers} /></div>}
        <div className="flex items-center justify-between gap-2">
          {link && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { void act(async () => { await navigator.clipboard.writeText(link); setNotice('Einladungslink kopiert'); }); }}><Copy size={16}/> Link kopieren</Button>}
          {s.partner && <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={busy} onClick={() => { setNotice(''); setConfirmDisconnect(true); }}><Unplug size={16} /> Verbindung trennen</Button>}
        </div>
      </div>}
      {notice && <p role="status" className="text-sm">{notice}</p>}{s.error && <p role="alert" className="text-sm text-destructive">{s.error}</p>}
    </SheetContent>
    <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
      <AlertDialogContent className="max-w-[calc(100%-32px)] sm:max-w-lg">
        <AlertDialogHeader><AlertDialogTitle>Verbindung trennen?</AlertDialogTitle><AlertDialogDescription>Neue Antworten werden danach nicht mehr geteilt. Deine Antworten auf diesem Gerät bleiben erhalten.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={() => { if (!busy) { setDisconnecting(true); void act(s.leave); } }}><Unplug size={16}/> {busy ? 'Trennt …' : 'Jetzt trennen'}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Sheet>;
}
function PartnerAnswers({ answers }: { answers: ReturnType<typeof usePartnerSession>['partnerAnswers'] }) {
  const session = usePartnerSession();
  const ownAnswers = session.members.find(member => member.user_id === session.memberId)?.answers as ReturnType<typeof usePartnerSession>['partnerAnswers'] | undefined;
  const rows: [string, string][] = [];
  const labels: Record<string,string> = { postIts: 'To talk about', takeaways: 'Takeaways', reflection: 'Feedback', nice: 'Perspektivwechsel', thanks: 'Danke für', unspoken: 'Letzte Chance' };
  for (const group of ['postIts','takeaways','reflection'] as const) for (const [key,value] of Object.entries(answers[group] ?? {})) if (value) rows.push([labels[key] ?? labels[group], value]);
  const statementKeys = new Set<string>([...RISIKO_STATEMENTS, RISIKO_HOT].map(([key]) => key));
  for (const [slide,fields] of Object.entries(answers.notes ?? {})) for (const [key,value] of Object.entries(fields)) {
    if (!value || key.startsWith('hc_') || key.startsWith('work_') || key === 'scale') continue;
    if ((slide === '105' || Number(slide) >= 200) && statementKeys.has(key)) {
      if (revealSelection(ownAnswers?.notes?.[slide]?.[key], value) !== undefined) rows.push(['Health Check', value]);
    } else rows.push([slide === '105' || Number(slide) >= 200 ? 'Health Check' : slide === '7' ? 'Intimacy' : slide === '104' ? 'Ideas' : 'Notizen', value]);
  }
  for (const category of HEALTH_CATEGORIES) {
    const rating = healthScore(answers.notes?.['105']?.[`hc_p0_${category.id}`]);
    if (rating !== null && healthScore(ownAnswers?.notes?.['105']?.[`hc_p0_${category.id}`]) !== null) rows.push([category.title, `${rating}/5`]);
  }
  const intimacy = revealSelection(ownAnswers?.notes?.['7']?.scale, answers.notes?.['7']?.scale);
  if (intimacy !== undefined && intimacy !== '') rows.push(['Körperliche Intimität', `${Math.round(Number(intimacy)/25)+1}/5`]);
  for (const [slide, positions] of Object.entries(answers.positions ?? {})) {
    if (slide !== '1' && slide !== '2') continue;
    const ownPositions = ownAnswers?.positions?.[slide] as Record<string,{faceIndex?: number}> | undefined;
    if (revealSelection(ownPositions?.p0?.faceIndex, 'answered') === undefined) continue;
    for (const [person, position] of Object.entries((positions ?? {}) as Record<string,{ faceIndex?: number }>)) {
      if (typeof position.faceIndex === 'number') rows.push([slide === '1' ? 'Persönliches Gefühl' : 'Beziehungsgefühl', `${person === 'p0' ? 'Eigene Auswahl' : 'Partner-Auswahl'}: ${['😭','🙁','😐','🙂','😄'][position.faceIndex] ?? '–'}`]);
    }
  }
  return rows.length ? <dl>{rows.map(([label,value],i) => <div key={i}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Noch keine Texte geteilt.</p>;
}