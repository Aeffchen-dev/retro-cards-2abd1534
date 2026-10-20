import { describe, expect, test } from "bun:test";
import { scaleValue, RISIKO_STATEMENTS, risikoPages } from "./risiko-data";

describe("Risikofaktoren scale", () => {
  test("defaults to neutral", () => {
    expect(scaleValue()).toBe(50);
    expect(scaleValue("")).toBe(50);
  });
  test("stays within sad and happy", () => {
    expect(scaleValue("-5")).toBe(0);
    expect(scaleValue("120")).toBe(100);
  });
  test("has the five statements", () => {
    expect(RISIKO_STATEMENTS.length).toBe(5);
  });
  test("splits into two pages when space allows", () => {
    const pages = risikoPages(["p0", "p1"], 844, 390);
    expect(pages.length).toBe(2);
    expect(pages[0].statements.length).toBe(3);
    expect(pages[1].personKeys).toEqual(["p0", "p1"]);
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
