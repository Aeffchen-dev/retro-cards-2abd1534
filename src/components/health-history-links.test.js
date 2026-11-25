// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const history = readFileSync(resolve(root, "src/components/HealthCheckHistory.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/health-check.css"), "utf8");

describe("Auswertung retro links", () => {
  test("every retro link is a grey rectangle with its own dot", () => {
    expect(history).toContain("health-date-dot");
    expect(history).not.toContain("health-date-marker");
    const chip = css.match(/#root \.health-ratings \.health-date-chip \{[^}]*\}/);
    expect(chip).toBeTruthy();
    expect(chip[0]).toContain("background: var(--retro-textarea-bg)");
    expect(css).toMatch(/\.health-date-dot \{[^}]*border-radius: 50%/);
  });

  test("the selected retro keeps its coloured fill, with the dot in the contrast colour", () => {
    expect(history).toMatch(/const chipStyle = \(on: boolean\) => on \? \{ background: categoryColor, color: categoryAccent \}/);
    expect(history).toMatch(/style=\{chipStyle\(!chosen\)\}/);
    expect(history).toMatch(/style=\{chipStyle\(on\)\}/);
    expect(history).toMatch(/background: on \? categoryAccent : categoryColor/);
  });
});
