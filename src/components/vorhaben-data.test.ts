import { describe, expect, test } from "bun:test";
import { allocationValue } from "./vorhaben-data";

describe("relationship-work allocation", () => {
  test("starts in the middle between both emojis", () => {
    expect(allocationValue()).toBe(50);
  });
  test("can move all the way left", () => {
    expect(allocationValue("0")).toBe(0);
    expect(allocationValue("-10")).toBe(0);
  });
  test("can move all the way right", () => {
    expect(allocationValue("100")).toBe(100);
    expect(allocationValue("110")).toBe(100);
  });
});