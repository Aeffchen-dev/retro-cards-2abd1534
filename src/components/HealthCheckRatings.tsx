import HealthCheckChart from './HealthCheckChart';
import { StatementScale } from './RisikoSlide';
import { HEALTH_CATEGORIES, healthScore, healthResults, healthScaleValue, healthScaleScore, revealedPartnerResults, evaluationNames } from './health-check-data';
import { usePartnerSession } from '@/hooks/use-partner-session';
import './health-check.css';
import HealthCheckHistory from './HealthCheckHistory';
import ActionRow from './ActionRow';

type Props = { pageIndex: number; values: Record<string,string>; onChange: (key: string,value: string) => void; names: string[]; categoryColor: string; categoryAccent: string };
export default function HealthCheckRatings({ pageIndex, values, onChange, names, categoryColor, categoryAccent }: Props) {
  const s = usePartnerSession();
  const actualPerson = 'p0';
  const own = healthResults(values, actualPerson);
  const remote = healthResults(s.partnerAnswers.notes?.['105'] ?? {}, 'p0');
  const other = revealedPartnerResults(own, s.sessionId ? remote : healthResults(values, 'p1'));
  const ownName = s.members.find(m => m.user_id === s.user?.id)?.display_name ?? names[0];
  const otherName = s.partner?.display_name ?? names[1];
  if (pageIndex === 8) {
    const completeOwn = healthResults(values, 'p0').every(v => v !== null);
    return <section className="health-ratings health-results" aria-label="Health Check Auswertung">
      <HealthCheckChart own={own} other={other} names={evaluationNames([ownName??'Ich',otherName??'Partner'], Boolean(s.partner))}/>
      <HealthCheckHistory complete={completeOwn} categoryColor={categoryColor} categoryAccent={categoryAccent} results={{ people: [
        { id: s.user?.id ?? 'p0', name: ownName ?? 'Ich', scores: healthResults(values,'p0') },
        { id: s.partner?.user_id ?? 'p1', name: otherName ?? 'Partner', scores: other },
      ] }} />
    </section>;
  }
  return <section className="health-ratings" aria-label="Health Check Bewertungen">
    <div className="health-rating-items">{HEALTH_CATEGORIES.slice(pageIndex,pageIndex+1).map(c => {
      const score = healthScore(values[`hc_${actualPerson}_${c.id}`]);
      const otherScore = other[HEALTH_CATEGORIES.findIndex(category => category.id === c.id)] ?? null;
      return <div key={c.id} className="health-rating-item"><div className="health-rating-heading"><div className="health-category-label"><span className="health-category-square" aria-hidden="true"><span /></span><p className="health-category-text">{c.title}</p></div></div><div className="health-question-scale"><h2 className="retro-heading">“{c.text}”</h2><div className="health-scale-centre">
        <div className="health-rating-control health-smiley-control risiko-page swiper-no-swiping" onKeyDownCapture={e => {
          e.stopPropagation();
          const delta = ['ArrowRight', 'ArrowUp'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(e.key) ? -1 : 0;
          if (!delta && e.key !== 'Home' && e.key !== 'End') return;
          e.preventDefault();
          onChange(`hc_${actualPerson}_${c.id}`, String(e.key === 'Home' ? 1 : e.key === 'End' ? 5 : Math.min(5, Math.max(1, (score ?? 3) + delta))));
        }}><StatementScale value={healthScaleValue(score)} ariaLabel={c.title} captions={[]} fieldMin={120} onChange={value => onChange(`hc_${actualPerson}_${c.id}`,healthScaleScore(value))} /></div>
        <div className="health-scale-ends"><span>Trifft noch nicht zu</span><span>Trifft immer zu</span></div>
        {otherScore !== null && <p className="health-other-score">{s.sessionId ? otherName : names[actualPerson === 'p0' ? 1 : 0]}: {otherScore}/5</p>}
      </div></div></div>;
    })}</div>
    <ActionRow className="hc-helper health-rating-footer" icon="IconInfo" label="Schiebt den Regler zur passenden Antwort." accent="transparent" fieldBg="transparent" iconColor="var(--retro-info-text)" labelColor="var(--retro-info-text)" />
  </section>;
}