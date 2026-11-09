import { FACES, StatementScale } from './RisikoSlide';
import { usePartnerSession } from '@/hooks/use-partner-session';
import { MOOD_NOTES_ID, moodChange, moodValue, revealedMood, type MoodPhase } from './mood-check-data';
import ActionRow from './ActionRow';
import './mood-check.css';

function MoodFace({ value }: { value: number | null }) {
  const Face = value === null ? undefined : FACES[Math.round(value / 25)];
  return <span className="mood-result-face">{Face ? <Face size={24} /> : <span>–</span>}</span>;
}

export function MoodSummary({ values }: { values: Record<string, string> }) {
  const s = usePartnerSession();
  const partnerMood = revealedMood(values, s.partnerAnswers.notes?.[String(MOOD_NOTES_ID)] ?? {});
  const rows = [
    { name: s.partner ? s.members.find(m => m.user_id === s.memberId)?.display_name ?? 'Du' : 'Du', before: moodValue(values.before), after: moodValue(values.after) },
    ...(s.partner ? [{ name: s.partner.display_name, ...partnerMood }] : []),
  ];
  return <section className="mood-summary" aria-label="Stimmung vorher und nachher">
    <h3>Stimmung vorher & nachher</h3>
    <div className="mood-summary-head"><span /><span>Vorher</span><span>Nachher</span></div>
    {rows.map((row, i) => {
      const delta = moodChange(row.before, row.after);
      return <div key={i} className={`mood-summary-person${i ? ' mood-summary-partner' : ''}`}>
        <div className="mood-summary-row"><span>{row.name}</span><MoodFace value={row.before} /><MoodFace value={row.after} /></div>
        <p>{delta === null ? 'Noch nicht vollständig beantwortet' : delta > 0 ? 'Stimmung verbessert' : delta < 0 ? 'Stimmung gesunken' : 'Stimmung unverändert'}</p>
      </div>;
    })}
  </section>;
}

export default function MoodCheck({ phase, values, onChange }: { phase: MoodPhase; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  const s = usePartnerSession();
  const partnerValue = s.partner ? revealedMood(values, s.partnerAnswers.notes?.[String(MOOD_NOTES_ID)] ?? {})[phase] : null;
  const heading = phase === 'before' ? 'Wie fühlst du dich vor unserer Retro?' : 'Wie fühlst du dich nach unserer Retro?';
  return <section className="health-ratings mood-check" aria-label={phase === 'before' ? 'Stimmung vor der Retro' : 'Stimmung nach der Retro'}>
    <div className="health-rating-heading"><div className="health-category-label"><p className="health-category-text">{phase === 'before' ? 'Vorher' : 'Nachher'}</p></div></div>
    <h2 className="retro-heading">{heading}</h2>
    <div className="health-scale-centre">
      <div className="health-rating-control health-smiley-control risiko-page swiper-no-swiping">
        <StatementScale value={moodValue(values[phase]) === null ? undefined : values[phase]} ariaLabel={heading} captions={[]} fieldMin={120}
          comparison={partnerValue !== null ? { value: String(partnerValue), label: `${s.partner?.display_name ?? 'Partner'} · Stimmung`, name: s.partner?.display_name ?? 'Partner', color: 'var(--health-partner-two)' } : undefined}
          onChange={value => onChange(phase, value)} />
      </div>
      <div className="health-scale-ends"><span>Gar nicht gut</span><span>Sehr gut</span></div>
    </div>
    {phase === 'after' && <MoodSummary values={values} />}
    <ActionRow className="hc-helper health-rating-footer" icon="IconInfo" label="Schiebt den Regler zur passenden Antwort" accent="transparent" fieldBg="transparent" iconColor="var(--retro-info-text)" labelColor="var(--retro-info-text)" />
  </section>;
}