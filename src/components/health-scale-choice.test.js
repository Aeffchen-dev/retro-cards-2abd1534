// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const ratings = readFileSync(resolve(root, "src/components/HealthCheckRatings.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/health-check.css"), "utf8");

describe("Health Check scale captions", () => {
  test("the chosen answer is not spelled out between the end labels", () => {
    expect(ratings).not.toContain("health-scale-choice");
    expect(css).not.toContain("health-scale-choice");
  });

  test("both end labels still stand at the ends", () => {
    expect(ratings).toContain("<span>Trifft noch nicht zu</span><span>Trifft immer zu</span>");
  });
});
