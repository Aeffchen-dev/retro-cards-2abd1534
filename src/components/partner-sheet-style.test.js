import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./health-check.css", import.meta.url), "utf8");

/** The rule block for one selector, up to the next closing brace. */
const block = (selector: string) => {
  const at = css.indexOf(selector + " {");
  expect(at, `rule for ${selector}`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
};

describe("connection bottom sheet look", () => {
  test("sits on the sheet with square corners", () => {
    const sheet = block(".partner-bottom-sheet");
    expect(sheet, "no rounded corner on the sheet").toMatch(/border-radius: 0/);
    expect(sheet).not.toMatch(/border-radius: 8px/);
  });

  test("draws every action button with a black icon tile", () => {
    expect(block(".partner-bottom-sheet")).toMatch(
      /--retro-action-tile: var\(--retro-black\)/,
    );
  });

  test("names itself in an outlined bar like a card category", () => {
    const title = block(".partner-bottom-sheet .partner-sheet-title");
    expect(title).toMatch(/border: 1px solid var\(--color-text-primary\)/);
    expect(title).toMatch(/font-family: var\(--font-app\)/);
    expect(title).toMatch(/font-size: 16px/);
    expect(title).toMatch(/padding: 4px 12px/);
  });

  test("keeps its close control as an outlined square top right", () => {
    const close = block(".partner-bottom-sheet > button:last-child");
    expect(close).toMatch(/width: 32px/);
    expect(close).toMatch(/height: 32px/);
    expect(close).toMatch(/border: 1px solid var\(--color-text-primary\)/);
    expect(close).toMatch(/border-radius: 0/);
    expect(block(".partner-bottom-sheet > button:last-child > svg")).toMatch(/width: 16px/);
  });
});
