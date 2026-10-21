import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { scaleValue, scaleExpression, scaleFaceBlend, scaleFaceGeometry, markerInset, scaleEndInset, columnBands, columnEdges, captionLines, workloadShares, adjustWorkloadShares, workloadSegments, adjustWorkloadBoundary, workloadBand, RISIKO_STATEMENTS, RISIKO_PER_PAGE, RISIKO_ALLOCATION_HEADING, RISIKO_ALLOCATION_SUBHEADING, RISIKO_ALLOCATION_EXAMPLES, allocationExamplesSentence, risikoPages, SCALE_CAPTIONS, softHyphenate, RISIKO_MOOD_KEYS, averageMood, moodFaceIndex, RISIKO_CHAPTER_OPEN, RISIKO_CHAPTER_INFO } from "./risiko-data";

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
    // into an open downturn — its downturn alone carries the sadness.
    expect(scaleFaceGeometry(0).eye).toEqual([9, 9, 9.01, 9, 15, 9, 15.01, 9]);
    expect(scaleFaceGeometry(0).eyeW).toBe(1.5);
    // No face on this scale sheds a tear — the geometry carries none at all.
    for (const value of [0, 12.5, 25, 50]) {
      expect(scaleFaceGeometry(value)).not.toHaveProperty("tear");
    }
    // The sad face right next to it has the same eyes.
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
    // downturn alone.
    for (const value of [0, 12.5, 25, 50, 75, 87.5, 100]) {
      expect(scaleFaceGeometry(value).brow).toBe(0);
    }
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
    expect(RISIKO_ALLOCATION_HEADING).toBe("Ist unsere Beziehungsarbeit gerecht verteilt?");
    expect(RISIKO_ALLOCATION_SUBHEADING).toBe("Oder leistet einer von uns einen deutlich größeren Anteil?");
  });
  test("shows one statement per card and closes with the work split", () => {
    const pages = risikoPages(["p0", "p1"]);
    expect(pages.map(p => p.statements.map(([key]) => key))).toEqual([
      ["self"], ["love"], ["appreciation"], ["conflicts"], ["metime"], ["quality"], ["hot"], [],
    ]);
    expect(pages[pages.length - 1].personKeys).toEqual(["p0", "p1"]);
    expect(pages.slice(0, -1).every(p => p.personKeys.length === 0)).toBe(true);
  });
  test("skips the work-split card when nobody is named", () => {
    expect(risikoPages([]).length).toBe(7);
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
  test("the dividers sit between every pair of columns, never at the scale's edges", () => {
    // Five columns need four lines: one between every neighbour. The scale's own
    // left and right edge carry nothing, so the row ends open. Nothing is painted
    // between them — the columns are drawn purely by these dividers.
    expect(columnEdges(5)).toEqual([20, 40, 60, 80]);
    expect(columnEdges(2)).toEqual([50]);
    expect(columnEdges(1)).toEqual([]);
    expect(columnEdges(0)).toEqual([]);
    // every divider is an interior band boundary; neither scale end carries one
    const bands = columnBands(5);
    expect(columnEdges(5)).toEqual(bands.slice(0, -1).map(([, to]) => to));
    expect(columnEdges(5)).not.toContain(0);
    expect(columnEdges(5)).not.toContain(100);
  });
  test("the columns carry no fill — only dashed lines, softer than the smileys' guides", () => {
    // The five fields read through their dividers alone. The smileys keep the
    // stronger dashed line of their own, so a divider may never compete with it:
    // its grey has to stay the lighter of the two.
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const hex = (token) => {
      const found = css.match(new RegExp(`--${token}:\\s*#([0-9A-Fa-f]{6})`));
      expect(found, `--${token} missing from index.css`).not.toBeNull();
      return found[1].toLowerCase();
    };
    const lightness = (h) => parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
    const line = hex("risiko-column-line");
    expect(lightness(line), "the column lines are not softer than the smileys' dotted guides").toBeGreaterThan(lightness(hex("risiko-line")));
    // both stay well clear of ink black
    expect(lightness(line)).toBeLessThan(720);
    expect(/border-left: 1px dashed var\(--risiko-column-line\)/.test(css), "the column lines do not use --risiko-column-line").toBe(true);
    // nothing is painted behind a column any more
    expect(css).not.toMatch(/--risiko-column-fill/);
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    expect(slide).not.toMatch(/risiko-column-band/);
    // and the dividers are drawn on both scales, screen and print alike
    const edges = slide.match(/columnEdges\(FACES\.length\)/g) ?? [];
    expect(edges.length, "the dividers are missing from a scale").toBeGreaterThanOrEqual(2);
  });
  test("the scale smileys sit a shade lighter than their dotted guides and column names", () => {
    // The dotted line down each column reads as a whisper (--risiko-line), the
    // five names below it in the scale's darker grey (--risiko-guide), and the
    // faces themselves a step lighter than the line — the softest thing on the
    // scale, but still dark enough to stand out from the pale grey around them.
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const token = (name) => css.match(new RegExp(`--${name}:\\s*#([0-9A-Fa-f]{6})`))?.[1]?.toLowerCase();
    const lightness = (h) => parseInt(h.slice(0, 2), 16) + parseInt(h.slice(2, 4), 16) + parseInt(h.slice(4, 6), 16);
    const line = token("risiko-line");
    const names = token("risiko-guide");
    const face = slide.match(/export const FACE_GREY = "#([0-9A-Fa-f]{6})"/)?.[1]?.toLowerCase();
    expect(line, "--risiko-line missing from index.css").toBeTruthy();
    expect(face, "FACE_GREY missing from RisikoSlide.tsx").toBeTruthy();
    expect(/border-left: 1px dashed var\(--risiko-line\)/.test(css), "the dotted guides do not use --risiko-line").toBe(true);
    expect(lightness(face), "the smileys are not lighter than the dotted guides").toBeGreaterThan(lightness(line));
    expect(lightness(line), "the dotted guides are not softer than the column names").toBeGreaterThan(lightness(names));
    expect(lightness(face), "the smileys are not darker than the pale caption grey").toBeLessThan(lightness(token("risiko-caption")));
    expect(/const Face = \(\{ Icon, color = FACE_GREY \}/.test(slide), "the scale faces no longer default to FACE_GREY").toBe(true);
    expect(/color=\{color\}/.test(slide), "the scale faces do not paint that colour").toBe(true);

    expect(lightness(line)).toBeLessThan(lightness(token("risiko-caption")));
  });
  test("the rule's ends are rounded and the fields stand at their own height on screen", () => {
    // The rule carries a radius of half its own thickness, so it finishes in a
    // half-circle rather than a square cut. On screen the fields stand at one
    // fixed height, which is what lets the scale be centred on the card — the
    // printed card is sized to the sheet and keeps filling its whole page.
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const rule = slide.match(/background: INK,[^\n]*/)?.[0] ?? "";
    expect(rule, "the rule line is missing").not.toBe("");
    expect(/borderRadius: RULE_W \/ 2/.test(rule), "the rule's ends are not rounded").toBe(true);
    const screen = css.split("@media screen")[1] ?? "";
    expect(/\.risiko-scale-field \{ flex: 0 0 var\(--risiko-field-h\); \}/.test(screen), "the fields do not stand at their own height on screen").toBe(true);
    const print = css.split("@media print")[1] ?? "";
    expect(print, "the printed fields are capped too").not.toContain("max-height: var(--risiko-field-h)");
    expect(print, "the printed fields are held to one height too").not.toContain("flex: 0 0 var(--risiko-field-h)");
  });
  test("the work-split lane stands exactly as tall as the statement fields", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const field = css.match(/--risiko-field-h:\s*(\d+)px/)?.[1];
    expect(field, "the shared field height is missing").toBeTruthy();
    const lane = css.match(/\.workload-lane \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(/height:\s*calc\(var\(--risiko-field-h\) \+ var\(--risiko-name-strip\)\)/.test(lane),
      "the lane does not tie its height to the fields").toBe(true);
    // Nothing may pin the lane to its own fixed pixel height any more.
    expect(slide, "the lane still carries a fixed height").not.toMatch(/workload-lane[^"]*h-\[\d+px\]/);
    // The bar rides the fields' middle, so both scales read the same way.
    const bar = css.match(/\.workload-bar \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(/top:\s*calc\(\(100cqh - var\(--risiko-name-strip\)\) \/ 2 - 2px\)/.test(bar), "the bar is not centred on the fields").toBe(true);
  });
  test("each partner is named above the rule and its share printed below, on that partner's own colour", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const row = (cls) => css.match(new RegExp(`\\.${cls} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
    const label = row("workload-label");
    const share = row("workload-percentage");
    const above = row("workload-labels");
    const below = row("workload-shares");
    expect(label, ".workload-label missing from index.css").toBeTruthy();
    expect(above, ".workload-labels missing from index.css").toBeTruthy();
    expect(below, ".workload-shares missing from index.css").toBeTruthy();
    // The names' row stands on the rule's head, the shares' row on its foot — both
    // measured from the rule's own middle, so neither of them ever sits on the rule.
    expect(/bottom:\s*calc\(\(100cqh \+ var\(--risiko-name-strip\)\) \/ 2 \+ \d+px\)/.test(above),
      "the names do not stand above the rule").toBe(true);
    expect(/top:\s*calc\(\(100cqh - var\(--risiko-name-strip\)\) \/ 2 \+ \d+px\)/.test(below),
      "the shares do not stand below the rule").toBe(true);
    // The name is the couple's own wording, the number keeps the partner's plain colour.
    expect(/color:\s*var\(--workload-ink\)/.test(label), "the name does not use the partner's readable ink").toBe(true);
    expect(/color:\s*var\(--workload-color\)/.test(share), "the share does not use the partner's colour").toBe(true);
    // A name longer than the row's fixed width breaks at its own words onto a second
    // line; a number never has to, because "100%" is already the widest it gets.
    expect(label).not.toMatch(/white-space:\s*nowrap/);
    expect(/max-width:/.test(label), "a name may grow without end").toBe(true);
    expect(/white-space:\s*nowrap/.test(share), "the share may wrap").toBe(true);
    // Both rows are centred on their own colour run and held inside the lane's edges,
    // so a one-sided split can never cut a name or a number off.
    expect(slide, "the rows are not centred on their colour runs").toContain("centreAt(");
    expect(slide, "the rows are not held inside the lane").toMatch(/calc\(100% - \$\{half\}px\)/);
    expect(slide, "the name is not worded as an share label").toContain("shareLabel(");
    // A name ending in an s keeps just the apostrophe, so it never doubles.
    expect(/\/s\$\//.test(slide), "the s-ending rule is gone").toBe(true);
    expect(slide, "the plain name label is gone").toContain("’s Anteil:");
    // Nothing hangs under the circles any more — the names moved above the rule.
    expect(slide, "a name still hangs under a circle").not.toContain("workload-name");
  });
  test("the end labels rest on the columns' top edge in the scale's grey at their own small size", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const caption = css.match(/\.risiko-scale-caption \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(caption, ".risiko-scale-caption missing from index.css").toBeTruthy();
    expect(/color:\s*var\(--risiko-guide\)/.test(caption), "the labels do not use the smileys' grey").toBe(true);
    // One step under the info rows' floor, because two lines of a name have to fit
    // a column's width (~61px): the longest half ("teilweise zu") measures 59px at
    // 11px and would not fit at 12px. Every name still breaks at its own words into
    // exactly two lines, so the row reads as one even block.
    expect(/font-size:\s*11px/.test(caption), "the labels do not read at their own small size").toBe(true);
    // … and they keep that size on phones instead of being swept into the 12px media rule
    const mq = css.split("@media (max-width: 1023px)")[1] ?? "";
    const block = mq.slice(0, mq.indexOf("\n}"));
    expect(block).not.toContain(".risiko-scale-caption");
    // nothing separates the labels from the fields they name
    expect(/className="risiko-scale-row[^"]*gap-/.test(slide), "the label row still keeps a gap above the columns").toBe(false);
    // The dotted lines run down through the names' band now, so each name keeps
    // a plate of the card's own surface — never a grey fill: the line passes
    // behind the word instead of drawing through its letters.
    expect(/background:\s*var\(--risiko-surface\)/.test(caption), "the name does not keep a plate of the card's surface").toBe(true);
    expect(caption).not.toMatch(/background:\s*(#|var[(]--risiko-(guide|caption|column|helper))/);
    // and the plate repaints for paper, so it never shows as a pale patch
    expect(/\.print-slide-page \.risiko-page \{[^}]*--risiko-surface:\s*#F0EFEE/.test(css), "the plate does not repaint for paper").toBe(true);
  });

  test("the slider rule is exactly as thick as the work-split bar", () => {
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    // the work-split bar is 4px tall, however it is drawn
    const bar = css.match(/\.workload-bar \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const thick = Number(bar.match(/height:\s*(\d+)px/)?.[1]);
    expect(thick, "the work-split bar's thickness is gone").toBe(4);
    const rule = Number(slide.match(/const RULE_W = (\d+)/)?.[1]);
    expect(rule, "the slider rule does not match the work-split bar's 4px").toBe(thick);
  });
});

describe("work-split partner colours", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const colors = Array.from({ length: 8 }, (_, i) =>
    css.match(new RegExp(`--workload-partner-${i}:\\s*(#[0-9A-Fa-f]{6})`))?.[1]?.toUpperCase()
  );
  test("the second partner carries the Health Check's own deep green", () => {
    expect(colors[1]).toBe("#0B7A35");
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
  test("every text size in the stylesheet is at least 12px, except the scale's column labels", () => {
    expect(sizes.length).toBeGreaterThan(10);
    const below = sizes.filter((size) => {
      if (size === "inherit") return false;
      const isSize = (value) => {
        const px = value.trim().match(/^([\d.]+)px$/);
        const rem = value.trim().match(/^([\d.]+)rem$/);
        return px || rem ? (px ? Number(px[1]) : Number(rem[1]) * 16) : null;
      };
      // A size that comes from a token is only safe when the token itself — and the
      // fallback written at the use site — are both real sizes above the floor.
      const variable = size.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
      if (variable) {
        const token = css.match(new RegExp(`${variable[1]}:\\s*([^;]+);`));
        const readings = [variable[2], token && token[1]].filter((v) => v !== undefined && v !== null);
        if (!readings.length) return true;
        return readings.some((v) => { const n = isSize(v); return n === null || n < 12; });
      }
      const n = isSize(size);
      if (n === null) return true; // a computed size could drop under the floor
      return n < 12;
    });
    // The two deliberate exceptions, both the five column labels: they read one step
    // under the floor (11px) so a name's longer half fits its column on two lines, and
    // on phones they scale to the column instead.
    expect(below).toEqual(["11px", "clamp(9px, calc((100cqw - 16px) / 5 / 5.2), 13px)"]);
    expect(css).toMatch(/\.risiko-scale-caption \{[^}]*font-size: 11px;[^}]*\}/);
  });
  test("the helper sentences read exactly the floor size on phones and tablets", () => {
    expect(css).toMatch(/@media \(max-width: 1023px\) \{\s*\.retro-info-row[,\s][^{]*\{\s*font-size: 12px;/);
  });
  test("keeps the column labels' own size on phones instead of the info rows' 12px", () => {
    const media = css.match(/@media \(max-width: 1023px\) \{[\s\S]*?\n\}/)[0];
    expect(media).not.toMatch(/\.risiko-scale-caption/);
  });
});

describe("scale columns and page split", () => {
  test("names every column, from never applies to always applies", () => {
    expect([...SCALE_CAPTIONS]).toEqual([
      "Trifft noch nicht zu",
      "Trifft selten zu",
      "Trifft teilweise zu",
      "Trifft oft zu",
      "Trifft immer zu",
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
    expect(risikoPages([], 0).map((p) => p.statements.length)).toEqual(one.map((p) => p.statements.length));
  });
});


describe("column labels on a narrow phone", () => {
  test("offers the correct German break point inside the long word", () => {
    expect(softHyphenate("Trifft teilweise zu")).toBe("Trifft teil\u00ADweise zu");
    expect(softHyphenate("Trifft Teilweise zu")).toBe("Trifft Teil\u00ADweise zu");
  });

  test("leaves every other label untouched", () => {
    expect(softHyphenate("Trifft noch nicht zu")).toBe("Trifft noch nicht zu");
    expect(softHyphenate("Trifft selten zu")).toBe("Trifft selten zu");
    expect(softHyphenate("Trifft oft zu")).toBe("Trifft oft zu");
    expect(softHyphenate("Trifft immer zu")).toBe("Trifft immer zu");
  });

  test("keeps the wording the couple reads, hyphen or no hyphen", () => {
    expect([...SCALE_CAPTIONS].map((c) => softHyphenate(c).replace(/\u00AD/g, "")))
      .toEqual([...SCALE_CAPTIONS]);
  });
});

describe("column names break into two lines", () => {
  test("every name splits at a word boundary into two lines of even length", () => {
    expect(SCALE_CAPTIONS.map(captionLines)).toEqual([
      ["Trifft noch", "nicht zu"],
      ["Trifft", "selten zu"],
      ["Trifft", "teilweise zu"],
      ["Trifft", "oft zu"],
      ["Trifft", "immer zu"],
    ]);
  });
  test("the longest half sets the labels' size: twelve letters, nothing longer", () => {
    // "teilweise zu" is the one line a column has to hold; at 11px it measures 59px
    // of the ~61px column, so 11px is the largest size every name fits on.
    const halves = SCALE_CAPTIONS.flatMap(captionLines);
    expect(Math.max(...halves.map((l) => l.length))).toBe(12);
    expect(halves.every((l) => l.length <= 12)).toBe(true);
  });
});

describe("the fixed sentence of Beziehungsarbeit examples on the work-split card", () => {
  test("reads the intro, the comma-joined examples and a full stop", () => {
    expect(allocationExamplesSentence()).toBe(
      "Beziehungsarbeit heißt zum Beispiel schwierige Gespräche initiieren, " +
      "im Streit nachgeben um zu deeskalieren, sich Fehler eingestehen, " +
      "sich als unschuldiger entschuldigen, einen großen Kompromiss zusagen, " +
      "Verletzungen aufarbeiten, den anderen emotional auffangen, " +
      "auch mal zurückstecken."
    );
  });
  test("separates every example with a comma and ends with a full stop", () => {
    const sentence = allocationExamplesSentence();
    expect(sentence.startsWith("Beziehungsarbeit heißt zum Beispiel ")).toBe(true);
    expect(sentence.endsWith(".")).toBe(true);
    expect(sentence.split(", ").length).toBe(8);
    expect(new Set(sentence.replace("Beziehungsarbeit heißt zum Beispiel ", "").replace(/\.$/, "").split(", ")).size).toBe(8);
  });
  test("reads in the card's own ink at the smallest readable size", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const blocks = [...css.matchAll(/\.risiko-allocation-examples \{[^}]*\}/g)].map((m) => m[0]);
    const examples = blocks.find((b) => /color:/.test(b)) ?? "";
    expect(examples, "the examples rule is gone").toBeTruthy();
    expect(examples, "the examples do not read in the card's ink").toMatch(/color:\s*var\(--retro-black\)/);
    expect(examples, "the examples are grey again").not.toMatch(/color:\s*var\(--risiko-guide\)/);
    expect(examples, "the examples no longer read at 12px").toMatch(/font-size:\s*12px/);
  });
  test("draws the line between the two Memojis as thick as the slider's rule", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const boundary = css.match(/\.workload-boundary \{[^}]*\}/)?.[0] ?? "";
    expect(boundary, "the boundary rule is gone").toBeTruthy();
    expect(boundary, "the line between the Memojis is no longer solid ink").toMatch(/background:\s*var\(--retro-black\)/);
    expect(boundary, "the line between the Memojis is thinner than the slider's rule").toMatch(/width:\s*4px/);
    expect(boundary, "the line between the Memojis is no longer centred in the gap").toMatch(/transform:\s*translateX\(-2px\)/);
  });
  test("reads at the same size as the deck's other questions, also on a phone", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const phone = (css.match(/@media \(max-width: 767px\) \{[\s\S]*?\n\}/g) ?? [])
      .find((b) => /font-size/.test(b) && /risiko-allocation-statement/.test(b)) ?? "";
    expect(phone, "the phone size of the work-split headline is gone").toBeTruthy();
    expect(phone, "the work-split headline no longer reads at the question's own size on a phone").toMatch(/\.risiko-allocation-statement \{ font-size: 38\.4px; \}/);
  });
  test("on a phone keeps the question, its smaller second half and the split bar, dropping the examples and the note", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const phone = (css.match(/@media \(max-width: 767px\) \{[\s\S]*?\n\}/g) ?? [])
      .find((b) => /risiko-allocation-page/.test(b)) ?? "";
    expect(phone, "the phone rule for the work-split card is gone").toBeTruthy();
    expect(phone, "the examples are back on a phone").toMatch(/\.risiko-allocation-page \.risiko-allocation-examples,[\s\S]*?display: none;/);
    expect(phone, "the scale's note line is back on a phone").toMatch(/\.risiko-allocation-page \.risiko-helper/);
    // The smaller headline stays on a phone, so it carries the card's gap down to
    // the split bar while the question sits close above it.
    expect(phone, "the question no longer sits close above its smaller second half").toMatch(/\.risiko-allocation-page \.risiko-allocation-statement \{ margin-bottom: 6px; \}/);
    expect(phone, "the smaller headline lost its gap to the split bar").toMatch(/\.risiko-allocation-page \.risiko-allocation-subheading \{[\s\S]*?margin-bottom: var\(--risiko-scale-pad\);/);
    const tsx = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    expect(tsx, "the work-split card no longer marks itself for the phone rule").toMatch(/risiko-allocation-page/);
  });
});

describe("mood test chapter", () => {
  const full = Object.fromEntries(["self", "love", "appreciation", "conflicts", "metime", "quality", "hot"].map((key) => [key, "50"]));
  test("covers exactly the seven statement sliders, in card order", () => {
    expect([...RISIKO_MOOD_KEYS]).toEqual(["self", "love", "appreciation", "conflicts", "metime", "quality", "hot"]);
  });
  test("shows no mood until every statement slider has been dragged", () => {
    expect(averageMood({})).toBeNull();
    expect(averageMood({ self: "30" })).toBeNull();
    // one missing answer is enough to keep the smiley hidden
    const almost = { ...full };
    delete almost.hot;
    expect(averageMood(almost)).toBeNull();
    // an answer left blank counts as not dragged
    expect(averageMood({ ...full, quality: "  " })).toBeNull();
  });
  test("is the mean of all seven statement values once all are dragged", () => {
    expect(averageMood(full)).toBe(50);
    expect(averageMood({ self: "0", love: "100", appreciation: "0", conflicts: "100", metime: "0", quality: "100", hot: "20" })).toBeCloseTo(320 / 7);
    // every slider of the chapter counts, including the hot one
    expect(averageMood({ ...full, hot: "100" })).toBeCloseTo((50 * 6 + 100) / 7);
  });
  test("rounds the average to the nearest of the five scale faces", () => {
    expect(moodFaceIndex(0)).toBe(0);
    expect(moodFaceIndex(12)).toBe(0);
    expect(moodFaceIndex(13)).toBe(1);
    expect(moodFaceIndex(37)).toBe(1);
    expect(moodFaceIndex(38)).toBe(2);
    expect(moodFaceIndex(50)).toBe(2);
    expect(moodFaceIndex(62)).toBe(2);
    expect(moodFaceIndex(63)).toBe(3);
    expect(moodFaceIndex(87)).toBe(3);
    expect(moodFaceIndex(88)).toBe(4);
    expect(moodFaceIndex(100)).toBe(4);
  });
  test("the chapter opens with the couple's own words inside the intro sentence", () => {
    expect(RISIKO_CHAPTER_OPEN).toBe("Testet euer Beziehungsgefühl");
    expect(RISIKO_CHAPTER_INFO).toBe("Die Statements beschreiben, was eine glückliche Beziehung ausmacht. Vergleicht sie mit eurer eigenen Beziehung: Welches Gefühl dominiert am Ende?");
  });
  test("the chapter pill reads Mood Test on the statement cards and keeps Health Check on the first two", () => {
    const cards = readFileSync(new URL("./RetroCards.tsx", import.meta.url), "utf8");
    expect(cards).toContain('105: "Health Check"');
    expect(cards).toContain('1: "Health Check"');
    expect(cards).toContain('2: "Health Check"');
    expect(cards).toContain('"Health Check" : SLIDE_PILLS[slideId]');
  });
  test("the chapter block and the mood smiley are rendered on the first statement card", () => {
    const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
    expect(slide).toContain("RISIKO_CHAPTER_OPEN");
    expect(slide).toContain("RISIKO_CHAPTER_INFO");
    expect(slide).toContain("averageMood(values)");
    expect(slide).toContain("moodFaceIndex(mood)");
    expect(slide).toContain("label={chapterIntro(chapterMood, INK)}");

  });
});

describe("chapter card pagination", () => {
  test("gives the chapter card its own smaller size without touching the rest", () => {
    expect(risikoPages([], 2, 1).map((p) => p.statements.map(([k]) => k))).toEqual([
      ["self"], ["love", "appreciation"], ["conflicts", "metime"], ["quality", "hot"],
    ]);
  });
  test("keeps the work-split card last and loses no statement", () => {
    const pages = risikoPages(["a", "b"], 2, 1);
    expect(pages.flatMap((p) => p.statements.map(([k]) => k)).sort()).toEqual(
      ["appreciation", "conflicts", "hot", "love", "metime", "quality", "self"]);
    expect(pages[pages.length - 1]).toEqual({ statements: [], personKeys: ["a", "b"] });
  });
  test("without a chapter size every card keeps the asked size", () => {
    expect(risikoPages([], 2, 2)).toEqual(risikoPages([], 2));
    expect(risikoPages([], 1)).toEqual(risikoPages([]));
  });
});

describe("the statement's own type", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
  test("reads in the big question's display face, at the question's own size", () => {
    const statement = (css.match(/\.risiko-statement \{[\s\S]*?\n\}/g) ?? [])
      .find((block) => block.includes("overflow-wrap")) ?? "";
    expect(statement, ".risiko-statement missing from index.css").toBeTruthy();
    // The display face comes from the rule that already dresses the big question,
    // so the statement cannot drift away from it; the global `#root *` rule would
    // otherwise paint every element Figtree.
    const questionRule = css.match(/#root \.question-font,[\s\S]*?\n\}/)?.[0] ?? "";
    expect(questionRule, "the shared question rule is missing").toBeTruthy();
    expect(questionRule, "the statement does not stand in the question's own rule")
      .toMatch(/#root \.risiko-statement/);
    // The size comes from that same display rule: the statement stands in it
    // beside the question, so neither can ever drift away from the other again.
    const display = css.match(/\.retro-title,\s*\.retro-heading,\s*\.risiko-statement \{[\s\S]*?font-size:\s*(\d+(?:\.\d+)?)px/) ?? [];
    expect(Number(display[1]), "the big question's size is gone").toBeGreaterThan(0);
    expect(statement, "the statement sets a size of its own again").not.toMatch(/font-size:/);
  });
  test("is no longer dressed in the body-copy class", () => {
    expect(slide, "a statement still carries the body-copy class")
      .not.toMatch(/className="risiko-statement[^"]*retro-body-copy/);
  });
  test("puts one statement on a card by default", () => {
    expect(RISIKO_PER_PAGE).toBe(1);
    expect(risikoPages([]).every((p) => p.statements.length === 1)).toBe(true);
  });
});

describe("the slider stands with the same breath above and below", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
  const screen = (css.match(/@media screen \{[\s\S]*?\n\}/g) ?? [])
    .find((block) => block.includes(".risiko-scale-field")) ?? "";
  test("the scale keeps its own height and the room around it is split evenly", () => {
    expect(screen, "the field no longer stands at its own height")
      .toMatch(/\.risiko-scale-field \{ flex: 0 0 var\(--risiko-field-h\); \}/);
    expect(screen, "the scale no longer centres itself between the text and the buttons")
      .toMatch(/\.risiko-scale-core \{ flex: 0 1 auto; margin-block: auto; \}/);
  });
  test("the measured shift moves the scale and the work-split card's own area, on screen only", () => {
    expect(screen, "the scale no longer takes the measured shift").toMatch(
      /\.screen-only :is\(\.risiko-scale-core\)[^;]*transform: translateY\(var\(--risiko-centre-shift/,
    );
    // The work-split block fills its scroll area exactly, so moving the block would
    // slide it out of the area's own clip and slice the partners' names: the area
    // carries the shift instead, so its clip edge travels with the block inside it.
    expect(screen, "the work-split card no longer takes the measured shift").toMatch(
      /\.risiko-scale-area--work[^;]*transform: translateY\(var\(--risiko-centre-shift/,
    );
    expect(screen, "the block inside the clip is moved again — that is what sliced the names")
      .not.toMatch(/\.risiko-allocation\)[^;]*risiko-centre-shift/);
    expect(slide, "the area carries the shift class on a card that has no work split")
      .toMatch(/page\.statements\.length === 0 \? " risiko-scale-area--work"/);
    expect(css, "the shift reaches the printed sheet").not.toMatch(/\.print-only[^;]*risiko-centre-shift/);
  });
  test("splits the room between the text above and the buttons below evenly", () => {
    const centre = slide.match(/const centre = \(\) => \{[\s\S]*?\n    \};/)?.[0] ?? "";
    expect(centre, "the centring measurement is gone").toBeTruthy();
    const maths = readFileSync(new URL("./risiko-centring.ts", import.meta.url), "utf8");
    // It is the scale's own block — rule, column names and the note riding under it —
    // that stands in the middle of the room, so the card's own middle is only ever
    // the aim on a card with no button row at all.
    expect(centre, "the scale's own block is no longer what gets centred")
      .toMatch(/blockTop: b\.top, blockHeight: b\.height/);
    expect(centre, "the room is no longer measured from the text above and the buttons below")
      .toMatch(/aboveBottom: above, footTop/);
    expect(maths, "the free room is no longer cut in half")
      .toMatch(/\(aboveBottom \+ footTop\) \/ 2 - \(blockTop \+ blockHeight \/ 2\)/);
    expect(maths, "the card's own middle is no longer the aim without a button row")
      .toMatch(/cardTop \+ cardHeight \/ 2 - \(ruleTop \+ ruleHeight \/ 2\)/);
    expect(maths, "the shift is no longer clamped to the room that is free")
      .toMatch(/Math\.min\(Math\.max\(need, -slackUp\), slackDown\)/);
    expect(centre, "the buttons are no longer the floor it stops at").toMatch(/\.risiko-footer/);
    expect(centre, "the text above is no longer the ceiling it stops at")
      .toMatch(/\.risiko-allocation-subheading[\s\S]*\.risiko-allocation-examples/);
    expect(slide, "a card that is not on screen is measured anyway").toMatch(/intersectionRatio >= 0\.9/);
  });
});

describe("the chapter card's own text", () => {
  const slide = readFileSync(new URL("./RisikoSlide.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  test("no longer stands as a big question above the card", () => {
    expect(slide, "the chapter still renders its own big question").not.toMatch(/risiko-chapter-heading/);
    expect(css, "the chapter heading's own type rule is still there").not.toMatch(/\.risiko-chapter-heading/);
  });
  test("leads the info sentence with its own words and carries the mood smiley inside them", () => {
    // The sentence now stands inside the card's info box on screen and keeps its
    // place straight under the card on paper; either way it opens with the
    // chapter's own words and the average-mood smiley rides inside them.
    const intro = slide.match(/const chapterIntro = [\s\S]*?\n {2}\);/)?.[0] ?? "";
    expect(intro, "the sentence no longer opens with the chapter's words").toMatch(
      /RISIKO_CHAPTER_OPEN[\s\S]*risiko-chapter-mood[\s\S]*RISIKO_CHAPTER_INFO/,
    );
    expect(slide, "the intro no longer reaches the card's info box").toMatch(/label=\{chapterIntro\(chapterMood, INK\)\}/);
    expect(slide, "the intro no longer reaches the printed card").toMatch(/<p className="risiko-chapter-info">\{chapterIntro\(chapterMood, FACE_GREY\)\}<\/p>/);
  });

});

describe("the statement's one size", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

  test("the statement reads as big as the deck's question", () => {
    const display = css.match(/\.retro-title,\s*\.retro-heading,\s*\.risiko-statement \{[^}]*\}/);
    expect(display, "the statement no longer shares the question's display rule").not.toBeNull();
    expect(display[0]).toMatch(/font-size:\s*38\.4px/);
    expect(display[0]).toMatch(/line-height:\s*1\.05/);
  });

  test("a phone steps the statement down, but not under the deck's floor", () => {
    const phone = css.match(/@media \(max-width: 767px\) \{\s*\.risiko-statement \{ font-size: (\d+)px; \}/);
    expect(phone, "a phone no longer sizes the statement").not.toBeNull();
    const size = Number(phone[1]);
    expect(size, "the phone size reads under the deck's smallest allowed size").toBeGreaterThanOrEqual(12);
    expect(size, "the phone size no longer fits the chapter's longest statement").toBeLessThan(38.4);
  });

  test("paper reads the statement together with the printed question", () => {
    const print = css.match(/\.retro-heading,\s*\.risiko-statement \{[^}]*font-size:\s*2rem/);
    expect(print, "the printed statement no longer shares the printed question's size").not.toBeNull();
  });
});



describe("the statement's line breaks", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  const rule = (css.match(/\.risiko-statement \{[^}]*\}/g) ?? []).find((block) =>
    block.includes("overflow-wrap"),
  );
  const question = css.match(/\.question-word \{[^}]*\}/)[0];

  // The same three declarations decide where a line may end, so comparing them
  // compares the two headlines' line breaks.
  const breaks = (block) => ({
    hyphens: block.match(/\n\s*hyphens:\s*([\w-]+)/)[1],
    webkitHyphens: block.match(/-webkit-hyphens:\s*([\w-]+)/)[1],
    overflowWrap: block.match(/overflow-wrap:\s*([\w-]+)/)[1],
  });

  test("breaks its lines exactly like the big question", () => {
    expect(breaks(rule)).toEqual(breaks(question));
  });

  test("hyphenates instead of breaking only at spaces", () => {
    expect(rule).toMatch(/\n\s*hyphens:\s*auto/);
    expect(rule).not.toMatch(/\n\s*hyphens:\s*manual/);
  });
});
