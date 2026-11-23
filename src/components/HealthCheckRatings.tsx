import HealthCheckChart from './HealthCheckChart';
import { StatementScale } from './RisikoSlide';
import { SCALE_CAPTIONS } from './risiko-data';
import { HEALTH_CATEGORIES, healthScore, healthResults, healthScaleValue, healthScaleScore, revealedPartnerResults, evaluationNames } from './health-check-data';
import { usePartnerSession } from '@/hooks/use-partner-session';
import './health-check.css';
import HealthCheckHistory from './HealthCheckHistory';
import ActionRow from './ActionRow';
import { useState } from 'react';
import type { HistoryResults } from './health-history-data';

type Props = { pageIndex: number; values: Record<string,string>; onChange: (key: string,value: string) => void; names: string[]; categoryColor: string; categoryAccent: string; partnerName?: string };
export default function HealthCheckRatings({ pageIndex, values, onChange, names, categoryColor, categoryAccent, partnerName }: Props) {
  const s = usePartnerSession();
  const [picked, setPicked] = useState<HistoryResults | null>(null);
  const actualPerson = 'p0';
  const own = healthResults(values, actualPerson);
  const remote = healthResults(s.partnerAnswers.notes?.['105'] ?? {}, 'p0');
  const other = revealedPartnerResults(own, s.sessionId ? remote : healthResults(values, 'p1'));
  const ownName = names[0] || s.members.find(m => m.user_id === s.memberId)?.display_name;
  const otherName = (s.partner ? (partnerName || 'Partner') : names[1]);
  if (pageIndex === 8) {
    const completeOwn = healthResults(values, 'p0').every(v => v !== null);
    return <section className="health-ratings health-results" aria-label="Health Check Auswertung">
      <h2 className="retro-heading">Auswertung</h2>
      <HealthCheckChart own={picked ? picked.people[0]?.scores ?? [] : own} other={picked ? picked.people[1]?.scores ?? [] : other} names={evaluationNames([ownName??'Ich',otherName??'Partner'], Boolean(s.partner))}/>
      <HealthCheckHistory onSelect={setPicked} complete={completeOwn} categoryColor={categoryColor} categoryAccent={categoryAccent} results={{ people: [
        { id: s.memberId ?? 'p0', name: ownName ?? 'Ich', scores: healthResults(values,'p0') },
        { id: s.partner?.user_id ?? 'p1', name: otherName ?? 'Partner', scores: other },
      ] }} />
    </section>;
  }
  return <section className="health-ratings" aria-label="Health Check Bewertungen">
    <div className="health-rating-items">{HEALTH_CATEGORIES.slice(pageIndex,pageIndex+1).map(c => {
      const score = healthScore(values[`hc_${actualPerson}_${c.id}`]);
      const otherScore = other[HEALTH_CATEGORIES.findIndex(category => category.id === c.id)] ?? null;
      return <div key={c.id} className="health-rating-item"><div className="health-rating-heading"><div className="health-category-label"><p className="health-category-text">{c.title}</p></div></div><div className="health-question-scale"><h2 className="retro-heading">“{c.text}”</h2><div className="health-scale-centre">
        <div className="health-rating-control health-smiley-control risiko-page swiper-no-swiping" onKeyDownCapture={e => {
          e.stopPropagation();
          const delta = ['ArrowRight', 'ArrowUp'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(e.key) ? -1 : 0;
          if (!delta && e.key !== 'Home' && e.key !== 'End') return;
          e.preventDefault();
          onChange(`hc_${actualPerson}_${c.id}`, String(e.key === 'Home' ? 1 : e.key === 'End' ? 5 : Math.min(5, Math.max(1, (score ?? 3) + delta))));
        }}><StatementScale value={healthScaleValue(score)} ariaLabel={c.title} captions={[]} fieldMin={120}
          comparison={otherScore !== null ? { value: String((otherScore - 1) * 25), label: `${otherName ?? 'Partner'}: ${SCALE_CAPTIONS[otherScore - 1]}`, color: categoryColor, name: otherName ?? 'Partner' } : undefined}
          onChange={value => onChange(`hc_${actualPerson}_${c.id}`,healthScaleScore(value))} /></div>
        {s.partner && score === null && remote[HEALTH_CATEGORIES.findIndex(category => category.id === c.id)] !== null && <p className="health-partner-waiting">{otherName} hat schon geantwortet – antworte zuerst, um es zu sehen</p>}
        <div className="health-scale-ends"><span>Trifft noch nicht zu</span>{score !== null && <span className="health-scale-choice" aria-live="polite">{SCALE_CAPTIONS[score - 1]}</span>}<span>Trifft immer zu</span></div>
      </div></div></div>;
    })}</div>
    <ActionRow className="hc-helper health-rating-footer" icon="IconInfo" label="Schiebt den Regler zur passenden Antwort" accent="transparent" fieldBg="transparent" iconColor="var(--retro-info-text)" labelColor="var(--retro-info-text)" />
  </section>;
}