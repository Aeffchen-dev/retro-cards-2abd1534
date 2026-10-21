import React, { useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, scaleFaceGeometry, columnBands, columnEdges, workloadShares, workloadSegments, adjustWorkloadBoundary, workloadBand, CRYING_MOUTH, mouthPath, RISIKO_ALLOCATION_HEADING, allocationExamplesSentence, SCALE_CAPTIONS, softHyphenate, captionLines, RISIKO_STATEMENTS, RISIKO_CHAPTER_OPEN, RISIKO_CHAPTER_INFO, averageMood, moodFaceIndex, type RisikoPage } from "./risiko-data";


// The saddest face on the scale, drawn in the same language as the faces next to
// it: the same round-dot eyes, no brows and the laughing mouth flipped into an
// open downturn — its downturn alone carries the sadness.
export const SadFace = ({ size = 24, strokeWidth = 1.5, color }: { size?: number; strokeWidth?: number; color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color ?? "currentColor"}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01 M15 9h.01" />
    <path d={mouthPath(CRYING_MOUTH)} />
  </svg>
);
export const FACES = [SadFace, Frown, Meh, Smile, Laugh];
// The faces sit a shade lighter than the dashed guides and column names they are
// drawn over, so the smileys read as the softest thing on the scale.
export const FACE_GREY = "#8A8C94";
// Shared smiley header: one smiley at each end and three between them, spread
// across the row so the circle's travel lines up with every one of them.
const FACE_SIZE = 28;
// The face's own box is the --risiko-face-size token in index.css: phones and the
// printed sheet keep the full 28px, tablet and desktop draw it a size smaller.
// FACE_SIZE itself stays as the icon's intrinsic size and as the height of the row
// the faces are centred in, so the guides and the circle's travel never move.
// The draggable marker keeps its own, larger size: it has to read as the handle
// among the smaller scale faces and stay a comfortable thing to grab.
const MARKER_SIZE = 32;
// The rule is exactly as thick as the work-split bar (h-1), so both scales read
// as the same line — clearly stronger than the fine dashed guides, and it never
// touches the grey smileys' own stroke weight.
const RULE_W = 4;
// The rule's row is this tall; it mirrors --risiko-track-h in index.css.
const TRACK_H = 56;
// The space a statement keeps above the scale, mirroring --risiko-statement-gap:
// the smiley row centres itself on it (see .risiko-face-header in index.css), so
// the row's own height has to be counted in when the fields are given a floor.
const STATEMENT_GAP = 12;
// The fields stretch to fill whatever height the card has left over, but never so
// far that the smiley row — which stands midway between the statement above and
// the rule below — is squeezed into the circle sitting on that rule.
const FIELD_MIN = 4 * (2 + FACE_SIZE / 2 - STATEMENT_GAP / 2 + MARKER_SIZE / 2);

// Equal columns share the scale's full width; each smiley (and its dashed
// guide) sits in the middle of its own column, and the circle's travel runs
// from the first smiley's centre to the last one's, so the handle always rests
// under a face at both ends and is never cut off.
const COLUMN_W = 100 / FACES.length;
const facePct = (i: number) => (i + 0.5) * COLUMN_W;
const facePos = (i: number) => `${facePct(i)}%`;
/** CSS left for the circle at a slider value: 0 under the first smiley, 100 under the last. */
const markerLeft = (value: number) => `calc(${facePct(0)}% + ${value} * (100% - ${2 * facePct(0)}%) / 100)`;
// Workload circles stay round at 32px, and every partner reserves exactly one
// circle-width band — neighbouring dots touch with no margin between them, and
// the band may never grow past the share of the lane each partner can use.
const SLOT = 32, BAND = SLOT;
const FACE_FILL = "var(--risiko-face-fill)";
// The knocked-out features: a fine mouth line, round eyes with some weight.
// The eyes stay heavier than the small scale faces, but keep the same shape.
const MOUTH_W = 1;
const EYE_W = 2.4;

