import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { scaleValue, scaleExpression, scaleFaceBlend, scaleFaceGeometry, markerInset, scaleEndInset, columnBands, workloadShares, adjustWorkloadShares, workloadSegments, adjustWorkloadBoundary, workloadBand, RISIKO_STATEMENTS, RISIKO_ALLOCATION_HEADING, CRYING_TEAR, risikoPages, SCALE_CAPTIONS } from "./risiko-data";

describe("workload split", () => {
  test("represents an even default as adjoining widths filling 100%", () => {
    expect(workloadSegments(["a", "b"], workloadShares(["a", "b"], {}))).toEqual([
      { key: "a", start: 0, end: 50, width: 50 }, { key: "b", start: 50, end: 100, width: 50 },
    ]);
  });
  test("dragging a width boundary transfers work to its neighbour and clamps at 0 and 100", () => {
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, 70)).toEqual({ a: 70, b: 30 });
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, -20)).toEqual({ a: 0, b: 100 });
    expect(adjustWorkloadBoundary(["a", "b"], { a: 50, b: 50 }, 0, 120)).toEqual({ a: 100, b: 0 });
    expect(adjustWorkloadBoundary(["a", "b", "c"], { a: 34, b: 33, c: 33 }, 1, 80)).toEqual({ a: 34, b: 46, c: 20 });
  });
  test("starts equally and normalizes legacy values to exactly 100%", () => {
    expect(workloadShares(["a", "b"], {})).toEqual({ a: 50, b: 50 });
    expect(workloadShares(["a", "b", "c"], {})).toEqual({ a: 34, b: 33, c: 33 });
    expect(workloadShares(["a", "b"], { work_a: "80", work_b: "40" })).toEqual({ a: 67, b: 33 });
  });
  test("automatically moves the other partner to the remainder", () => {
    expect(adjustWorkloadShares(["a", "b"], { a: 50, b: 50 }, "a", 70)).toEqual({ a: 70, b: 30 });
    expect(adjustWorkloadShares(["a", "b"], { a: 70, b: 30 }, "b", 100)).toEqual({ a: 0, b: 100 });
  });
  test("preserves other partners' proportions, sharing equally when they are zero", () => {
    expect(adjustWorkloadShares(["a", "b", "c"], { a: 40, b: 40, c: 20 }, "a", 70)).toEqual({ a: 70, b: 20, c: 10 });
    expect(adjustWorkloadShares(["a", "b", "c"], { a: 100, b: 0, c: 0 }, "a", 50)).toEqual({ a: 50, b: 25, c: 25 });
  });
  test("every drag keeps integer bounded shares totaling 100%, also after save/read", () => {
    const keys = ["a", "b", "c", "d"];
    let shares = workloadShares(keys, {});
    for (const key of keys) for (let value = 0; value <= 100; value++) {
      shares = adjustWorkloadShares(keys, shares, key, value);
      expect(shares[key]).toBe(value);
      expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBe(100);
      expect(Object.values(shares).every(share => Number.isInteger(share) && share >= 0 && share <= 100)).toBe(true);
      expect(workloadShares(keys, Object.fromEntries(Object.entries(shares).map(([k, v]) => [`work_${k}`, String(v)])))).toEqual(shares);
    }
    expect(adjustWorkloadShares(["a"], { a: 100 }, "a", 10)).toEqual({ a: 100 });
  });
});

