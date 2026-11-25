// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const cards = readFileSync(resolve(root, "src/components/RetroCards.tsx"), "utf8");

describe("shared-session textarea placeholders", () => {
  test("no field tells you the partner is still writing", () => {
    expect(cards).not.toContain("schreibt noch");
  });

  test("a partner's empty field stays blank instead of naming them", () => {
    const blank = cards.match(/placeholder=\{livePerson\(idx\) \? "" : "Deine Antwort"\}/g) ?? [];
    expect(blank.length).toBeGreaterThanOrEqual(4);
  });

  test("your own empty field still asks for your answer", () => {
    const own = cards.match(/: "Deine Antwort"\}/g) ?? [];
    expect(own.length).toBeGreaterThanOrEqual(4);
  });
});
