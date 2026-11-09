import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { StatementScale } from './RisikoSlide';
import { Button } from '@/components/ui/button';
import { HEALTH_CATEGORIES, healthScore, healthResults, HEALTH_SATISFACTION_CAPTIONS, healthScaleValue, healthScaleScore } from './health-check-data';
import { usePartnerSession } from '@/hooks/use-partner-session';
import './health-check.css';

type Props = { pageIndex: number; values: Record<string,string>; onChange: (key: string,value: string) => void; onEvaluate: () => void; names: string[] };
export default function HealthCheckRatings({ pageIndex, values, onChange, onEvaluate, names }: Props) {
  const s = usePartnerSession();
  const [person, setPerson] = useState('p0');
  const actualPerson = s.sessionId ? 'p0' : person;
  const own = healthResults(values, actualPerson);
  const remote = healthResults(s.partnerAnswers.notes?.['105'] ?? {}, 'p0');
  const other = s.sessionId ? remote : healthResults(values, 'p1');
  const ownName = s.members.find(m => m.user_id === s.user?.id)?.display_name ?? names[0];
  const otherName = s.partner?.display_name ?? names[1];
  const allAnswered = own.every(v => v !== null);
  if (pageIndex === 4) {
    const data = HEALTH_CATEGORIES.map((c,i) => ({ axis: c.axis, own: healthResults(values,'p0')[i], other: other[i] }));
    const completeOwn = healthResults(values, 'p0').every(v => v !== null);
    const completeOther = other.every(v => v !== null);
    return <section className="health-ratings health-results" aria-label="Health Check Auswertung">
      <h2 className="retro-heading">Euer Health Check</h2>
      <div className="health-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="65%">
        <PolarGrid stroke="var(--retro-info-rule)" /><PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--color-text-primary)', fontSize: 12 }} /><PolarRadiusAxis domain={[0,5]} tickCount={6} tick={false} axisLine={false} />
        {completeOwn && <Radar isAnimationActive={false} name={ownName} dataKey="own" stroke="var(--health-partner-one)" fill="var(--health-partner-one)" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3 }} />}
        {completeOther && <Radar isAnimationActive={false} name={otherName} dataKey="other" stroke="var(--health-partner-two)" fill="var(--health-partner-two)" fillOpacity={0.08} strokeWidth={2} dot={{ r: 3 }} />}
      </RadarChart></ResponsiveContainer></div>
      <div className="health-legend"><span className="health-one">{ownName}</span><span className="health-two">{otherName}{!completeOther ? ' · noch nicht vollständig' : ''}</span></div>
      {!completeOwn && <p className="text-sm text-muted-foreground">Deine Bewertung ist noch nicht vollständig.</p>}
      <div className="health-result-table" role="table" aria-label="Bewertungen beider Partner"><div role="row" className="health-table-head"><span role="columnheader">Thema</span><span role="columnheader">{ownName}</span><span role="columnheader">{otherName}</span></div>{HEALTH_CATEGORIES.map((c,i) => <div role="row" key={c.id}><span role="cell">{c.axis}</span><span role="cell">{data[i].own ?? '–'}/5</span><span role="cell">{other[i] ?? '–'}/5</span></div>)}</div>
    </section>;
  }
  return <section className="health-ratings" aria-label="Health Check Bewertungen">
    {!s.sessionId && <div className="health-person-switch" aria-label="Bewertung von">{names.slice(0,2).map((name,i) => <Button key={i} size="sm" aria-pressed={person === `p${i}`} variant="outline" onClick={() => setPerson(`p${i}`)}>{name}</Button>)}</div>}
    {s.sessionId && <p className="health-rater">{ownName}{s.partner ? ` · live mit ${otherName}` : ' · wartet auf Partner'}</p>}
    <p className="health-rating-hint">1 = Gar nicht zufrieden · 5 = Sehr zufrieden</p>
    <div className="health-rating-items">{HEALTH_CATEGORIES.slice(pageIndex*2,pageIndex*2+2).map(c => {
      const score = healthScore(values[`hc_${actualPerson}_${c.id}`]);
      const otherScore = s.sessionId ? healthScore(s.partnerAnswers.notes?.['105']?.[`hc_p0_${c.id}`]) : healthScore(values[`hc_${actualPerson === 'p0' ? 'p1' : 'p0'}_${c.id}`]);
      return <div key={c.id} className="health-rating-item"><div className="health-rating-heading"><h2 className="retro-heading">{c.title}</h2><output>{score ?? '–'}/5</output></div><p>{c.text}</p>
        <div className="health-rating-control health-smiley-control risiko-page swiper-no-swiping" onKeyDownCapture={e => {
          e.stopPropagation();
          const delta = ['ArrowRight', 'ArrowUp'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(e.key) ? -1 : 0;
          if (!delta && e.key !== 'Home' && e.key !== 'End') return;
          e.preventDefault();
          onChange(`hc_${actualPerson}_${c.id}`, String(e.key === 'Home' ? 1 : e.key === 'End' ? 5 : Math.min(5, Math.max(1, (score ?? 3) + delta))));
        }}><StatementScale value={healthScaleValue(score)} ariaLabel={c.title} captions={HEALTH_SATISFACTION_CAPTIONS} fieldMin={80} onChange={value => onChange(`hc_${actualPerson}_${c.id}`,healthScaleScore(value))} /></div>
        {otherScore !== null && <p className="health-other-score">{s.sessionId ? otherName : names[actualPerson === 'p0' ? 1 : 0]}: {otherScore}/5</p>}
      </div>;
    })}</div>
    <Button className="health-evaluate" variant="outline" onClick={onEvaluate}><BarChart3 size={18} /> Auswerten <span className="health-progress">{own.filter(v => v !== null).length}/8</span></Button>
    {!allAnswered && pageIndex === 3 && <p className="text-sm text-muted-foreground">Für dein vollständiges Diagramm fehlen noch Bewertungen.</p>}
  </section>;
}