/**
 * The "Ideas" card (internally still Vorhaben) asks three things, each a post-it field:
 * whether something stayed unsaid, what the couple could try out, and what one of them
 * wishes for. The first one used to sit on the Feedback card and moved here with its
 * "unspoken" answer key; "Das wollen wir kommenden Monat machen" swapped places with it
 * and now sits on Feedback with its "plans" key.
 */
export const VORHABEN_QUESTIONS = [
  ["unspoken", "Gab es etwas, dass du gedacht aber nicht angesprochen hast?"],
  ["experiment", "Das könnten wir (neues) ausprobieren"],
  ["idea", "Das wünsche ich mir"],
] as const;
