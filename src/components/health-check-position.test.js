import { describe, expect, test } from "bun:test";
import { besideSmiley, nearestMemoji } from "./health-check-position";

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
});