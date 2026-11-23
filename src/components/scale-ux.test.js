import { test, expect } from "bun:test";
import { scaleColumn, scaleStep } from "./risiko-data";
test("column follows the snap", () => { expect(scaleColumn(0)).toBe(0); expect(scaleColumn(62)).toBe(2); expect(scaleColumn(63)).toBe(3); expect(scaleColumn(100)).toBe(4); });
test("arrow keys jump one whole column", () => { expect(scaleStep(50, 1)).toBe(75); expect(scaleStep(60, -1)).toBe(25); expect(scaleStep(100, 1)).toBe(100); expect(scaleStep(0, -1)).toBe(0); });
test("Home and End reach the ends", () => { expect(scaleStep(50, "start")).toBe(0); expect(scaleStep(50, "end")).toBe(100); });
