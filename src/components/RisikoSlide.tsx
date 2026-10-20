import React, { useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, scaleFaceGeometry, markerInset, scaleEndInset, guidePositions, workloadShares, workloadSegments, adjustWorkloadBoundary, workloadBand, CRYING_TEAR, RISIKO_ALLOCATION_HEADING, type RisikoPage } from "./risiko-data";

// The tear, shared by the scale's crying face and the dragged dot: one drop
// hanging from below the left eye, tip first so it shrinks back into the eye.
const TEAR_L = "M8.4 10.6C8.4 10.6 7.1 12.8 7.1 13.6a1.3 1.3 0 0 0 2.6 0C9.7 12.8 8.4 10.6 8.4 10.6z";

// The saddest face on the scale, drawn in the same language as the faces next to
// it: the same round-dot eyes, no brows and the same arc family — only a much
// deeper downturn and a single tear hanging under the left eye.
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
    <path d="M16 18.4s-1.5-4.6-4-4.6S8 18.4 8 18.4" />
    <path d={TEAR_L} fill={color ?? "currentColor"} stroke="none" transform={`translate(8.4 10.6) scale(${CRYING_TEAR}) translate(-8.4 -10.6)`} />
  </svg>
);
export const FACES = [SadFace, Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header: one smiley at each end and three between them, spread
// across the row so the circle's travel lines up with every one of them.
const FACE_SIZE = 21;
const FACE_W = FACE_SIZE - 1; // rendered face box; the scale ends sit at its centre
// The draggable marker keeps its own, larger size: it has to read as the handle
// among the smaller scale faces and stay a comfortable thing to grab.
const MARKER_SIZE = 32;
const CAPTION_H = 12; // tiny end labels above the smileys
const HEADER_H = CAPTION_H + 4 + FACE_SIZE; // caption, its gap, then the smileys
// A slightly stronger horizontal rule distinguishes the draggable slider from
// its fine dashed guides without changing the grey smileys' stroke weight.
const RULE_W = 2;
// The scale runs edge to edge across the container, so the circle's travel is
// inset by its own radius: at 0 and 100 its outer edge lands exactly on the
// container's edges — fully visible, never cut off, never overflowing.
const END_INSET = scaleEndInset(MARKER_SIZE);
// The smileys are pulled in by the difference between that inset and their own
// half-width, so every face centre sits exactly where the circle's centre does.
const FACE_PAD = END_INSET - FACE_W / 2;
// Guidelines sit under every smiley and midway between neighbours, at the value
// the circle itself would take there — the same inset maths keeps them aligned.
const GUIDES = guidePositions(FACES.length);
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
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_W, height: FACE_W, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header relative flex items-center justify-between pointer-events-none shrink-0 box-border" style={{ height: FACE_SIZE, paddingInline: FACE_PAD }} aria-hidden="true">
    {FACES.map((F, i) => <Face key={i} Icon={F} />)}
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
}

const INK = "var(--retro-black)";
// White drag hints inside the untouched dot: it can be pulled left or right.
// Drawn smaller than the dot itself so the circle, not the hint, reads as the handle.
const ARROW_SIZE = 20;
const ARROW_W = 1.4;

// Morph the features through all five header expressions, keeping the disc fixed.
const MorphFace = ({ value }: { value: number }) => {
  const { eye, eyeW, brow, mouth, tear } = scaleFaceGeometry(value);
  const path = `M ${mouth.slice(0, 2).join(" ")} ${[2, 8, 14, 20].map(i => `C ${mouth.slice(i, i + 6).join(" ")}`).join(" ")} Z`;
  return (
    <svg width={MARKER_SIZE} height={MARKER_SIZE} viewBox="0 0 24 24" fill="none"
      stroke={FACE_FILL} strokeWidth={MOUTH_W} strokeLinecap="round" strokeLinejoin="round">
      {/* One eye is a single stroke: a round dot at every anchor on this scale,
          the same stroke the small smileys draw — only heavier inside the disc. */}
      <path d={`M ${eye[0]} ${eye[1]} L ${eye[2]} ${eye[3]} M ${eye[4]} ${eye[5]} L ${eye[6]} ${eye[7]}`} strokeWidth={eyeW * (EYE_W / 1.5)} />
      <path d={TEAR_L} fill={FACE_FILL} stroke="none" transform={`translate(8.4 10.6) scale(${tear}) translate(-8.4 -10.6)`} />
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
    {/* The rule spans the full card width; only the circle's travel is inset. */}
    <div className="absolute top-1/2 -translate-y-1/2" style={{ background: INK, left: 0, right: 0, height: RULE_W }} />
    {readOnly ? (
      <div className="risiko-marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `calc(${value}% + ${markerInset(value, END_INSET)}px)` }}>
        {marker}
      </div>
    ) : (
      <>
        <SliderPrimitive.Root
          className="swiper-no-swiping absolute flex items-center touch-none select-none z-10 cursor-ew-resize"
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
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
          <SliderPrimitive.Thumb aria-label={ariaLabel} className="risiko-thumb rounded-full" style={{ width: FACE_W, height: FACE_W }} />
        </SliderPrimitive.Root>
        <div className="risiko-marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `calc(${value}% + ${markerInset(value, END_INSET)}px)` }}>
          {marker}
        </div>
      </>
    )}
  </div>
  );
};

