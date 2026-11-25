import { describe, expect, test } from "bun:test";
import { intimacyScale, intimacyStars } from "./intimacy-rating";

describe("Intimacy star answers", () => {
  test("an unanswered rating does not select a star", () => {
    expect(intimacyStars()).toBe(0);
    expect(intimacyStars("")).toBe(0);
  });
  test("existing answers retain their relative rating", () => {
    expect(intimacyStars("0")).toBe(1);
    expect(intimacyStars("50")).toBe(3);
    expect(intimacyStars("100")).toBe(5);
  });
  test("each star selection survives the existing answer store", () => {
    for (let star = 1; star <= 5; star++) {
      expect(intimacyStars(intimacyScale(star))).toBe(star);
    }
  });
  test("half hearts round trip through saved answers", () => {
    for (const hearts of [0.5, 1.5, 2.5, 3.5, 4.5]) {
      expect(intimacyStars(intimacyScale(hearts))).toBe(hearts);
    }
    expect(intimacyScale(2.5)).toBe("37.5");
    expect(intimacyScale(0.5)).toBe("-12.5");
  });
});
