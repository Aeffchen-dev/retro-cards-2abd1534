import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");

describe("Setup card keeps its old measures", () => {
  test("the Setup card stands at its old height while every other card fills the slide", () => {
    const at = src.indexOf("retro-card-container relative w-full");
    expect(at).toBeGreaterThan(-1);
    const wrapper = src.slice(at, at + 400);
    // The Setup card went back to the height it had before the cards grew to fill the slide.
    expect(wrapper).toContain('slideId === SLIDE_SETUP ? "h-[88%] max-h-[88%]" : "flex-1"');
    // No other card lost the full-height behaviour.
    expect(wrapper).toContain(': "flex-1"');
    expect(wrapper).not.toContain('slideId === SLIDE_INTRO ? "h-[88%]');
  });
});
