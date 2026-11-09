import { useEffect, useState } from 'react';
import { Users, Unplug, Share2, X } from 'lucide-react';
import ActionRow from './ActionRow';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { invitationName } from './partner-invitation-data';
import { invitationFromUrl } from '@/hooks/guest-retro-client';

export default function PartnerConnection({ accent = 'var(--retro-info-rule)', initialName = '' }: { accent?: string; initialName?: string }) {
  const s = usePartnerSession();
  const [open, setOpen] = useState(() => Boolean(invitationFromUrl()));
  const [code, setCode] = useState(() => invitationFromUrl());
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  useEffect(() => {
    if (code && s.sessionId) { setOpen(false); setCode(''); window.dispatchEvent(new Event('retro-go-first')); }
    if (disconnecting && !s.sessionId) { setOpen(false); setConfirmDisconnect(false); setDisconnecting(false); }
  }, [code, s.sessionId, disconnecting]);
  const link = s.invite ? `${location.origin}${location.pathname}${s.guest ? '#invite=' : '?join='}${s.invite}` : '';
  const connect = () => {
    if (busy) return;
    setNotice(''); s.setError('');
    void act(() => s.connect(invitationName(initialName), code || undefined));
  };
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); } catch { s.setError('Die Verbindung ist gerade nicht möglich. Bitte erneut versuchen.'); } finally { setBusy(false); } };
  const shareLink = async () => {
    if (!link) return;
    setNotice(''); s.setError('');
    if (navigator.share) {
      try { await navigator.share({ title: 'Unsere gemeinsame Retro', text: 'Mach mit bei unserer Retro.', url: link }); }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; throw error; }
    } else { await navigator.clipboard.writeText(link); setNotice('Einladungslink kopiert'); }
  };
  return <Sheet open={open} onOpenChange={setOpen}>
    <ActionRow accent={accent} iconNode={<Users size={16}/>} iconColor="var(--retro-black)" label={<span className="partner-trigger-label">Partner einladen{s.sessionId && <span className={`partner-status-dot ${s.partner && s.online ? 'is-connected' : 'is-pending'}`} role="img" aria-label={s.partner && s.online ? `${s.partner.display_name} ist verbunden` : 'Wartet auf Beitritt'} />}</span>} className="partner-connect-trigger" onClick={() => { setNotice(''); s.setError(''); setOpen(true); if (!s.sessionId && !code && !busy) connect(); }} />
    <SheetContent side="bottom" className="partner-dialog partner-bottom-sheet swiper-no-swiping">
      <SheetHeader className="partner-sheet-header"><SheetTitle className="retro-heading partner-sheet-title">{!s.sessionId && code ? 'Gemeinsam zur Retro' : 'Partner einladen?'}</SheetTitle><SheetDescription className="partner-sheet-description">{!s.sessionId && code ? 'Mach bei der gemeinsamen Retro mit – ohne Registrierung. Eure Antworten bleiben getrennt und lassen sich vergleichen.' : 'Teile euren privaten Link und macht die Retro gemeinsam – ohne Registrierung. Eure Antworten bleiben getrennt und lassen sich vergleichen.'}</SheetDescription></SheetHeader>
      {!s.sessionId ? <div className="space-y-3">
        {code ? <ActionRow accent={accent} iconNode={<Users size={16}/>} label={busy ? 'Verbindet …' : 'Retro beitreten'} onClick={connect} />
        : busy ? <p role="status" className="text-sm text-muted-foreground">Einladungslink wird erstellt …</p>
        : s.error ? <ActionRow accent={accent} iconNode={<Share2 size={16}/>} label="Erneut versuchen" onClick={connect} /> : null}
      </div> : <div className="space-y-4">
        {s.partner && s.online
          ? <ActionRow accent={accent} iconNode={<X size={16}/>} label={`${s.partner.display_name} ist verbunden`} onClick={() => { setNotice(''); setConfirmDisconnect(true); }} />
          : <p role="status" aria-live="polite">{s.partner ? 'Verbindung wird wiederhergestellt …' : s.invitation === 'pending' ? 'Wartet auf Beitritt' : 'Verbindung wird geprüft …'}</p>}
        <div className="flex items-center justify-between gap-2">
          {link && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { void act(shareLink); }}><Share2 size={16}/> Link teilen</Button>}
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