const RisikoSlide = ({ page, persons, values, onChange, onWorkloadChange, pill, onEdit }: RisikoSlideProps) => {

  // Which partner a press on the work-split bar picked up: the bar keeps dragging
  // that one until the pointer is lifted, wherever on the bar the press landed.
  const workloadDrag = useRef<{ index: number } | null>(null);

  // Each statement is its own compact block: quote, smileys and a scale.
  const scale = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="risiko-block relative flex flex-col w-full shrink-0">
      <h2 className="risiko-statement retro-body-copy shrink-0" lang="de">{`\u201E${text}\u201C`}</h2>
      {/* The scale spans the container: the rule and the dashed guides run edge to
          edge, while the smileys and the tiny end labels sit flush with the
          circle's travel — inset by the circle's own radius at both ends. */}
      <div className="relative flex flex-col gap-1 box-border">
        <div className="risiko-scale-caption pointer-events-none flex justify-between box-border" style={{ height: CAPTION_H, paddingInline: FACE_PAD }}>
          <span>Stimme nicht zu</span>
          <span>Stimme voll zu</span>
        </div>
        <FaceLayer />
        {/* Dashed guidelines: one under each smiley and one midway between
            neighbours, running the height of the circle's row, so a free
            position still reads against a face. */}
        <div className="risiko-columns absolute pointer-events-none" style={{ left: 0, right: 0, top: HEADER_H, bottom: 0 }} aria-hidden="true">
          {GUIDES.map((p) => <span key={p} className="risiko-column-line absolute top-0 bottom-0 -translate-x-1/2" style={{ left: `calc(${p}% + ${markerInset(p, END_INSET)}px)` }} />)}
        </div>
        <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text} hasValue={values[key] !== undefined}
          onChange={(v) => onChange(key, String(v))} />
      </div>
    </div>
  );

  // Widths encode shares. Reserved avatar slots prevent collisions even at 0%.
  const allocation = (readOnly: boolean) => {
    const partners = persons.filter(p => page.personKeys.includes(p.key));
    const keys = partners.map(p => p.key);
    const shares = workloadShares(keys, values);
  const segments = workloadSegments(keys, shares);
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
    <div className="flex flex-1 min-h-0 flex-col justify-center gap-1">
      <div className="workload-lane relative w-full h-[60px] shrink-0 touch-none select-none swiper-no-swiping"
        style={{ background: "var(--risiko-label-bg)" }}
        onPointerDown={readOnly ? undefined : grabBar}
        onPointerMove={readOnly ? undefined : dragBar}
        onPointerUp={releaseBar} onPointerCancel={releaseBar} onLostPointerCapture={releaseBar}>
          <div className="absolute top-[18px] w-full h-1 flex" aria-hidden="true">
            {segments.map((segment, i) => (
              <span key={segment.key} className={`workload-segment workload-color-${i % 8} relative`} style={{ width: `${segment.width}%` }}>
                <span className="workload-percentage">{shares[segment.key]}%</span>
              </span>
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
            // centred name — adjacent circles sit exactly one band apart, touching
            // with no margin between them. The band may never grow past the share
            // of the lane each partner can actually use, or the circles would run
            // out of room to move.
            const band = workloadBand(SLOT, BAND, partners.length);
            const li = `calc(${band} * ${i})`;
            const ri = `calc(${band} * ${partners.length - i - 1})`;
            const vars = {
              "--workload-li": li, "--workload-ri": ri, "--workload-slot": slot,
              "--workload-v": String(value), "--workload-band": band,
            } as React.CSSProperties;
            const memojiEl = (
              <>
                <span className="risiko-memoji workload-avatar flex items-center justify-center w-full h-full overflow-hidden rounded-full text-lg leading-none" aria-hidden="true">{p.emoji}</span>
                <span className="workload-name" aria-hidden="true">{p.name}</span>
              </>
            );
            if (readOnly) {
              return (
                <div key={p.key} className={`absolute z-10 top-[4px] workload-color-${i % 8}`}
                  style={{ ...vars, width: slot, height: slot, left: `calc(${li} + (100cqw - ${li} - ${ri} - ${slot}) * ${value} / 100)` }}>
                  {memojiEl}
                </div>
              );
            }
            return (
              <SliderPrimitive.Root key={p.key}
                className="swiper-no-swiping absolute flex items-center touch-none select-none z-10 pointer-events-none"
                style={{ ...vars, left: li, right: ri, top: 0, bottom: 20 }}
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
                  style={{ width: slot, height: slot }}>
                  {memojiEl}
                </SliderPrimitive.Thumb>
              </SliderPrimitive.Root>
            );
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

  return (
    <div className="risiko-page flex flex-col items-start w-full h-full min-h-0" style={{ color: INK }}>
      {page.statements.length === 0 && <h2 className="risiko-statement retro-body-copy shrink-0" lang="de">{RISIKO_ALLOCATION_HEADING}</h2>}
      <div className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 overflow-y-auto">
        <div className="screen-only w-full relative flex-1 min-h-0 flex flex-col">{body(false)}</div>
        <div className="hidden print-only w-full relative flex-1 min-h-0 flex flex-col">{body(true)}</div>
      </div>
      {/* The buttons keep the card's own padding below the rule; being outside the
          area, they leave its lower edge exactly on the rule for the guidelines. */}
      <div className="risiko-footer screen-only w-full shrink-0 flex flex-col items-start gap-2">
        <ActionRow icon="IconPencil" label="Macht Notizen" accent={pill} onClick={onEdit} />
        <ActionRow className="risiko-helper" icon="IconInfo" label={page.personKeys.length ? "Verändere die Anteile indem du eure Emojis nach links oder rechts ziehst" : "Platziere den Kreis auf der Skala indem du ihn nach links oder rechts ziehst"} accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
      </div>
    </div>
  );
};

export default RisikoSlide;
