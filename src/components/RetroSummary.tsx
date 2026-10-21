import { retroSummary } from "./retro-summary";

interface Props {
  values: Record<string, string>;
  persons: { key: string; name: string }[];
  intimacy?: string;
}

/** A compact "at a glance" box of the Health Check answers on the Takeaways card. */
export default function RetroSummary({ values, persons, intimacy }: Props) {
  const s = retroSummary(values, persons.map((p) => p.key), intimacy);
  const rows: [string, string][] = [
    ["Beziehungsgefühl", s.mood ? `Im Schnitt: ${s.mood}` : `${s.answered} von 8 Aussagen beantwortet`],
    ["Stärken", s.strengths.join(", ") || "–"],
    ["Darüber reden", s.focus.join(", ") || "–"],
    ["Beziehungsarbeit", s.workload ? s.workload.map((w) => `${persons.find((p) => p.key === w.key)?.name}: ${w.share}%`).join(" · ") : "–"],
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
