import { describe, expect, test } from "bun:test";
import { scaleValue, scaleExpression, scaleFaceBlend, scaleFaceGeometry, workloadShares, adjustWorkloadShares, workloadSegments, adjustWorkloadBoundary, RISIKO_STATEMENTS, risikoPages } from "./risiko-data";

describe("workload split", () => {
  test("represents an even default as adjoining widths filling 100%", () => {
    expect(workloadSegments(["a", "b"], workloadShares(["a", "b"], {}))).toEqual([
      { key: "a", start: 0, end: 50, width: 50 }, { key: "b", start: 50, end: 100, width: 50 },
    ]);
  });
  test("dragging a width boundary transfers work to its neighbour and clamps at 0 and 100", () => {
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, 70)).toEqual({ a: 70, b: 30 });
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, -20)).toEqual({ a: 0, b: 100 });
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, 120)).toEqual({ a: 100, b: 0 });
    expect(adjustWorkloadBoundary(["a", "b", "c"], { a: 34, b: 33, c: 33 }, 1, 80)).toEqual({ a: 34, b: 46, c: 20 });
  });
  test("starts equally and normalizes legacy values to exactly 100%", () => {
    expect(workloadShares(["a", "b"], {})).toEqual({ a: 50, b: 50 });
    expect(workloadShares(["a", "b", "c"], {})).toEqual({ a: 34, b: 33, c: 33 });
    expect(workloadShares(["a", "b"], { work_a: "80", work_b: "40" })).toEqual({ a: 67, b: 33 });
  });
  test("automatically moves the other partner to the remainder", () => {
    expect(adjustWorkloadShares(["a", "b"], { a: 50, b: 50 }, "a", 70)).toEqual({ a: 70, b: 30 });
    expect(adjustWorkloadShares(["a", "b"], { a: 70, b: 30 }, "b", 100)).toEqual({ a: 0, b: 100 });
  });
  test("preserves other partners' proportions, sharing equally when they are zero", () => {
    expect(adjustWorkloadShares(["a", "b", "c"], { a: 40, b: 40, c: 20 }, "a", 70)).toEqual({ a: 70, b: 20, c: 10 });
    expect(adjustWorkloadShares(["a", "b", "c"], { a: 100, b: 0, c: 0 }, "a", 50)).toEqual({ a: 50, b: 25, c: 25 });
  });
  test("every drag keeps integer bounded shares totaling 100%, also after save/read", () => {
    const keys = ["a", "b", "c", "d"];
    let shares = workloadShares(keys, {});
    for (const key of keys) for (let value = 0; value <= 100; value++) {
      shares = adjustWorkloadShares(keys, shares, key, value);
      expect(shares[key]).toBe(value);
      expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
      expect(Object.values(shares).every(share => Number.isInteger(share) && share >= 0 && share <= 100)).toBe(true);
      expect(workloadShares(keys, Object.fromEntries(Object.entries(shares).map(([k, v]) => [`work_${k}`, String(v)])))).toEqual(shares);
    }
    expect(adjustWorkloadShares(["a"], { a: 100 }, "a", 10)).toEqual({ a: 100 });
  });
});

