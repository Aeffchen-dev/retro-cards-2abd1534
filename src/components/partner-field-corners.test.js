import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const tsx = readFileSync(new URL("./PostItField.tsx", import.meta.url), "utf8");

describe("partner answer field corners", () => {
  test("marks the read-only answer field", () => {
    const field = tsx.slice(tsx.indexOf("{readOnly ? ("));
    expect(field, "the partner's answer field carries its own class").toMatch(
      /className="post-it-readonly[^"]*bg-retro-post-it/,
    );
  });

  test("keeps the partner's field square like your own writing area", () => {
    const at = css.indexOf(".post-it-readonly,\n.post-it-readonly:hover {");
    expect(at, "the read-only rule covers both its plain and hovered state").toBeGreaterThan(-1);
    expect(css.slice(at, css.indexOf("}", at))).toMatch(/border-radius: 0/);
  });

  test("wins over the rounded post-it hover state", () => {
    const rounded = css.indexOf(".bg-retro-post-it:hover");
    const square = css.indexOf(".post-it-readonly:hover");
    expect(rounded, "the deck still rounds ordinary post-its").toBeGreaterThan(-1);
    expect(square, "the read-only rule must come after the rounding rule").toBeGreaterThan(rounded);
  });
});
