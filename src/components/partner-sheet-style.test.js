import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./health-check.css", import.meta.url), "utf8");
const tsx = readFileSync(new URL("./PartnerConnection.tsx", import.meta.url), "utf8");

/** The rule block for one selector, up to the next closing brace. */
const block = (selector) => {
  const at = css.indexOf(selector + " {");
  expect(at, `rule for ${selector}`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
};

describe("connection bottom sheet look", () => {
  test("keeps the sheet panel square and white", () => {
    const panel = block(".partner-sheet-panel");
    expect(panel, "no rounded corner on the panel").toMatch(/border-radius: 0/);
    expect(panel).toMatch(/background: #FFFFFF/);
  });

  test("leaves no panel behind the category row", () => {
    const sheet = block(".partner-bottom-sheet.partner-dialog");
    expect(sheet, "the wrapper itself must stay transparent").toMatch(/background: transparent/);
    expect(sheet).toMatch(/padding: 0/);
  });

  test("hangs the category pill above the sheet panel", () => {
    expect(tsx, "the category wears the deck's own pill").toMatch(/className="retro-pill"/);
    const pillAt = tsx.indexOf("partner-sheet-pill-row");
    const panelAt = tsx.indexOf("partner-sheet-panel");
    expect(pillAt).toBeGreaterThan(-1);
    expect(panelAt).toBeGreaterThan(-1);
    expect(pillAt, "the pill row stands above the panel").toBeLessThan(panelAt);
  });

  test("draws every action button with a black icon tile", () => {
    expect(block(".partner-bottom-sheet.partner-dialog")).toMatch(
      /--retro-action-tile: var\(--retro-black\)/,
    );
  });

  test("lets the question read as a question inside the panel", () => {
    const title = block(".partner-bottom-sheet .partner-sheet-title");
    expect(title, "the question carries no box of its own").not.toMatch(/border:/);
    expect(title).toMatch(/font-family: var\(--font-question\)/);
    expect(title).toMatch(/font-size: 24px/);
  });

  test("keeps its close control as an outlined square on the pill's line", () => {
    const close = block(".partner-bottom-sheet > button:last-child");
    expect(close).toMatch(/width: 32px/);
    expect(close).toMatch(/height: 32px/);
    expect(close).toMatch(/border: 1px solid var\(--color-text-primary\)/);
    expect(close).toMatch(/border-radius: 0/);
    expect(close, "the square rides on the pill's own line").toMatch(/top: 0/);
    expect(close, "it wears a white plate so the ink reads on the dark backdrop").toMatch(/background: #FFFFFF/);
    expect(close).toMatch(/right: 0/);
    expect(block(".partner-bottom-sheet > button:last-child > svg")).toMatch(/width: 16px/);
  });
});
