import { test, expect } from "bun:test";
import { retroSummary } from "./retro-summary";

test("strengths are answers at 75 or above, focus at 25 or below", () => {
  const s = retroSummary({ love: "100", metime: "0", quality: "50" }, ["p0", "p1"]);
  expect(s.strengths).toEqual(["Liebe zeigen"]);
  expect(s.focus).toEqual(["Me-Time"]);
  expect(s.mood).toBeNull();
  expect(s.answered).toBe(3);
});

test("workload only shows once dragged and sums to 100", () => {
  expect(retroSummary({}, ["p0", "p1"]).workload).toBeNull();
  const w = retroSummary({ work_p0: "70", work_p1: "30" }, ["p0", "p1"]).workload;
  expect(w.reduce((a, b) => a + b.share, 0)).toBe(100);
});
