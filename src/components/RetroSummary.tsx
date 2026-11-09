import { retroSummary } from "./retro-summary";
import { HEALTH_CATEGORIES, healthResults } from './health-check-data';

interface Props {
  values: Record<string, string>;
  persons: { key: string; name: string }[];
  intimacy?: string;
}

/** A compact "at a glance" box of the Health Check answers on the Takeaways card. */
export default function RetroSummary({ values, persons, intimacy }: Props) {
  const s = retroSummary(values, persons.map((p) => p.key), intimacy);
  const ratings = healthResults(values, 'p0');
  const answered = ratings.filter((v): v is number => v !== null);
  const strengths = HEALTH_CATEGORIES.filter((_, i) => (ratings[i] ?? 0) >= 4).map(c => c.axis);
  const focus = HEALTH_CATEGORIES.filter((_, i) => ratings[i] !== null && (ratings[i] ?? 5) <= 2).map(c => c.axis);
  const rows: [string, string][] = [
    ["Health Check", answered.length === 8 ? `Im Schnitt: ${(answered.reduce((a,b) => a+b,0)/8).toFixed(1)}/5` : `${answered.length} von 8 Themen beantwortet`],
    ["Stärken", strengths.join(", ") || "–"],
    ["Darüber reden", focus.join(", ") || "–"],
    ["Fairness", ratings[6] !== null ? `${ratings[6]}/5` : '–'],
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
    </section>
  );
}