describe("Risikofaktoren scale", () => {
  test("morphs through crying, sad, neutral, smiling and laughing with a centred neutral anchor", () => {
    // Crying: the same round-dot eyes, no brows, and the laughing mouth flipped
    // into an open downturn — the single tear below the left eye sets it apart.
    expect(scaleFaceGeometry(0).eye).toEqual([9, 9, 9.01, 9, 15, 9, 15.01, 9]);
    expect(scaleFaceGeometry(0).eyeW).toBe(1.5);
    expect(scaleFaceGeometry(0).tear).toBe(CRYING_TEAR);
    expect(scaleFaceGeometry(12.5).tear).toBeCloseTo(CRYING_TEAR / 2);
    expect(scaleFaceGeometry(0).tear).toBeGreaterThan(0);
    // The sad face right next to it has the same eyes, but no tear.
    expect(scaleFaceGeometry(25).eye).toEqual([9, 9, 9.01, 9, 15, 9, 15.01, 9]);
    expect(scaleFaceGeometry(25).eyeW).toBe(1.5);
    // Every sad face is its happy twin in negative: the very same mouth curve and
    // the very same eyes, mirrored about the face's midline (y → 30 − y). The
    // crying end mirrors the laugh, the sad face next to it mirrors the smile.
    for (const [sad, happy] of [[0, 100], [25, 75]]) {
      const sadMouth = scaleFaceGeometry(sad).mouth;
      const happyMouth = scaleFaceGeometry(happy).mouth;
      sadMouth.forEach((coordinate, i) =>
        expect(coordinate).toBeCloseTo(i % 2 ? 30 - happyMouth[i] : happyMouth[i]));
      expect(scaleFaceGeometry(sad).eye).toEqual(scaleFaceGeometry(happy).eye);
    }
    // The downturn is as wide and as deep as the grin it mirrors.
    expect(scaleFaceGeometry(0).mouth[0]).toBe(6);
    expect(scaleFaceGeometry(0).mouth[1]).toBe(17);
    expect(scaleFaceGeometry(0).mouth[19]).toBe(12);
    expect(scaleFaceGeometry(50).mouth[7]).toBe(15);
    expect(scaleFaceGeometry(75).mouth[7]).toBe(16);
    expect(scaleFaceGeometry(100).mouth[1]).toBe(13);
    expect(scaleFaceGeometry(100).mouth[19]).toBe(18);
    // No face on this scale raises a brow — the crying end reads through its
    // downturn and its single tear alone.
    for (const value of [0, 12.5, 25, 50, 75, 87.5, 100]) {
      expect(scaleFaceGeometry(value).brow).toBe(0);
    }
    expect(scaleFaceGeometry(25).tear).toBe(0);
    expect(scaleFaceGeometry(87.5).mouth[19]).toBeCloseTo(17);
  });
  test("drag face matches the five evenly spaced smileys at their scale positions", () => {
    expect(scaleFaceBlend(0)).toEqual({ index: 0, mix: 0 });
    expect(scaleFaceBlend(25)).toEqual({ index: 1, mix: 0 });
    expect(scaleFaceBlend(50)).toEqual({ index: 2, mix: 0 });
    expect(scaleFaceBlend(75)).toEqual({ index: 3, mix: 0 });
    expect(scaleFaceBlend(100)).toEqual({ index: 3, mix: 1 });
    expect(scaleFaceBlend(12.5)).toEqual({ index: 0, mix: 0.5 });
  });
  test("expression follows drag position from sad to neutral to happy", () => {
    expect(scaleExpression(0)).toBe(-1);
    expect(scaleExpression(25)).toBe(-0.5);
    expect(scaleExpression(50)).toBe(0);
    expect(scaleExpression(75)).toBe(0.5);
    expect(scaleExpression(100)).toBe(1);
  });
  test("defaults to neutral", () => {
    expect(scaleValue()).toBe(50);
    expect(scaleValue("")).toBe(50);
  });
  test("stays within sad and happy", () => {
    expect(scaleValue("-5")).toBe(0);
    expect(scaleValue("120")).toBe(100);
  });
  test("the circle travels freely between the outer smileys", () => {
    // ends: half a face inside each side, exactly under the outer smileys
    expect(markerInset(0, 11.5)).toBe(11.5);
    expect(markerInset(100, 11.5)).toBe(-11.5);
    expect(markerInset(50, 11.5)).toBe(0);
    // in between it stops anywhere: nothing snaps to a field
    expect(markerInset(37, 11.5)).toBeCloseTo(2.99, 5);
    expect(markerInset(62.5, 11.5)).toBeCloseTo(-2.875, 5);
  });
  test("workload shares keep the exact dragged value", () => {
    expect(scaleValue("73")).toBe(73);
  });
  test("has the six statements, being yourself first", () => {
    expect(RISIKO_STATEMENTS.length).toBe(6);
    expect(RISIKO_STATEMENTS[0]).toEqual(["self", "Ich kann in deiner Gegenwart so sein wie ich bin und fühle mich gesehen und respektiert"]);
    expect(RISIKO_STATEMENTS[1]).toEqual(["love", "Wir zeigen uns aktiv, dass wir uns lieben"]);
    expect(RISIKO_STATEMENTS[5]).toEqual(["quality", "Wir nehmen uns auch im Alltag Zeit für gemeinsame Erlebnisse und schaffen Nähe, bleiben neugierig auf das, was uns bewegt, und unterstützen einander dabei zu wachsen"]);
  });
  test("asks the work-split question on its own card", () => {
    expect(RISIKO_ALLOCATION_HEADING).toBe("Wer leistet aktuell wie viel der Beziehungsarbeit?");
  });
  test("shows two statements per card and closes with the work split", () => {
    const pages = risikoPages(["p0", "p1"]);
    expect(pages.map(p => p.statements.map(([key]) => key))).toEqual([
      ["self", "love"], ["appreciation", "conflicts"], ["metime", "quality"], ["hot"], [],
    ]);
    expect(pages[pages.length - 1].personKeys).toEqual(["p0", "p1"]);
    expect(pages.slice(0, -1).every(p => p.personKeys.length === 0)).toBe(true);
  });
  test("skips the work-split card when nobody is named", () => {
    expect(risikoPages([]).length).toBe(4);
    expect(risikoPages([]).every(p => p.personKeys.length === 0)).toBe(true);
  });
  test("keeps every partner on one shared allocation line", () => {
    const keys = Array.from({ length: 12 }, (_, i) => `p${i}`);
    const withPartners = risikoPages(keys).filter(p => p.personKeys.length);
    expect(withPartners.length).toBe(1);
    expect(withPartners[0].personKeys).toEqual(keys);
  });
  test("leaves no margin between neighbouring work-split circles", () => {
    // adjacent circles sit exactly one band apart — a band is one circle wide,
    // so neighbours touch with no margin between them
    expect(workloadBand(32, 32, 2)).toBe("min(32px, calc((100cqw - 32px) / 2))");
    // the band never eats the room the circles need to move, even with many partners
    for (const count of [2, 5, 8]) {
      const band = Math.min(32, (300 - 32) / count);
      expect(300 - band * (count - 1) - 32).toBeGreaterThan(0);
    }
  });
});

