import { describe, expect, it } from "bun:test";
import { BULLET, bulletize, bulletOnEnter } from "./PostItField";

// "To talk about" writes as a bullet list by default: the first line gets its bullet as
// soon as you type, Enter opens the next one, and print keeps one bullet per line.
describe("to talk about bullet points", () => {
  it("opens a fresh bullet when Enter is pressed", () => {
    const { value, caret } = bulletOnEnter("• first", 7, 7);
    expect(value).toBe("• first\n• ");
    expect(caret).toBe(10);
  });

  it("carries exactly one bullet on every written line in print", () => {
    expect(bulletize("eins\nzwei")).toBe("• eins\n• zwei");
    expect(bulletize("• eins\n- zwei")).toBe("• eins\n• zwei");
    expect(bulletize("eins\n\nzwei")).toBe("• eins\n\n• zwei");
  });

  it("uses the same bullet character everywhere", () => {
    expect(BULLET).toBe("• ");
    expect(bulletize("eins").startsWith(BULLET)).toBe(true);
  });
});
