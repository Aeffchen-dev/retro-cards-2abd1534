// Where the scale's own block — rule, column names and the note riding under it —
// has to be nudged so the card reads evenly. The free room between the last line
// of text above and the row of buttons below is cut in half, so the block keeps
// the same breath above and below; it is never moved further than that room, so a
// crowded card stops short instead of covering the text or the buttons. A card
// with no button row (the Intimacy scale, which sits between its own fields) has
// no such room, so there the rule still aims at the card's own middle.

export type CentreInput = {
  /** The card's own box on screen. */
  cardTop: number;
  cardHeight: number;
  /** The drawn rule inside the scale, used only when the card has no button row. */
  ruleTop: number;
  ruleHeight: number;
  /** Bottom edge of the last line of text standing above the scale. */
  aboveBottom: number;
  /** Top edge of the button row below the scale; absent when the card has none. */
  footTop?: number;
  /** The scale's own block: its top edge and its full height. */
  blockTop: number;
  blockHeight: number;
  /** Least breath the block keeps to the text above and the buttons below. */
  breathing?: number;
};

export function centreShift({
  cardTop, cardHeight, ruleTop, ruleHeight, aboveBottom, footTop,
  blockTop, blockHeight, breathing = 8,
}: CentreInput): number {
  const need = footTop === undefined
    ? cardTop + cardHeight / 2 - (ruleTop + ruleHeight / 2)
    : (aboveBottom + footTop) / 2 - (blockTop + blockHeight / 2);
  const slackUp = blockTop - aboveBottom - breathing;
  const slackDown = footTop === undefined ? 0 : footTop - (blockTop + blockHeight) - breathing;
  return Math.min(Math.max(need, -slackUp), slackDown);
}
