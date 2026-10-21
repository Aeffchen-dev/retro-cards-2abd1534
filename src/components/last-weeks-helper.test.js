import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
const card = src.slice(src.indexOf("case 3:"), src.indexOf("case 4:"));
const cardClass = src.slice(src.indexOf("retro-card-container relative w-full"), src.indexOf("shadow-2xl"));

describe("last 4 weeks helper sentence", () => {
  test("sits under the headline with the exact wording", () => {
    expect(card).toContain("Klicke auf eine Frage um deine Notizen einzublenden");
    expect(card).toMatch(/icon="IconInfo"[\s\S]*?einzublenden/);
    // The info box rides straight under the big question, above every question row.
    const head = card.indexOf("Was war die letzten 4 Wochen so los?");
    const helper = card.indexOf("einzublenden");
    const firstRow = card.indexOf("Ein voller Erfolg");
    expect(head).toBeGreaterThan(-1);
    expect(helper).toBeGreaterThan(head);
    expect(helper).toBeLessThan(firstRow);
  });

  test("keeps one card padding of gap towards the headline", () => {
    const padding = cardClass.match(/p-\[(\d+)px\]/)?.[1];
    const gap = card.match(/marginTop: '(\d+)px'/)?.[1];
    expect(padding).toBe("28");
    expect(gap).toBe(padding);
  });

  test("wraps instead of truncating and stays off the printed page", () => {
    expect(card).toMatch(/className="hc-helper retro-body-copy"/);
    expect(card).not.toMatch(/einzublenden[\s\S]*?onClick/);
  });
});