const Face = ({ Icon }: { Icon: (typeof FACES)[number] }) => (
  // No plate behind the face: it sits straight on its column's fill, which is
  // only a shade off the card's white, so the smiley reads as being inside it.
  // The box comes from --risiko-face-size (index.css) so the face can be a size
  // smaller on tablet and desktop without moving anything else on the scale.
  <span className="risiko-face flex items-center justify-center">
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header absolute left-0 right-0 pointer-events-none flex items-center justify-between box-border" aria-hidden="true">
    {FACES.map((F, i) => <span key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex" style={{ left: facePos(i) }}><Face Icon={F} /></span>)}
  </div>
);

interface Person { key: string; name: string; emoji: string }
interface RisikoSlideProps {
  page: RisikoPage;
  persons: Person[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onWorkloadChange: (shares: Record<string, number>) => void;
  pill: string;
  onEdit: () => void;
  /** Called when this card's statements do not fit its own height. */
  onOverflow?: () => void;
}


const INK = "var(--retro-black)";
// White drag hints inside the untouched dot: it can be pulled left or right.
// Drawn smaller than the dot itself so the circle, not the hint, reads as the handle.
const ARROW_SIZE = 20;
const ARROW_W = 1.15;

// Morph the features through all five header expressions, keeping the disc fixed.
const MorphFace = ({ value }: { value: number }) => {
  const { eye, eyeW, brow, mouth } = scaleFaceGeometry(value);
  // Open stroke, no fill: the mouth is the very same curve the happy faces
  // draw, only flipped — one clean trace, exactly like the header smileys.
  const path = mouthPath(mouth);
  return (
    <svg width={MARKER_SIZE} height={MARKER_SIZE} viewBox="0 0 24 24" fill="none"
      stroke={FACE_FILL} strokeWidth={MOUTH_W} strokeLinecap="round" strokeLinejoin="round">
      {/* One eye is a single stroke: a round dot at every anchor on this scale,
          the same stroke the small smileys draw — only heavier inside the disc. */}
      <path d={`M ${eye[0]} ${eye[1]} L ${eye[2]} ${eye[3]} M ${eye[4]} ${eye[5]} L ${eye[6]} ${eye[7]}`} strokeWidth={eyeW * (EYE_W / 1.5)} />
      // The marker's eyes are drawn heavier than the small scale faces, so its
      // brows sit higher: they must keep a clear gap above the eye dots.
      <path d={`M 7.5 ${9 - brow * 2.4} L 10 ${9 - brow * 3.8} M 14 ${9 - brow * 3.8} L 16.5 ${9 - brow * 2.4}`} strokeWidth={MOUTH_W * brow} />
      <path d={path} />
    </svg>
  );
};

const ExpressionPoint = ({ value, active, shown }: { value: number; active: boolean; shown: boolean }) => {
  const expression = scaleExpression(value);
  const pointRef = useRef<HTMLSpanElement>(null);
  const [hintReady, setHintReady] = useState(false);
  React.useEffect(() => {
    const point = pointRef.current;
    if (!point || shown) return;
    // The deck keeps offscreen cards mounted: wait until this circle is visible
    // before playing the one-shot hint. Never move the answer or its outer disc.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.9) return;
      setHintReady(true);
      observer.disconnect();
    }, { threshold: 0.9 });
    observer.observe(point);
    return () => observer.disconnect();
  }, [shown]);
  return (
    <span ref={pointRef} className={`risiko-expression-point ${shown ? "is-shown" : ""} ${active ? "is-dragging" : ""} ${hintReady ? "has-navigation-hint" : ""}`} data-expression={expression} aria-hidden="true">
      <span className="risiko-plain-dot">
        <svg width={ARROW_SIZE} height={ARROW_SIZE} viewBox="0 0 24 24" fill="none"
          stroke={FACE_FILL} strokeWidth={ARROW_W} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 8 L6 12 L10 16 M14 8 L18 12 L14 16 M8 12 L16 12" />
        </svg>
      </span>
      <span className="risiko-drag-face">
        <MorphFace value={value} />
      </span>
    </span>
  );
};

const Track = ({ value, readOnly, onChange, ariaLabel, thumb, hasValue }: {
  value: number; readOnly: boolean; onChange: (v: number) => void; ariaLabel: string; thumb?: React.ReactNode; hasValue?: boolean;
}) => {
  const [dragging, setDragging] = useState(false);
  // The face appears on the first drag and stays there; a cleared answer drops back to the dot.
  const [touched, setTouched] = useState(!!hasValue);
  React.useEffect(() => { if (!hasValue) setTouched(false); }, [hasValue]);
  const shown = touched || !!hasValue;
  const marker = thumb ?? <ExpressionPoint value={value} active={dragging && !readOnly} shown={shown} />;
  return (
  <div className="risiko-track relative w-full shrink-0">
    {/* The rule spans the full card width; only the circle's travel is inset. Its
        ends are rounded off, so the line finishes soft instead of cut square. */}
    <div className="absolute top-1/2 -translate-y-1/2" style={{ background: INK, left: 0, right: 0, height: RULE_W, borderRadius: RULE_W / 2 }} />
    {readOnly ? (
    <div className="risiko-marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: markerLeft(value) }}>
        {marker}
      </div>
    ) : (
      <>
        <SliderPrimitive.Root
          className="swiper-no-swiping absolute flex items-center touch-none select-none z-10 cursor-ew-resize"
          style={{ left: `${facePct(0)}%`, right: `${facePct(0)}%`, top: 0, bottom: 0 }}
          value={[value]} min={0} max={100} step={1}
          onPointerDown={() => { setDragging(true); setTouched(true); }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onLostPointerCapture={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          onKeyUp={() => setDragging(false)}
          onValueChange={([v]) => { if (v !== undefined) onChange(v); }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) { setDragging(true); setTouched(true); }
          }}
        >
          {/* The whole row is the hit area, so a click above or below the rule
              puts the circle at that spot; the thumb stays invisible behind it. */}
          <SliderPrimitive.Track className="relative w-full h-full" />
          {/* The thumb is sized like the circle itself, so Radix's travel maths
              — root minus thumb — matches the drawn marker's edge-to-edge trip. */}
          <SliderPrimitive.Thumb aria-label={ariaLabel} className="risiko-thumb rounded-full" style={{ width: MARKER_SIZE, height: MARKER_SIZE }} />
        </SliderPrimitive.Root>
        <div className="risiko-marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: markerLeft(value) }}>
          {marker}
        </div>
      </>
    )}
  </div>
  );
};

const RisikoSlide = ({ page, persons, values, onChange, onWorkloadChange, pill, onEdit, onOverflow }: RisikoSlideProps) => {
  // A card whose statements are taller than the card itself asks the deck for
  // fewer statements per card, so nothing is cut off at the card's lower edge.
  const areaRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const area = areaRef.current;
    if (!area || !onOverflow) return;
    const check = () => { if (area.scrollHeight > area.clientHeight + 2) onOverflow(); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [onOverflow, page]);

  // The slider is centred on the card: the row around the scale splits its free
  // space evenly, but the statement above and the buttons below are not equally
  // tall, so that space's mid-point sits a little off the card's own middle. The
  // shift below closes exactly that gap — and never further than the room between
  // the text above and the buttons below, so a crowded card (the chapter's heading
  // and intro) stops short instead of covering anything.
  const pageRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;
    const visible = (sel: string) => Array.from(pageEl.querySelectorAll<HTMLElement>(sel))
      .find((el) => el.offsetParent !== null);
    // The deck keeps every card mounted and pushes the neighbours aside, scaled
    // and tilted: their boxes on screen are not their real ones, so only the card
    // the reader is actually looking at is ever measured.
    const shown = { current: false };
    const centre = () => {
      pageEl.style.setProperty("--risiko-centre-shift", "0px");
      if (!shown.current) return;
      // A statement card moves its scale, the work-split card its lane.
      const core = visible(".risiko-scale-core");
      const lane = visible(".workload-lane");
      const mover = core ?? visible(".risiko-allocation");
      const pivot = core ? core.querySelector<HTMLElement>(".risiko-track") : visible(".workload-bar");
      const box = core ?? lane;
      if (!mover || !pivot || !box) return;
      const card = pageEl.getBoundingClientRect();
      const rule = pivot.getBoundingClientRect();
      const need = card.y + card.height / 2 - (rule.y + rule.height / 2);
      const above = Math.max(...[".risiko-statement", ".risiko-allocation-examples", ".risiko-chapter"]
        .map((sel) => pageEl.querySelector<HTMLElement>(sel)?.getBoundingClientRect().bottom ?? 0));
      const footTop = pageEl.querySelector<HTMLElement>(".risiko-footer")?.getBoundingClientRect().top;
      const b = box.getBoundingClientRect();
      const slackUp = b.top - above - 8;
      const slackDown = footTop === undefined ? 0 : footTop - b.bottom - 8;
      const shift = Math.min(Math.max(need, -slackUp), slackDown);
      pageEl.style.setProperty("--risiko-centre-shift", `${Math.round(shift)}px`);
    };
    // The deck's own transform settles a beat after a card arrives: until then the
    // card's box is still tilted and its middle is not the one the reader sees. So
    // the shift is read on every frame the card is still moving, and once more when
    // it stops — the last reading is the one taken on a flat card.
    const moving = () => {
      const r = pageEl.getBoundingClientRect();
      return `${r.x.toFixed(1)}|${r.width.toFixed(1)}|${r.height.toFixed(1)}`;
    };
    let frame = 0, seen = "", frames = 0;
    const settle = () => {
      const now = moving();
      centre();
      if (now !== seen && frames++ < 240) { seen = now; frame = requestAnimationFrame(settle); }
    };
    const remeasure = () => {
      cancelAnimationFrame(frame);
      seen = ""; frames = 0;
      frame = requestAnimationFrame(settle);
    };
    const io = new IntersectionObserver(([entry]) => {
      shown.current = !!entry && entry.isIntersecting && entry.intersectionRatio >= 0.9;
      if (shown.current) remeasure();
    }, { threshold: 0.9 });
    io.observe(pageEl);
    // A taller statement, a wrapped helper or the keyboard opening all move the
    // card's middle, so the scale is re-centred whenever one of them changes.
    const ro = new ResizeObserver(remeasure);
    [".risiko-statement", ".risiko-allocation-examples", ".risiko-chapter", ".risiko-footer", ".risiko-scale-area"]
      .forEach((sel) => { const el = pageEl.querySelector(sel); if (el) ro.observe(el); });
    window.addEventListener("resize", remeasure);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [page, persons]);





  // Which partner a press on the work-split bar picked up: the bar keeps dragging
  // that one until the pointer is lifted, wherever on the bar the press landed.
  const workloadDrag = useRef<{ index: number } | null>(null);

  // A press inside the field — anywhere above the rule — picks the circle up and
  // keeps dragging it, so the whole grey band is the handle and not only the
  // rule's row. The value is read with the slider's own maths, so both ways of
  // grabbing land the circle exactly under the pointer.
  const fieldDrag = useRef<HTMLDivElement | null>(null);
  const fieldValueAt = (el: HTMLElement, clientX: number) => {
    const box = el.getBoundingClientRect();
    const from = (box.width * facePct(0)) / 100;
    const travel = (box.width * (100 - 2 * facePct(0))) / 100;
    if (travel <= 0) return null;
    return Math.min(100, Math.max(0, ((clientX - box.left - from) / travel) * 100));
  };
  const grabField = (key: string, readOnly: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    // Only the dot itself stays with the slider, so its own drag and keyboard keep working.
    // Everywhere else in the field — the rule's outer ends included, which the slider's own
    // track does not reach — a press places the dot, so the whole line is a tap target.
    if (readOnly || (e.target as HTMLElement).closest(".risiko-thumb")) return;
    const v = fieldValueAt(e.currentTarget, e.clientX);
    if (v === null) return;
    fieldDrag.current = e.currentTarget;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(key, String(Math.round(v)));
  };
  const dragField = (key: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!fieldDrag.current) return;
    const v = fieldValueAt(e.currentTarget, e.clientX);
    if (v !== null) onChange(key, String(Math.round(v)));
  };
  const releaseField = () => { fieldDrag.current = null; };

  // Each statement is its own compact block: quote, smileys and a scale.
  const scale = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="risiko-block relative flex flex-col w-full grow shrink-0">
      <h2 className="risiko-statement shrink-0" lang="de">{`\u201E${text}\u201C`}</h2>
      <div className="risiko-scale-row relative flex flex-col w-full box-border grow shrink-0">

        {/* The field carries the drawn scale — columns, smileys, rule and circle —
            and the names stand under it in their own row. The dashed lines then end
            exactly where the names begin, on any width and on paper, with no band
            height to guess per device. */}
        <div className="risiko-scale-core relative flex flex-col w-full box-border flex-1 min-h-0 touch-pan-y swiper-no-swiping"
          onPointerDown={grabField(key, readOnly)} onPointerMove={dragField(key)}
          onPointerUp={releaseField} onPointerCancel={releaseField} onLostPointerCapture={releaseField}>
          <div className="risiko-scale-field relative flex-1 min-w-0 min-h-0 flex flex-col justify-center box-border" style={{ minHeight: FIELD_MIN }}>
            {/* Columns: no fill at all — the five fields are drawn only as dashed
                grey lines, one between every pair of neighbouring columns, with
                the scale's own left and right edge left bare. They break around the smiley row
                exactly like the smileys' own stronger guides, so every dashed line
                on the field starts and ends at the same heights. Painted before
                everything else, so a line never covers a smiley, a guide or the
                handle. */}
            <div className="risiko-columns absolute pointer-events-none" style={{ left: 0, right: 0, top: 0, bottom: 0 }} aria-hidden="true">
              {columnEdges(FACES.length).flatMap((at) => ([
                <span key={`es${at}`} className="risiko-column-edge risiko-column-guide--stub absolute" style={{ left: `clamp(0px, ${at}%, calc(100% - 1px))` }} />,
                <span key={`el${at}`} className="risiko-column-edge risiko-column-guide--long absolute" style={{ left: `clamp(0px, ${at}%, calc(100% - 1px))` }} />,
              ]))}
            </div>
            {/* Each smiley's column carries its dashed guide down the field's whole
                height — a stub above the face, then a long run from straight under it
                to the field's foot — so the smiley reads as threaded onto its own line
                instead of having the line drawn through it. Painted before the faces
                and the circle, so both simply stand in front of the line. */}
            <div className="risiko-scale-guides absolute left-0 right-0 pointer-events-none" style={{ top: 0, bottom: 0 }} aria-hidden="true">
              {FACES.map((_, i) => <span key={`gu${i}`} className="risiko-column-guide risiko-column-guide--stub absolute" style={{ left: facePos(i) }} />)}
              {FACES.map((_, i) => <span key={`gl${i}`} className="risiko-column-guide risiko-column-guide--long absolute" style={{ left: facePos(i) }} />)}
            </div>
            {/* The smileys sit flush with the field's top edge, while the rule
                and the circle centre on the long dashed line under them. */}
            <FaceLayer />
            <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text} hasValue={values[key] !== undefined}
              onChange={(v) => onChange(key, String(v))} />
          </div>
          {/* Every column names itself: one label per field, centred on that field and
              resting at its foot, so the circle always sits above the word it points
              at. The row takes exactly the height the names need. */}
          <div className="risiko-scale-captions pointer-events-none" lang="de">
            {SCALE_CAPTIONS.map((caption, i) => (
              <span key={i} className="risiko-scale-caption">{captionLines(caption).map((line, j, all) => (
                <span key={j} className="risiko-caption-line">{softHyphenate(line)}{j < all.length - 1 ? " " : ""}</span>
              ))}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Widths encode shares. Reserved avatar slots prevent collisions even at 0%.
  const allocation = (readOnly: boolean) => {
    const partners = persons.filter(p => page.personKeys.includes(p.key));
    const keys = partners.map(p => p.key);
  const shares = workloadShares(keys, values);
  const segments = workloadSegments(keys, shares);
  // The lane point a boundary sits at: the centre of the gap between the two
  // circles that meet there — the same maths the circles read, so the colours,
  // the black split line and the circles all agree at every split.
  // One number for width and height, so the avatar circle can never be
  // squeezed into an oval when the lane gets crowded.
  const band = workloadBand(SLOT, BAND, partners.length);
  const slotPx = `${SLOT}px`;
  const splitAt = (i: number) => {
    const li = i ? `calc(${band} * ${i})` : "0px";
    const ri = `calc(${band} * ${partners.length - 1 - i})`;
    return `calc(${li} + ${slotPx} + (100cqw - ${li} - ${ri} - ${slotPx}) * ${segments[i].end} / 100)`;
  };
  // Each colour runs from the boundary behind it to its own boundary, so the
  // colour change always lands exactly where the circles part.
  const segmentWidth = (i: number) => {
    if (partners.length <= 1) return "100cqw";
    if (i === 0) return splitAt(0);
    if (i === segments.length - 1) return `calc(100cqw - ${splitAt(i - 1)})`;
    return `calc(${splitAt(i)} - ${splitAt(i - 1)})`;
  };
  // A name may only use the room its own colour run really has: that run's width
  // less the two circles marking its ends, and never more than the lane's edges
  // leave on either side. A longer name takes a second line rather than running
  // over a neighbour's circle or off the card.
  const labelCap = (i: number) => {
    const f = segments[i].width / 100;
    const cf = (segments[i].start + segments[i].end) / 200;
    const room = `calc(100cqw * ${f.toFixed(4)} - 32px)`;
    const left = `calc(100cqw * ${(cf * 2).toFixed(4)})`;
    const right = `calc(100cqw * ${((1 - cf) * 2).toFixed(4)})`;
    return `min(max(60px, ${room}), ${left}, ${right})`;
  };
  // A colour run belongs to exactly one partner, so the name printed above the
  // rule and the share printed below it can both be read off that one colour.
  // A name that already ends in an s takes only the apostrophe — German never
  // doubles it ("Max’ Anteil") — so a name like "Name deines Partners" or "Niklas"
  // is never printed with a stutter.
  const shareLabel = (key: string) => {
    const name = partners.find(p => p.key === key)?.name ?? "";
    return /s$/i.test(name.trim()) ? `${name}’ Anteil:` : `${name}’s Anteil:`;
  };
  // Where the pointer sits on one partner's scale, and how far that partner's
  // circle is from it — the same maths picks who gets grabbed and how far the
  // grab has travelled since.
  const readingFor = (root: HTMLElement, lane: DOMRect, x: number) => {
    const thumb = root.querySelector<HTMLElement>(".risiko-thumb");
    if (!thumb) return null;
    const box = root.getBoundingClientRect();
    const dot = thumb.getBoundingClientRect();
    const travel = box.width - dot.width;
    if (travel <= 0) return null;
    const from = box.left - lane.left + dot.width / 2;
    const centre = from + (travel * Number(root.dataset.value)) / 100;
    return {
      index: Number(root.dataset.boundary), gap: Math.abs(centre - x),
      value: Math.min(100, Math.max(0, ((x - from) / travel) * 100)),
    };
  };
  // The circle nearest the pointer, or one particular circle while it is held.
  const readingAt = (laneEl: HTMLElement, clientX: number, held?: number) => {
    const lane = laneEl.getBoundingClientRect();
    if (!lane.width) return null;
    const x = clientX - lane.left;
    let best: { index: number; value: number; gap: number } | null = null;
    for (const root of laneEl.querySelectorAll<HTMLElement>("[data-boundary]")) {
      if (held !== undefined && Number(root.dataset.boundary) !== held) continue;
      const r = readingFor(root, lane, x);
      if (r && (held !== undefined || !best || r.gap < best.gap)) best = r;
    }
    return best;
  };
  // Pressing anywhere on the bar picks up the nearest circle and keeps dragging
  // it, so the bar works as one handle and not only where a circle sits. A press
  // on a circle itself is left to that circle.
  const grabBar = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".risiko-thumb")) return;
    const r = readingAt(e.currentTarget, e.clientX);
    if (!r) return;
    workloadDrag.current = { index: r.index };
    e.currentTarget.setPointerCapture(e.pointerId);
    onWorkloadChange(adjustWorkloadBoundary(keys, shares, r.index, r.value));
  };
  const dragBar = (e: React.PointerEvent<HTMLDivElement>) => {
    const held = workloadDrag.current;
    if (!held) return;
    const r = readingAt(e.currentTarget, e.clientX, held.index);
    if (r) onWorkloadChange(adjustWorkloadBoundary(keys, shares, held.index, r.value));
  };
  const releaseBar = () => { workloadDrag.current = null; };
  return (
    <div className="risiko-allocation flex flex-1 min-h-0 flex-col justify-center gap-1">
      <div className="workload-lane relative w-full shrink-0 touch-none select-none swiper-no-swiping"
        style={{ background: "var(--risiko-label-bg)" }}
        onPointerDown={readOnly ? undefined : grabBar}
        onPointerMove={readOnly ? undefined : dragBar}
        onPointerUp={releaseBar} onPointerCancel={releaseBar} onLostPointerCapture={releaseBar}>
          {/* The work split is read on the same grid as the statements: no fill,
              only the dashed grey lines between every pair of neighbouring
              columns, the scale's own edges left bare. They stop above the quiet
              strip at the lane's foot, and the bar, the circles and the names and
              share figures printed on it all paint on top. */}
          <div className="risiko-columns absolute left-0 right-0 top-0 pointer-events-none"
            style={{ bottom: "var(--risiko-name-strip)" }} aria-hidden="true">
            {columnEdges(FACES.length).map((at) => (
              <span key={`c${at}`} className="risiko-column-edge absolute top-0 bottom-0"
                style={{ left: `clamp(0px, ${at}%, calc(100% - 1px))` }} />
            ))}
          </div>
          <div className="risiko-scale-guides absolute left-0 right-0 top-0 pointer-events-none"
            style={{ bottom: "var(--risiko-name-strip)" }} aria-hidden="true">
            {FACES.map((_, i) => (
              <span key={`gu${i}`} className="risiko-column-guide absolute" style={{ left: facePos(i), top: 0, bottom: 0 }} />
            ))}
          </div>
          {/* Every colour run carries its partner's name just above the rule and
              that partner's share just below it, so a name and its number always
              stand on the same colour and never drift onto a neighbour's run. */}
          <div className="workload-bar" aria-hidden="true">
            {segments.map((segment, i) => (
              <span key={segment.key} className={`workload-segment workload-color-${i % 8} relative${i ? " workload-segment-gap" : ""}`} style={{ width: segmentWidth(i), "--workload-label-cap": labelCap(i) } as React.CSSProperties}>
                <span className="workload-label">{shareLabel(segment.key)}</span>
                <span className="workload-percentage">{shares[segment.key]}%</span>
              </span>
            ))}
          </div>
          {/* Each boundary carries its own solid ink line: not dashed like the grey
              guides, but standing exactly as tall as they do — from the lane's top
              edge down to the names' strip — and centred in the 4px gap the two
              circles part to either side of it. Painted after the bar, so the line
              reads over the colours; the circles draw above it. */}
          <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ bottom: "var(--risiko-name-strip)" }} aria-hidden="true">
            {segments.slice(0, -1).map((segment, i) => (
              <span key={`bl${i}`} className="workload-boundary absolute" style={{ left: splitAt(i) }} />
            ))}
          </div>
          {partners.map((p, i) => {
            const boundaryIndex = Math.min(i, partners.length - 2);
            const segment = segments[boundaryIndex];
            const value = segment?.end ?? 100;
            const min = segment?.start ?? 0;
            const max = segments[boundaryIndex + 1]?.end ?? 100;
            // One number for width and height, so the avatar circle can never be
            // squeezed into an oval when the lane gets crowded.
            const slot = `min(${SLOT}px, calc(100cqw / ${partners.length}))`;
            // Every partner reserves exactly one band: its circle plus room for its
            // centred name — adjacent circles sit exactly one band apart, and each
            // circle steps 2px away from the boundary it marks, so neighbouring
            // circles keep a 4px gap between them. The band may never grow past the
            // share of the lane each partner can actually use, or the circles would
            // run out of room to move.
            const li = `calc(${band} * ${i})`;
            const ri = `calc(${band} * ${partners.length - i - 1})`;
            const vars = {
              "--workload-li": li, "--workload-ri": ri, "--workload-slot": slot,
              "--workload-v": String(value), "--workload-band": band,
              // The circle's 2px step away from its own boundary: every circle but
              // the last sits just left of the boundary it rides, the last one just
              // right of it — together they open the 4px gap the split line centres in.
              "--workload-shift": i < partners.length - 1 ? "-2px" : "2px",
              "--workload-band": band,
            } as React.CSSProperties;
            const memojiEl = (
              <span className="risiko-memoji workload-avatar flex items-center justify-center w-full h-full overflow-hidden rounded-full text-lg leading-none" aria-hidden="true">{p.emoji}</span>
            );
            if (readOnly) {
              return (
                <div key={p.key} className={`absolute z-10 workload-color-${i % 8}`}
                  style={{ ...vars, width: slot, height: slot, top: "calc((100cqh - var(--risiko-name-strip) - var(--workload-slot, 32px)) / 2)", left: `calc(${li} + (100cqw - ${li} - ${ri} - ${slot}) * ${value} / 100 + var(--workload-shift, 0px))` }}>
                  {memojiEl}
                </div>
              );
            }
            return (
              <SliderPrimitive.Root key={p.key}
                className="swiper-no-swiping absolute flex items-center touch-none select-none z-10 pointer-events-none"
                style={{ ...vars, left: li, right: ri, top: 0, bottom: "var(--risiko-name-strip)" }}
                data-boundary={boundaryIndex} data-value={value}
                value={[value]} min={0} max={100} step={1}
                onValueChange={([v]) => { if (v !== undefined) onWorkloadChange(adjustWorkloadBoundary(keys, shares, boundaryIndex, v)); }}
                onKeyDown={(e) => {
                  // keep the arrow keys from paging the card deck
                  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) e.stopPropagation();
                }}>
                <SliderPrimitive.Track className="relative w-full h-px" />
                <SliderPrimitive.Thumb aria-label={`Beziehungsarbeit ${p.name}`} aria-valuetext={`${shares[p.key]} Prozent`} aria-valuemin={min} aria-valuemax={max}
                  className={`risiko-thumb cursor-ew-resize rounded-full pointer-events-auto workload-color-${i % 8}`}
                  style={{ width: slot, height: slot, transform: "translateX(var(--workload-shift, 0px))" } as React.CSSProperties}>
                  {memojiEl}
                </SliderPrimitive.Thumb>
              </SliderPrimitive.Root>
            );
          })}
        </div>
        {/* The split each column stands for, labelled in the same row, type and
            grey the statement scales name their columns with — one label per
            column, centred on it, in the couple's ratio with a colon and %. */}
        <div className="risiko-scale-captions pointer-events-none" aria-hidden="true">
          {FACES.map((_, i) => {
            const at = Math.round(columnBands(FACES.length).map(([a, b]) => (a + b) / 2)[i]);
            return <span key={`sp${i}`} className="risiko-scale-caption">{at}:{100 - at}%</span>;
          })}
        </div>
      </div>
    );
  };

  // Blocks share the free space evenly; the buttons sit below, never underneath.
  const body = (readOnly: boolean) => (
    <div className="risiko-body flex flex-col w-full flex-1 min-h-0 justify-evenly gap-6">
      {page.statements.map(([k, t]) => scale(k, t, readOnly))}
      {page.personKeys.length > 0 && allocation(readOnly)}
    </div>
  );

  // The chapter opens on the first card. It no longer stands as a big question
  // above the card — the user asked to "first test slide remove big question and
  // subline text move beginning of info text" — so its words open the intro
  // sentence instead, and the smiley the average of all the statements points at
  // rides inside that sentence once every slider has been dragged.
  const isChapterStart = page.statements[0]?.[0] === RISIKO_STATEMENTS[0][0];
  const chapterMood = averageMood(values);

  return (
    <div ref={pageRef} className="risiko-page flex flex-col items-start w-full h-full min-h-0" style={{ color: INK }}>
      {isChapterStart && (
        <div className="risiko-chapter shrink-0 w-full" lang="de">
          <p className="risiko-chapter-info">
            {RISIKO_CHAPTER_OPEN}
            {chapterMood !== null && (
              <span className="risiko-chapter-mood" aria-label={`Durchschnittliche Stimmung ${Math.round(chapterMood)} von 100`}>
                <Face Icon={FACES[moodFaceIndex(chapterMood)]} />
              </span>
            )}
            {". "}
            {RISIKO_CHAPTER_INFO}
          </p>
        </div>
      )}
      {page.statements.length === 0 && (
        <>
          <h2 className="risiko-statement risiko-allocation-statement shrink-0" lang="de">{RISIKO_ALLOCATION_HEADING}</h2>
          <p className="risiko-allocation-examples shrink-0" lang="de">{allocationExamplesSentence()}</p>
        </>
      )}
      <div ref={areaRef} className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 overflow-y-auto">
        <div className="screen-only w-full relative flex-1 min-h-0 flex flex-col">{body(false)}</div>
        <div className="hidden print-only w-full relative flex-1 min-h-0 flex flex-col">{body(true)}</div>
      </div>
      {/* The buttons keep the card's own padding below the rule; being outside the
          area, they leave its lower edge exactly on the rule for the guidelines. */}
      <div className="risiko-footer screen-only w-full shrink-0 flex flex-col items-start gap-2">
        <ActionRow icon="IconPencil" label="Macht Notizen" accent={pill} onClick={onEdit} />
        <ActionRow className="risiko-helper" icon="IconInfo" label={page.personKeys.length ? "Verändere die prozentuale Verteilung der Anteile indem du eure Emojis nach links oder rechts ziehst" : "Schiebt den schwarzen Kreis nach links und rechts um ihn entlang der Skala zu bewegen"} accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
      </div>
    </div>
  );
};

export default RisikoSlide;
