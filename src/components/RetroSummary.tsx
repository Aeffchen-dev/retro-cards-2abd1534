import { retroSummary, healthInsights, sharedStrengths, talkTopics, type EvaluationTopic } from "./retro-summary";
import { pastHealthHistory, readLocalHealthHistory } from "./health-history-data";
import { HEALTH_CATEGORIES, healthResults } from './health-check-data';

interface Props {
  values: Record<string, string>;
  persons: { key: string; name: string }[];
  intimacy?: string;
  partnerValues?: Record<string, string>;
  partnerName?: string;
  ideas?: Record<string, string>;
  onOpenHealthCheck?: () => void;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** The Takeaways card's evaluation: averages, per-topic bars and three clear boxes. */
export default function RetroSummary({ values, persons, intimacy, partnerValues, partnerName, ideas, onOpenHealthCheck }: Props) {
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
  const answered = own.filter(v => v !== null).length;
  const strengths = sharedStrengths(topics, hasPartner);
  const talk = talkTopics(topics);
  const open = (label: string) => onOpenHealthCheck
    ? <button type="button" className="retro-eval-open" onClick={onOpenHealthCheck}>{label} – zurück zum Health Check</button>
    : <span className="retro-eval-muted">{label}</span>;

  return (
    <section className="retro-summary retro-eval w-full" aria-label="Auswertung">
      <div className="retro-eval-head">
        <div><span className="retro-eval-big">{ins.average !== null ? fmt(ins.average) : '–'}</span><span className="retro-eval-who">{me}</span></div>
        {hasPartner && <div><span className="retro-eval-big is-partner">{ins.partnerAverage !== null ? fmt(ins.partnerAverage) : '–'}</span><span className="retro-eval-who">{who}</span></div>}
      </div>
      {ins.trend !== null && <p className={`retro-eval-trend ${ins.trend > 0 ? 'is-up' : ins.trend < 0 ? 'is-down' : ''}`}>{ins.trend === 0 ? '= gleich wie letzte Retro' : `${ins.trend > 0 ? '▲ +' : '▼ '}${fmt(ins.trend)} seit der letzten Retro`}</p>}
      {answered < 8 && <p className="retro-eval-note">{open(`Noch offen: ${8 - answered} von 8 Themen`)}</p>}

      <ul className="retro-eval-bars" aria-label="Themen">
        {topics.map(t => (
          <li key={t.id}>
            <span className="retro-eval-topic">{t.title}</span>
            <span className="retro-eval-pair">
              <span className="retro-eval-bar" style={{ width: `${((t.own ?? 0) / 5) * 100}%` }} aria-label={`${me}: ${t.own ?? 'offen'}`} />
              {hasPartner && <span className="retro-eval-bar is-partner" style={{ width: `${((t.partner ?? 0) / 5) * 100}%` }} aria-label={`${who}: ${t.partner ?? 'offen'}`} />}
            </span>
          </li>
        ))}
      </ul>

      <div className="retro-eval-box"><h4>Das läuft gut</h4>{strengths.length ? <p>{strengths.join(', ')}</p> : <p className="retro-eval-muted">Noch kein gemeinsames Highlight</p>}</div>
      <div className="retro-eval-box"><h4>Darüber reden</h4>{talk.length ? <ul>{talk.map(t => <li key={t.title}><strong>{t.title}:</strong> {t.question}</li>)}</ul> : <p className="retro-eval-muted">Keine offenen Baustellen</p>}</div>
      <div className="retro-eval-box"><h4>Bis zur nächsten Retro</h4>{ins.nextSteps.length ? <ul className="retro-eval-checks">{ins.nextSteps.map(n => <li key={n}>☐ {n}</li>)}</ul> : <p className="retro-eval-muted">Noch keine Ideen eingetragen</p>}</div>

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
