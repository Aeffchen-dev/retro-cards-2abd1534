// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const history = readFileSync(resolve(root, "src/components/HealthCheckHistory.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/health-check.css"), "utf8");

/**
 * The Auswertung date strip (user: "auswertung pills / color only behind dot
 * rest of pill grey / only active grey has color and dot left"): every pill is
 * the deck's grey rectangle, its dot sits at the left, and only the selected
 * retro paints — the category colour appears only on the small plate behind
 * that dot, never as the pill's fill.
 */
describe("Auswertung retro links", () => {
  const GREY_FIELD = "#E4E6E8";   // --retro-textarea-bg, the pill's plate
  const DOT_OFF = "#6E7078";      // an unselected pill's plain grey dot

  const lum = (hex) => {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  test("every pill is the deck's grey rectangle, for the selected one too", () => {
    const chip = css.match(/#root \.health-ratings \.health-date-chip \{[^}]*\}/);
    expect(chip).toBeTruthy();
    expect(chip[0]).toContain("background: var(--retro-textarea-bg)");
    // no call site paints the pill itself any more — the fill is gone
    expect(history).not.toContain("chipStyle");
    expect(history).not.toMatch(/health-date-chip[^>]*style=/);
  });

  test("the dot rides at the pill's left edge", () => {
    expect(history).toMatch(/\{dot\(!chosen\)\}Heute/);
    expect(history).toMatch(/\{dot\(on\)\}\{new Date\(entry\.recorded_at\)/);
  });

  test("only the selected pill paints, and only behind the dot", () => {
    expect(history).toMatch(
      /className=\{`health-date-plate\$\{on \? ' is-on' : ''\}\`\}\s*style=\{on \? \{ background: categoryColor \} : undefined\}/,
    );
    expect(history).toMatch(/background: on \? categoryAccent : HEALTH_DOT_OFF/);
    const plate = css.match(/\.health-date-plate \{[^}]*\}/);
    expect(plate, "the plate behind the dot has no size of its own").toBeTruthy();
    expect(plate[0]).toContain("display: grid");
    expect(css).toMatch(/\.health-date-dot \{[^}]*border-radius: 50%/);
  });

  test("an unselected dot still stands out on the grey pill", () => {
    expect(
      ratio(DOT_OFF, GREY_FIELD),
      "the plain grey dot is invisible on the grey pill",
    ).toBeGreaterThanOrEqual(3);
  });
});
