/**
 * The "Vorhaben" card asks three things, each a post-it field: what the couple wants
 * to do next month, what they could try out, and what one of them wishes for. The last
 * one used to sit on the Feedback card and moved here with its "idea" answer key.
 */
export const VORHABEN_QUESTIONS = [
  ["plans", "Das wollen wir kommenden Monat machen"],
  ["experiment", "Das könnten wir (neues) ausprobieren"],
  ["idea", "Das wünsche ich mir"],
] as const;
