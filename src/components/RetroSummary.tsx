import { retroSummary, healthInsights } from "./retro-summary";
import { pastHealthHistory, readLocalHealthHistory } from "./health-history-data";
import { HEALTH_CATEGORIES, healthResults } from './health-check-data';

interface Props {
  values: Record<string, string>;
  persons: { key: string; name: string }[];
  intimacy?: string;
  partnerValues?: Record<string, string>;
  partnerName?: string;
  ideas?: Record<string, string>;
}

/** A compact "at a glance" box of the Health Check answers on the Takeaways card. */
export default function RetroSummary({ values, persons, intimacy, partnerValues, partnerName, ideas }: Props) {
  const s = retroSummary(values, persons.map((p) => p.key), intimacy);
  const ratings = healthResults(values, 'p0');
  const answered = ratings.filter((v): v is number => v !== null);
  const strengths = HEALTH_CATEGORIES.filter((_, i) => (ratings[i] ?? 0) >= 4).map(c => c.axis);
  const focus = HEALTH_CATEGORIES.filter((_, i) => ratings[i] !== null && (ratings[i] ?? 5) <= 2).map(c => c.axis);
  const partner = partnerValues ? healthResults(partnerValues, 'p0') : HEALTH_CATEGORIES.map(() => null);
  const past = pastHealthHistory(readLocalHealthHistory());
  const previous = past.length ? past[past.length - 1].results.people[0]?.scores ?? null : null;
  const ins = healthInsights(ratings, partner, HEALTH_CATEGORIES.map(c => c.axis), previous, ideas);
  const who = partnerName || 'Partner';
  const rows: [string, string][] = [
    ["Health Check", answered.length === 8 ? `Im Schnitt: ${(answered.reduce((a,b) => a+b,0)/8).toFixed(1)}/5` : `${answered.length} von 8 Themen beantwortet`],
    ...(ins.partnerAverage !== null ? [[who, `Im Schnitt: ${ins.partnerAverage.toFixed(1)}/5`] as [string, string]] : []),
    ...(ins.trend !== null ? [["Trend", ins.trend === 0 ? "Gleich wie letztes Mal" : `${ins.trend > 0 ? "▲ +" : "▼ "}${ins.trend.toFixed(1)} seit der letzten Retro`] as [string, string]] : []),
    ...(ins.gaps.length ? [["Unterschiedlich gesehen", ins.gaps.map(g => `${g.title} (${g.own} vs. ${g.partner})`).join(", ")] as [string, string]] : []),
    ["Stärken", strengths.join(", ") || "–"],
    ["Darüber reden", focus.join(", ") || "–"],
    ["Fairness", ratings[6] !== null ? `${ratings[6]}/5` : '–'],
    ...(ins.nextSteps.length ? [["Nächste Schritte", ins.nextSteps.join(" · ")] as [string, string]] : []),
    ["Intimität", s.intimacy ? `${"★".repeat(s.intimacy)}${"☆".repeat(5 - s.intimacy)}` : "–"],
  ];
  return (
    <section className="retro-summary w-full" aria-label="Zusammenfassung">
      <h3 className="retro-summary-title">Auf einen Blick</h3>
      <dl className="retro-summary-list">
        {rows.map(([k, v]) => (
          <div key={k} className="retro-summary-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {ins.gaps[0] ? <p className="retro-summary-prompt">Gesprächsimpuls: Wie erlebt ihr „{ins.gaps[0].title}" gerade jeweils – und was würde es für euch beide besser machen?</p> : null}
    </section>
  );
}
