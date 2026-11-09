export const HEALTH_CATEGORIES = [
  { id: 'love', title: 'Liebe & Wertschätzung', axis: 'Liebe', text: 'Wir fühlen uns geliebt, gesehen und wertgeschätzt.' },
  { id: 'communication', title: 'Kommunikation', axis: 'Kommunikation', text: 'Wir können offen und ehrlich über alles sprechen.' },
  { id: 'trust', title: 'Vertrauen & Sicherheit', axis: 'Vertrauen', text: 'Wir fühlen uns sicher und können uns aufeinander verlassen.' },
  { id: 'intimacy', title: 'Nähe & Intimität', axis: 'Intimität', text: 'Unsere körperliche und emotionale Nähe erfüllt uns.' },
  { id: 'time', title: 'Quality Time', axis: 'Quality Time', text: 'Wir verbringen bewusst schöne Zeit miteinander.' },
  { id: 'freedom', title: 'Freiheit & Individualität', axis: 'Freiheit', text: 'Wir können wir selbst bleiben und uns frei entfalten.' },
  { id: 'fairness', title: 'Fairness & Beziehungsarbeit', axis: 'Fairness', text: 'Wir tragen beide zu unserer Beziehung bei.' },
  { id: 'fun', title: 'Spaß & Leichtigkeit', axis: 'Spaß', text: 'Wir lachen, erleben Neues und haben Spaß zusammen.' },
] as const;

export function healthScore(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export function healthResults(values: Record<string, string>, person: string) {
  return HEALTH_CATEGORIES.map(c => healthScore(values[`hc_${person}_${c.id}`]));
}