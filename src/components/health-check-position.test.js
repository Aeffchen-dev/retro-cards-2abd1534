import { describe, expect, test } from "bun:test";
import { besideSmiley, hasHealthCheckAnswer, nearestMemoji, partnerLabelSide, shouldShowPartnerMemoji } from "./health-check-position";

describe("Health Check smiley click", () => {
  test("places a Memoji exactly 16px right of the smiley", () => {
    const position = besideSmiley({ x: 100, y: 200, width: 34, height: 34 }, { x: 100, y: 180, width: 300, height: 250 });
    expect(position.x).toBe(34 + 16);
  });
  test("vertically centers the Memoji on every smiley, including both ends", () => {
    for (const y of [180, 234, 288, 342, 396]) {
      const position = besideSmiley({ x: 100, y, width: 34, height: 34 }, { x: 100, y: 180, width: 300, height: 250 });
      expect(180 + position.y + 56 / 2).toBe(y + 34 / 2);
    }
  });
  test("keeps the Memoji within the container horizontally", () => {
    expect(besideSmiley({ x: 270, y: 200, width: 34, height: 34 }, { x: 100, y: 180, width: 220, height: 250 }).x).toBe(164);
  });
  test("uses the closest partner when none has been selected", () => {
    expect(nearestMemoji({ p0: { x: 220, y: 20 }, p1: { x: 220, y: 200 } }, { x: 50, y: 180 })).toBe("p1");
  });
  test("does not mistake the untouched resting emoji for an answer", () => {
    expect(hasHealthCheckAnswer({ x: 248, y: 64 })).toBe(false);
    expect(hasHealthCheckAnswer({ x: 248, y: 64, answered: true })).toBe(true);
  });
  test("keeps answers saved by an older version visible", () => {
    expect(hasHealthCheckAnswer({ x: 180, y: 90 })).toBe(true);
    expect(hasHealthCheckAnswer({ x: 248, y: 64, faceIndex: 2 })).toBe(true);
  });
  test("shows the partner only after both people have answered", () => {
    const own = { x: 60, y: 64, answered: true };
    const partner = { x: 60, y: 136, answered: true };
    expect(shouldShowPartnerMemoji(undefined, partner)).toBe(false);
    expect(shouldShowPartnerMemoji(own, undefined)).toBe(false);
    expect(shouldShowPartnerMemoji(own, partner)).toBe(true);
  });
  test("puts the partner name under their emoji", () => {
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 60, y: 136 })).toBe("below");
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 60, y: 85 })).toBe("below");
  });
  test("flips the name above when your emoji sits in the row directly below", () => {
    // Smileys stand 51px apart while the markers are 56px tall, so a name
    // underneath would land on the head of the emoji in the next row.
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 60, y: 187 })).toBe("above");
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 90, y: 187 })).toBe("above");
  });
  test("keeps the name below when your emoji is further down or beside the row", () => {
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 60, y: 238 })).toBe("below");
    expect(partnerLabelSide({ x: 60, y: 136 }, { x: 200, y: 187 })).toBe("below");
  });
  test("reads below while either answer is missing", () => {
    expect(partnerLabelSide(undefined, { x: 60, y: 187 })).toBe("below");
    expect(partnerLabelSide({ x: 60, y: 136 }, undefined)).toBe("below");
  });
});