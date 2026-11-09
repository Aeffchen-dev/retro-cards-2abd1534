import { useEffect, useRef, useState } from 'react';
import { usePartnerSession } from '@/hooks/use-partner-session';

/** Shows "[Name] schreibt gerade …" for a few seconds whenever the partner's typing beat changes. */
export default function PartnerActivity() {
  const s = usePartnerSession();
  const typingAt = s.partner ? s.partnerAnswers.activity?.typingAt ?? 0 : 0;
  const seen = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // The first value read is old activity, not live typing.
    if (seen.current === null) { seen.current = typingAt; return; }
    if (!typingAt || typingAt === seen.current) return;
    seen.current = typingAt;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [typingAt]);
  if (!visible || !s.partner) return null;
  return <p className="partner-activity screen-only" role="status" aria-live="polite">{s.partner.display_name} schreibt gerade …</p>;
}
