import { describe, expect, test } from "bun:test";
import { scaleValue, scaleExpression, scaleFaceBlend, RISIKO_STATEMENTS, risikoPages } from "./risiko-data";

describe("Risikofaktoren scale", () => {
  test("drag face matches the five smileys at their scale positions", () => {
    expect(scaleFaceBlend(0)).toEqual({ index: 0, mix: 0 });
    expect(scaleFaceBlend(25)).toEqual({ index: 1, mix: 0 });
    expect(scaleFaceBlend(50)).toEqual({ index: 2, mix: 0 });
    expect(scaleFaceBlend(75)).toEqual({ index: 3, mix: 0 });
    expect(scaleFaceBlend(100)).toEqual({ index: 3, mix: 1 });
    expect(scaleFaceBlend(12.5)).toEqual({ index: 0, mix: 0.5 });
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
  test("has the six statements, love first", () => {
    expect(RISIKO_STATEMENTS.length).toBe(6);
    expect(RISIKO_STATEMENTS[0]).toEqual(["love", "Wir zeigen uns aktiv, dass wir uns lieben"]);
  });
  test("keeps two pages on large screens and adds one on phones", () => {
    const big = risikoPages(["p0", "p1"], 1800, 1280);
    expect(big.length).toBe(2);
    expect(big[0].statements.length).toBe(3);
    const small = risikoPages(["p0", "p1"], 844, 390);
    expect(small.length).toBe(3);
    expect(small[small.length - 1].statements).toEqual([]);
    expect(small[small.length - 1].personKeys).toEqual(["p1"]);
    expect(small.flatMap(p => p.statements.map(([key]) => key))).toEqual([...RISIKO_STATEMENTS.map(([key]) => key), "hot"]);
  });
  test("adds pages on short screens without losing or repeating questions", () => {
    const pages = risikoPages(["p0", "p1"], 600, 320);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.flatMap(p => p.statements.map(([key]) => key))).toEqual([...RISIKO_STATEMENTS.map(([key]) => key), "hot"]);
    expect(pages.flatMap(p => p.personKeys)).toEqual(["p0", "p1"]);
  });
  test("adds pages for additional partners", () => {
    const keys = Array.from({length: 12}, (_, i) => `p${i}`);
    const pages = risikoPages(keys, 844, 390);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.flatMap(p => p.personKeys)).toEqual(keys);
  });
});
