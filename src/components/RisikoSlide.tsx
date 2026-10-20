import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, scaleFaceGeometry, markerInset, workloadShares, workloadSegments, adjustWorkloadBoundary, RISIKO_ALLOCATION_HEADING, type RisikoPage } from "./risiko-data";

// Sadder than Frown: same circle-and-dot line style, a deeper downturn, inner
// brows pulled up and one tear — big enough and low enough to read at 24px.
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
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
    <path d="M7.5 7.9 L10 6.5 M14 6.5 L16.5 7.9" strokeWidth={1.3} />
    <path d="M16 17.9s-1.5-3.2-4-3.2S8 17.9 8 17.9" />
    <path d="M9 11.2C9 11.2 7.8 12.8 7.8 13.2a1.2 1.2 0 0 0 2.4 0C10.2 12.8 9 11.2 9 11.2z" fill={color ?? "currentColor"} stroke="none" />
  </svg>
);
export const FACES = [SadFace, Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header: one smiley at each end and three between them, spread
// across the row so the circle's travel lines up with every one of them.
const FACE_SIZE = 24;
const FACE_W = FACE_SIZE - 1; // rendered face box; the scale ends sit at its centre
// The draggable marker keeps its own, larger size: it has to read as the handle
// among the smaller scale faces and stay a comfortable thing to grab.
const MARKER_SIZE = 32;
const CAPTION_H = 12; // tiny end labels above the smileys
const HEADER_H = CAPTION_H + 4 + FACE_SIZE; // caption, its gap, then the smileys
// The rule carries the same line weight as the smileys' own strokes: lucide draws
// strokeWidth 1.5 inside a 24-unit box, so at FACE_SIZE that is 1.5px.
const RULE_W = (FACE_SIZE * 1.5) / 24;
// The circle stops half a face inside each end — exactly under the outer smileys —
// and moves freely between them, so it can rest on any value, not just a field.
const END_INSET = FACE_W / 2;
// Workload circles stay round at 32px, and every partner reserves a wider band
// (circle + room for its centred name), so names never reach into a neighbour's.
const SLOT = 32, BAND = 44;
const FACE_FILL = "var(--risiko-face-fill)";
// The knocked-out features: a fine mouth line, round eyes with some weight.
// The eyes stay lighter than a full disc so the brows keep their own space.
const MOUTH_W = 1;
const EYE_W = 2.4;

const Face = ({ Icon }: { Icon: (typeof FACES)[number] }) => (
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_W, height: FACE_W, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header relative flex items-center justify-between pointer-events-none shrink-0" style={{ height: FACE_SIZE }} aria-hidden="true">
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
  const { eyeY, brow, mouth, tear } = scaleFaceGeometry(value);
  const path = `M ${mouth.slice(0, 2).join(" ")} ${[2, 8, 14, 20].map(i => `C ${mouth.slice(i, i + 6).join(" ")}`).join(" ")} Z`;
  return (
    <svg width={MARKER_SIZE} height={MARKER_SIZE} viewBox="0 0 24 24" fill="none"
      stroke={FACE_FILL} strokeWidth={MOUTH_W} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M 9 ${eyeY} h .01 M 15 ${eyeY} h .01`} strokeWidth={EYE_W} />
      <path d="M9 11.2C9 11.2 7.8 12.8 7.8 13.2a1.2 1.2 0 0 0 2.4 0C10.2 12.8 9 11.2 9 11.2z"
        fill={FACE_FILL} stroke="none" transform={`translate(9 11.2) scale(${tear}) translate(-9 -11.2)`} />
      // The marker's eyes are drawn heavier than the small scale faces, so its
      // brows sit higher: they must keep a clear gap above the eye dots.
      <path d={`M 7.5 ${9 - brow * 2.4} L 10 ${9 - brow * 3.8} M 14 ${9 - brow * 3.8} L 16.5 ${9 - brow * 2.4}`} strokeWidth={MOUTH_W * brow} />
      <path d={path} />
    </svg>
  );
};

const ExpressionPoint = ({ value, active, shown }: { value: number; active: boolean; shown: boolean }) => {
  const expression = scaleExpression(value);
  return (
    <span className={`risiko-expression-point ${shown ? "is-shown" : ""} ${active ? "is-dragging" : ""}`} data-expression={expression} aria-hidden="true">
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

  // Each statement is its own compact block: quote, smileys and a scale.
  const scale = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="risiko-block relative flex flex-col w-full shrink-0">
      <h2 className="risiko-statement retro-body-copy shrink-0" lang="de">{`\u201E${text}\u201C`}</h2>
      <div className="relative flex flex-col w-full gap-1">
        <div className="risiko-scale-caption pointer-events-none flex justify-between" style={{ height: CAPTION_H }}>
          <span>Stimme gar nicht zu</span>
          <span>Stimme voll zu</span>
        </div>
        <FaceLayer />
        {/* One dashed guideline under each smiley, running the height of the
            circle's row, so a free position still reads against a face. */}
        <div className="risiko-columns absolute pointer-events-none flex justify-between" style={{ left: 0, right: 0, top: HEADER_H, bottom: 0 }} aria-hidden="true">
          {FACES.map((_, i) => <span key={i} className="risiko-column h-full flex justify-center" style={{ width: FACE_W }}><span className="risiko-column-line h-full" /></span>)}
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
    return (
      <div className="flex flex-1 min-h-0 flex-col justify-center gap-1">
        <div className="workload-lane relative w-full h-[60px] shrink-0" style={{ background: "var(--risiko-label-bg)" }}>
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
            // Every partner reserves a band: its circle plus room for its name. Adjacent
            // circles therefore never touch, and a name can sit centred under its own
            // circle without ever reaching into the neighbour's band.
            const band = `min(${BAND}px, calc(100cqw / ${partners.length} * 1.4))`;
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
        <ActionRow className="risiko-helper" icon="IconInfo" label={page.personKeys.length ? "Verändere die Anteile indem du eure Emojis nach links oder rechts ziehst" : "Platziere den Kreis indem du ihn nach links oder rechts ziehst"} accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
      </div>
    </div>
  );
};

export default RisikoSlide;
