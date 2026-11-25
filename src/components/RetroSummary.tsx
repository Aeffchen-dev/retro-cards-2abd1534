import { retroSummary, healthInsights, sharedStrengths, talkTopics, filledTopics, type EvaluationTopic } from "./retro-summary";
import { pastHealthHistory, readLocalHealthHistory } from "./health-history-data";
import { HEALTH_CATEGORIES, healthResults } from './health-check-data';
import RetroAiInsights from './RetroAiInsights';
import type { RetroAnswerInput } from './retro-ai-data';

interface Props {
  values: Record<string, string>;
  persons: { key: string; name: string }[];
  intimacy?: string;
  partnerValues?: Record<string, string>;
  partnerName?: string;
  ideas?: Record<string, string>;
  answers: RetroAnswerInput[];
  accent: string;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** The Takeaways card's evaluation: averages, per-topic bars and one inline synthesis. */
export default function RetroSummary({ values, persons, intimacy, partnerValues, partnerName, ideas, answers, accent }: Props) {
  const s = retroSummary(values, persons.map((p) => p.key), intimacy);
  const own = healthResults(values, 'p0');
  const hasPartner = Boolean(partnerValues);
  const partner = partnerValues ? healthResults(partnerValues, 'p0') : HEALTH_CATEGORIES.map(() => null);
  const past = pastHealthHistory(readLocalHealthHistory());
  const previous = past.length ? past[past.length - 1].results.people[0]?.scores ?? null : null;
  const ins = healthInsights(own, partner, HEALTH_CATEGORIES.map(c => c.axis), previous, ideas);
  const me = persons[0]?.name || 'Du';
  const who = partnerName || persons[1]?.name || 'Partner';
  const topics: EvaluationTopic[] = HEALTH_CATEGORIES.map((c, i) => ({ id: c.id, title: c.axis, own: own[i], partner: partner[i] }));
  const filled = filledTopics(topics);
  const strengths = sharedStrengths(topics, hasPartner);
  const talk = talkTopics(topics);

  // Only what was actually entered is summarised: an empty section stays hidden.
  const fallback = <>
    {strengths.length > 0 && <div className="retro-eval-box"><h4>Was gut funktioniert</h4><p>{strengths.join(', ')}</p></div>}
    {talk.length > 0 && <div className="retro-eval-box"><h4>Was Aufmerksamkeit braucht</h4><ul>{talk.map(t => <li key={t.title}><strong>{t.title}:</strong> {t.question}</li>)}</ul></div>}
    {ins.nextSteps.length > 0 && <div className="retro-eval-box"><h4>Eure Vorhaben</h4><ul className="retro-eval-checks">{ins.nextSteps.map(n => <li key={n}>☐ {n}</li>)}</ul></div>}
  </>;

  return (
    <section className="retro-summary retro-eval w-full" aria-label="Auswertung">
      {(ins.average !== null || ins.partnerAverage !== null) && <div className="retro-eval-head">
        {ins.average !== null && <div><span className="retro-eval-big">{fmt(ins.average)}</span><span className="retro-eval-who">{me}</span></div>}
        {hasPartner && ins.partnerAverage !== null && <div><span className="retro-eval-big is-partner">{fmt(ins.partnerAverage)}</span><span className="retro-eval-who">{who}</span></div>}
      </div>}
      {ins.trend !== null && <p className={`retro-eval-trend ${ins.trend > 0 ? 'is-up' : ins.trend < 0 ? 'is-down' : ''}`}>{ins.trend === 0 ? '= gleich wie letzte Retro' : `${ins.trend > 0 ? '▲ +' : '▼ '}${fmt(ins.trend)} seit der letzten Retro`}</p>}

      {filled.length > 0 && <ul className="retro-eval-bars" aria-label="Themen">
        {filled.map(t => (
          <li key={t.id}>
            <span className="retro-eval-topic">{t.title}</span>
            <span className="retro-eval-pair">
              {t.own !== null && <span className="retro-eval-bar" style={{ width: `${(t.own / 5) * 100}%` }} aria-label={`${me}: ${t.own} von 5`} />}
              {hasPartner && t.partner !== null && <span className="retro-eval-bar is-partner" style={{ width: `${(t.partner / 5) * 100}%` }} aria-label={`${who}: ${t.partner} von 5`} />}
            </span>
          </li>
        ))}
      </ul>}

      <RetroAiInsights answers={answers} accent={accent} fallback={fallback} />

      {s.workload && s.workload.length > 1 && (
        <div className="retro-eval-box"><h4>Beziehungsarbeit</h4>
          <div className="retro-eval-split">{s.workload.map((w, i) => <span key={w.key} className={i ? 'is-partner' : ''} style={{ width: `${w.share}%` }} />)}</div>
          <p>{s.workload.map((w, i) => `${i === 1 && hasPartner ? who : persons.find(p => p.key === w.key)?.name || 'Partner'} ${Math.round(w.share)} %`).join(' · ')}</p>
        </div>
      )}
      {s.intimacy ? <p className="retro-eval-note">Intimität: {"♥".repeat(s.intimacy)}{"♡".repeat(5 - s.intimacy)}</p> : null}
    </section>
  );
}
