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
});
