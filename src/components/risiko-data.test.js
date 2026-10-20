import { describe, expect, test } from "bun:test";
import { scaleValue, RISIKO_STATEMENTS } from "./risiko-data";

describe("Risikofaktoren scale", () => {
  test("defaults to neutral", () => {
    expect(scaleValue()).toBe(50);
    expect(scaleValue("")).toBe(50);
  });
  test("stays within sad and happy", () => {
    expect(scaleValue("-5")).toBe(0);
    expect(scaleValue("120")).toBe(100);
  });
  test("has the six statements", () => {
    expect(RISIKO_STATEMENTS.length).toBe(6);
  });
});