describe("grey columns", () => {
  test("one equally wide band per smiley, each face centred in its band", () => {
    expect(columnBands(5)).toEqual([[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]]);
    const bands = columnBands(5);
    expect(bands.slice(1).map(([from], i) => from - bands[i][1])).toEqual([0, 0, 0, 0]);
    expect(columnBands(2)).toEqual([[0, 50], [50, 100]]);
    expect(columnBands(1)).toEqual([[0, 100]]);
    expect(columnBands(0)).toEqual([]);
  });
  test("every second column is a slightly deeper grey, both a shade lighter than the info fill", () => {
    // The columns sit just above the info rows' label-field grey, and the two
    // fills are the only thing separating neighbouring fields, so they must
    // differ — and the deeper one must actually be the deeper one.
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const hex = (token) => {
      const found = css.match(new RegExp(`--${token}:\\s*#([0-9A-Fa-f]{6})`));
      expect(found, `--${token} missing from index.css`).not.toBeNull();
      return found[1].toLowerCase();
    };
    const actionRow = readFileSync(new URL("./ActionRow.tsx", import.meta.url), "utf8");
    const infoFill = actionRow.match(/fieldBg \?\? "#([0-9A-Fa-f]{6})"/)?.[1]?.toLowerCase();
    expect(infoFill, "info row default field grey missing").toBeTruthy();
    const [fill, alt] = [hex("risiko-column-fill"), hex("risiko-column-fill-alt")];
    const lightness = (h) => parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
    expect(lightness(fill)).toBeGreaterThan(lightness(infoFill));
    expect(alt).not.toBe(fill);
    expect(lightness(alt)).toBeLessThan(lightness(fill));
    // both fills stay close together so the fields read as one soft block
    expect(lightness(fill) - lightness(alt)).toBeLessThanOrEqual(24);
  });
  test("the scale smileys and their dashed guides share one darker grey", () => {
    // The five faces, the dashed line down each column and the two end labels are
    // one and the same grey now; the lighter --risiko-caption tone only serves the
    // Health Check cards' dashed lines, so the scale's grey stays the darker one.
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const token = (name) => css.match(new RegExp(`--${name}:\\s*#([0-9A-Fa-f]{6})`))?.[1]?.toLowerCase();
    const lightness = (h) => parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
    const guide = token("risiko-guide");
    const face = slide.match(/export const FACE_GREY = "#([0-9A-Fa-f]{6})"/)?.[1]?.toLowerCase();
    expect(guide, "--risiko-guide missing from index.css").toBeTruthy();
    expect(face, "FACE_GREY missing from RisikoSlide.tsx").toBeTruthy();
    expect(face).toBe(guide);
    expect(/border-left: 1px dashed var\(--risiko-guide\)/.test(css), "guides do not use --risiko-guide").toBe(true);
    expect(/color=\{FACE_GREY\}/.test(slide), "the scale faces do not use FACE_GREY").toBe(true);
    expect(lightness(guide)).toBeLessThan(lightness(token("risiko-caption")));
  });
  test("the end labels rest on the columns' top edge in the scale's grey at info size", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const caption = css.match(/\.risiko-scale-caption \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(caption, ".risiko-scale-caption missing from index.css").toBeTruthy();
    expect(/color:\s*var\(--risiko-guide\)/.test(caption), "the labels do not use the smileys' grey").toBe(true);
    // the info rows' size: 16px on desktop …
    expect(/font-size:\s*16px/.test(caption), "the labels are not at the info rows' desktop size").toBe(true);
    // … and the same one step smaller on phones and tablets
    const mq = css.split("@media (max-width: 1023px)")[1] ?? "";
    const block = mq.slice(0, mq.indexOf("\n}"));
    expect(block).toContain(".risiko-scale-caption");
    expect(block).toContain("font-size: 12px");
    // nothing separates the labels from the fields they name
    expect(/className="risiko-scale-row[^"]*gap-/.test(slide), "the label row still keeps a gap above the columns").toBe(false);
  });

  test("the slider rule is exactly as thick as the work-split bar", () => {
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    // the work-split bar is Tailwind's h-1, i.e. 4px
    expect(/w-full h-1 flex/.test(slide), "the work-split bar is no longer h-1 (4px)").toBe(true);
    const rule = Number(slide.match(/const RULE_W = (\d+)/)?.[1]);
    expect(rule, "the slider rule does not match the work-split bar's 4px").toBe(4);
  });
});

