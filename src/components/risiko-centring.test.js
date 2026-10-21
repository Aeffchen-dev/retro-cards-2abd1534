import { describe, expect, test } from "bun:test";
import { centreShift } from "./risiko-centring";

// The card's free room runs from the text above (its bottom edge) to the button
// row below (its top edge). The scale's block has to stand in the middle of that
// room, so the same breath reads above and below it.
const room = { cardTop: 0, cardHeight: 600, ruleTop: 0, ruleHeight: 56 };

describe("Health Check vertical gaps", () => {
  test("splits the free room between the scale's block evenly", () => {
    // Room 100 → 300, a 60px block standing at 200: it has to climb 30px.
    const shift = centreShift({ ...room, aboveBottom: 100, footTop: 300, blockTop: 200, blockHeight: 60 });
    expect(shift).toBe(-30);
    // ...and the two breaths then read the same.
    expect(200 + shift - 100).toBe(300 - (200 + shift + 60));
  });

  test("pulls a block that stands too low back to the middle of the room", () => {
    const shift = centreShift({ ...room, aboveBottom: 100, footTop: 500, blockTop: 400, blockHeight: 60 });
    expect(shift).toBe(-130);
    expect(400 + shift - 100).toBe(500 - (400 + shift + 60));
  });

  test("never pushes the block into the buttons below", () => {
    // The room is 100 → 300 and the block already touches the button row: it may
    // close the last pixels upward, but it must not travel down into them.
    const shift = centreShift({ ...room, aboveBottom: 100, footTop: 300, blockTop: 100, blockHeight: 195 });
    expect(shift).toBeLessThanOrEqual(0);
    expect(100 + shift + 195).toBeLessThanOrEqual(300);
  });

  test("never pushes the block over the text above", () => {
    const shift = centreShift({ ...room, aboveBottom: 200, footTop: 500, blockTop: 205, blockHeight: 60 });
    expect(205 + shift).toBeGreaterThanOrEqual(200 + 8);
  });

  test("leaves a card with no button row aimed at the card's own middle", () => {
    // The Intimacy scale: no footer, so nothing moves it out of the column it sits in.
    const shift = centreShift({ cardTop: 0, cardHeight: 600, ruleTop: 200, ruleHeight: 56,
      aboveBottom: 100, blockTop: 200, blockHeight: 176 });
    expect(shift).toBe(0);
  });
});