describe("Risikofaktoren scale", () => {
  test("morphs through sad, neutral, smiling and open-mouth happy without angry eyebrows", () => {
    expect(scaleFaceGeometry(0).eyeY).toBe(9);
    expect(scaleFaceGeometry(0).mouth[7]).toBe(14);
    expect(scaleFaceGeometry(100 / 3).mouth[7]).toBe(15);
    expect(scaleFaceGeometry(200 / 3).mouth[7]).toBe(16);
    expect(scaleFaceGeometry(100).mouth[1]).toBe(13);
    expect(scaleFaceGeometry(100).mouth[19]).toBe(18);
    for (const value of [0, 100 / 6, 100 / 3, 50, 200 / 3, 250 / 3, 100]) {
      expect(scaleFaceGeometry(value).brow).toBe(0);
    }
    expect(scaleFaceGeometry(50).mouth[7]).toBe(15.5);
    expect(scaleFaceGeometry(250 / 3).mouth[19]).toBeCloseTo(17);
  });
  test("drag face matches the four evenly spaced smileys at their scale positions", () => {
    expect(scaleFaceBlend(0)).toEqual({ index: 0, mix: 0 });
    expect(scaleFaceBlend(100 / 3)).toEqual({ index: 1, mix: 0 });
    expect(scaleFaceBlend(200 / 3)).toEqual({ index: 2, mix: 0 });
    expect(scaleFaceBlend(100)).toEqual({ index: 2, mix: 1 });
    expect(scaleFaceBlend(50)).toEqual({ index: 1, mix: 0.5 });
    expect(scaleFaceBlend(100 / 6)).toEqual({ index: 0, mix: 0.5 });
  });
  test("expression follows drag position from sad to neutral to happy", () => {
    expect(scaleExpression(0)).toBe(-1);
    expect(scaleExpression(25)).toBe(-0.5);
    expect(scaleExpression(50)).toBe(0);
    expect(scaleExpression(75)).toBe(0.5);
    expect(scaleExpression(100)).toBe(1);
  });
  test("defaults to neutral", () => {
    expect(scaleValue()).toBe(50);
    expect(scaleValue("")).toBe(50);
  });
  test("stays within sad and happy", () => {
    expect(scaleValue("-5")).toBe(0);
    expect(scaleValue("120")).toBe(100);
  });
  test("has the six statements, being yourself first", () => {
    expect(RISIKO_STATEMENTS.length).toBe(6);
    expect(RISIKO_STATEMENTS[0]).toEqual(["self", "Ich kann mit dir ich selbst sein und fühle mich gesehen und respektiert"]);
    expect(RISIKO_STATEMENTS[1]).toEqual(["love", "Wir zeigen uns aktiv, dass wir uns lieben"]);
    expect(RISIKO_STATEMENTS[5]).toEqual(["quality", "Wir nehmen auch im Alltag Zeit für gemeinsame Erlebnisse und schaffen Nähe, bleiben neugierig auf das, was uns bewegt, und unterstützen einander dabei zu wachsen"]);
  });
  test("keeps two pages on large screens and adds one on phones", () => {
    const big = risikoPages(["p0", "p1"], 1800, 1280);
    expect(big.length).toBe(2);
    expect(big[0].statements.length).toBe(3);
    const small = risikoPages(["p0", "p1"], 844, 390);
    expect(small.length).toBe(3);
    // The long "hot" sentence needs its own phone page and shares it with the allocation block.
    expect(small[small.length - 1].statements.map(([key]) => key)).toEqual(["hot"]);
    expect(small[small.length - 1].personKeys).toEqual(["p0", "p1"]);
    expect(small.flatMap(p => p.statements.map(([key]) => key))).toEqual([...RISIKO_STATEMENTS.map(([key]) => key), "hot"]);
  });
  test("adds pages on short screens without losing or repeating questions", () => {
    const pages = risikoPages(["p0", "p1"], 600, 320);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.flatMap(p => p.statements.map(([key]) => key))).toEqual([...RISIKO_STATEMENTS.map(([key]) => key), "hot"]);
    expect(pages.flatMap(p => p.personKeys)).toEqual(["p0", "p1"]);
  });
  test("keeps every partner's memoji on one shared allocation line", () => {
    for (const [height, width] of [[1800, 1280], [844, 390], [600, 320]]) {
      const pages = risikoPages(["p0", "p1"], height, width);
      const withPartners = pages.filter(p => p.personKeys.length);
      expect(withPartners.length).toBe(1);
      expect(withPartners[0].personKeys).toEqual(["p0", "p1"]);
    }
  });
  test("adds pages for additional partners", () => {
    const keys = Array.from({length: 12}, (_, i) => `p${i}`);
    const pages = risikoPages(keys, 844, 390);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.flatMap(p => p.personKeys)).toEqual(keys);
  });
});
