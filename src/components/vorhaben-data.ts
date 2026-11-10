/**
 * The "Ideas" card (internally still Vorhaben) asks three things, each a post-it field:
 * what the couple wants to do next month, what they could try out, and what one of them
 * wishes for. The next-months plans prompt came over from Feedback with its "plans"
 * answer key; "Ungesagt" (once "Letzte Chance") swapped places with it and now sits on Feedback with its
 * "unspoken" key.
 */
export const VORHABEN_QUESTIONS = [
  ["plans", "Plan", "Das wollen wir im kommenden Monat machen"],
  ["experiment", "Try", "Das könnten wir (neues) ausprobieren"],
  ["idea", "Change", "Das könnten wir anders machen"],
] as const;