describe("work-split partner colours", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const colors = Array.from({ length: 8 }, (_, i) =>
    css.match(new RegExp(`--workload-partner-${i}:\\s*(#[0-9A-Fa-f]{6})`))?.[1]?.toUpperCase()
  );
  test("the second partner carries the Health Check's own dark green", () => {
    expect(colors[1]).toBe("#054C45");
  });
  test("no two partners share a colour", () => {
    expect(colors).toHaveLength(8);
    expect(new Set(colors).size).toBe(8);
  });
});

describe("smiley scale spans its container", () => {
  const W = 440, FACE = 20, MARKER = 32;
  const inset = scaleEndInset(MARKER);
  const pad = inset - FACE / 2;
  test("the circle's travel is inset by its own radius, so it is never cut off", () => {
    // at both ends the circle's outer edge lands exactly on the container's edge
    expect(markerInset(0, inset)).toBe(16);
    expect(markerInset(100, inset)).toBe(-16);
  });
  test("every smiley centre sits exactly under the circle's matching position", () => {
    for (let k = 0; k < 5; k++) {
      const faceCentre = pad + FACE / 2 + (k * (W - 2 * pad - FACE)) / 4;
      const circleCentre = (k * 25 * W) / 100 + markerInset(k * 25, inset);
      expect(circleCentre).toBeCloseTo(faceCentre, 6);
    }
  });
});

describe("smallest text size", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const sizes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].replace("!important", "").trim());
  test("every text size in the stylesheet is at least 12px", () => {
    expect(sizes.length).toBeGreaterThan(10);
    const below = sizes.filter((size) => {
      if (size === "inherit") return false;
      const px = size.match(/^([\d.]+)px$/);
      const rem = size.match(/^([\d.]+)rem$/);
      if (!px && !rem) return true; // a computed size could drop under the floor
      return (px ? Number(px[1]) : Number(rem[1]) * 16) < 12;
    });
    expect(below).toEqual([]);
  });
  test("the helper sentences read exactly the floor size on phones and tablets", () => {
    expect(css).toMatch(/@media \(max-width: 1023px\) \{\s*\.retro-info-row[,\s][^{]*\{\s*font-size: 12px;/);
  });
});

describe("scale columns and page split", () => {
  test("names every column, from not yet to absolutely", () => {
    expect([...SCALE_CAPTIONS]).toEqual([
      "noch nicht", "eher nicht", "teils / teils", "eher schon", "absolut",
    ]);
    expect(SCALE_CAPTIONS.length).toBe(5);
  });

  test("splits the statements over cards of the asked size without losing one", () => {
    const two = risikoPages([], 2);
    const one = risikoPages([], 1);
    expect(two.map((p) => p.statements.length)).toEqual([2, 2, 2, 1]);
    expect(one.map((p) => p.statements.length)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    const keys = (pages) => pages.flatMap((p) => p.statements.map((s) => s[0]));
    expect(keys(one)).toEqual(keys(two));
    expect(keys(one).length).toBe(RISIKO_STATEMENTS.length + 1);
    expect(risikoPages([], 0).map((p) => p.statements.length)).toEqual(two.map((p) => p.statements.length));
  });
});

