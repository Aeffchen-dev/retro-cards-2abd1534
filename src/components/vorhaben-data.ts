/**
 * The "Ideas" card (internally still Vorhaben) asks three things, each a post-it field:
 * what the couple wants to do next month, what they could try out, and what one of them
 * wishes for. The next-months plans prompt came over from Feedback with its "plans"
 * answer key; "Letzte Chance" swapped places with it and now sits on Feedback with its
 * "unspoken" key.
 */
export const VORHABEN_QUESTIONS = [
  ["plans", "Das wollen wir kommenden Monat machen"],
  ["experiment", "Das könnten wir (neues) ausprobieren"],
  ["idea", "Das wünsche ich mir"],
] as const;
