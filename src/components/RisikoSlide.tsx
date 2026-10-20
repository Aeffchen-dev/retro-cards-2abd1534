import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Button } from "@/components/ui/button";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, scaleFaceGeometry, workloadShares, workloadSegments, adjustWorkloadBoundary, type RisikoPage } from "./risiko-data";

// Sadder than Frown: same circle-and-dot line style, a deeper downturn and one tear.
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
    <path d="M16 17.6s-1.5-2.4-4-2.4S8 17.6 8 17.6" />
    <path d="M8.4 10.45c0 0-0.9 0.95-0.9 1.2a0.9 0.9 0 0 0 1.8 0c0-.45-0.9-1.2-0.9-1.2z" fill={color ?? "currentColor"} stroke="none" />
  </svg>
);
export const FACES = [Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header; every slider aligns with its four column centres.
const FACE_SIZE = 32;
const FACE_W = FACE_SIZE - 1; // rendered face box; scale ends line up with its centre
const CAPTION_H = 12; // tiny end labels above the smileys
const HEADER_H = CAPTION_H + 4 + FACE_SIZE; // caption, its gap, then the smileys
// The scale rule carries the same line weight as the smileys' own strokes:
// lucide draws strokeWidth 1.5 inside a 24-unit box, so at FACE_SIZE that is 2px.
const RULE_W = (FACE_SIZE * 1.5) / 24;
const FACE_FILL = "var(--risiko-face-fill)";
// The knocked-out features: a fine mouth line, round eyes with some weight.
const MOUTH_W = 1;
const EYE_W = 3;

const Face = ({ Icon }: { Icon: typeof Frown }) => (
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_W, height: FACE_W, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header relative flex items-center justify-between pointer-events-none shrink-0 h-8" aria-hidden="true">
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
// Radix clamps the thumb inside the track by half its own width, so a thumb as
// wide as a face puts the track ends exactly under the outer face centres.
const END_INSET = FACE_W / 2;
// White drag hints inside the untouched dot: it can be pulled left or right.
const ARROW_W = 1.6;

// Morph the eyes and mouth through all four header expressions.
const MorphFace = ({ value }: { value: number }) => {
  const { eyeY, brow, mouth } = scaleFaceGeometry(value);
  const path = `M ${mouth.slice(0, 2).join(" ")} ${[2, 8, 14, 20].map(i => `C ${mouth.slice(i, i + 6).join(" ")}`).join(" ")} Z`;
  return (
    <svg width={FACE_SIZE} height={FACE_SIZE} viewBox="0 0 24 24" fill="none"
      stroke={FACE_FILL} strokeWidth={MOUTH_W} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={INK} />
      <path d={`M 9 ${eyeY} h .01 M 15 ${eyeY} h .01`} strokeWidth={EYE_W} />
      <path d={`M 7.5 ${9 - brow} L 10 9 M 14 9 L 16.5 ${9 - brow}`} strokeWidth={MOUTH_W * brow} />
      <path d={path} />
    </svg>
  );
};

const ExpressionPoint = ({ value, active, shown }: { value: number; active: boolean; shown: boolean }) => {
  const expression = scaleExpression(value);
  return (
    <span className={`risiko-expression-point ${shown ? "is-shown" : ""} ${active ? "is-dragging" : ""}`} data-expression={expression} aria-hidden="true">
      <span className="risiko-plain-dot">
        <svg width={FACE_SIZE} height={FACE_SIZE} viewBox="0 0 24 24" fill="none"
          stroke={FACE_FILL} strokeWidth={ARROW_W} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 8 L6 12 L10 16 M14 8 L18 12 L14 16" />
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
  <div className="risiko-track relative w-full h-10 shrink-0">
    {/* The rule spans the full card width; only the dot travel is inset. */}
    <div className="absolute top-1/2 -translate-y-1/2" style={{ background: INK, left: 0, right: 0, height: RULE_W }} />
    {readOnly ? (
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: `calc(${value}% + ${END_INSET - value * (2 * END_INSET) / 100}px)` }}
      >
        {marker}
      </div>
    ) : (
      <SliderPrimitive.Root
        className="swiper-no-swiping absolute flex items-center touch-none select-none z-10"
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
        <SliderPrimitive.Track className="relative w-full h-px" />
        <SliderPrimitive.Thumb aria-label={ariaLabel} className="risiko-thumb cursor-ew-resize rounded-full" style={{ width: FACE_W, height: FACE_W }}>
          {marker}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    )}
  </div>
  );
};

const RisikoSlide = ({ page, persons, values, onChange, onWorkloadChange, pill, onEdit }: RisikoSlideProps) => {
  const workloadThumbs = React.useRef<Record<string, HTMLSpanElement | null>>({});

  const statement = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="risiko-auto-gap flex flex-col">
      <span className="retro-body-copy risiko-label relative z-10 self-start">{text}</span>
      <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text} hasValue={values[key] !== undefined}
        onChange={(v) => onChange(key, String(v))} />
    </div>
  );

  // Widths encode shares. Reserved avatar slots prevent collisions even at 0%.
  const allocation = (readOnly: boolean) => {
    const partners = persons.filter(p => page.personKeys.includes(p.key));
    const keys = partners.map(p => p.key);
    const shares = workloadShares(keys, values);
    const segments = workloadSegments(keys, shares);
    return (
      <div className="risiko-auto-gap flex flex-col gap-1">
        <span className="retro-body-copy risiko-label relative z-10 self-start">Wer leistet wie viel der Beziehungsarbeit?</span>
        <div className="risiko-scale-caption pointer-events-none flex justify-between" style={{ height: CAPTION_H }}>
          <span style={{ background: "var(--risiko-label-bg)" }}>0%</span>
          <span style={{ background: "var(--risiko-label-bg)" }}>100%</span>
        </div>
        <div className="workload-lane relative w-full h-10 shrink-0" style={{ background: "var(--risiko-label-bg)" }}>
          <div className="absolute bottom-0 w-full h-1 flex" aria-hidden="true">
            {segments.map((segment, i) => <span key={segment.key} className={`workload-segment workload-segment-${i % 4}`} style={{ width: `${segment.width}%` }} />)}
          </div>
          {partners.map((p, i) => {
            const boundaryIndex = Math.min(i, partners.length - 2);
            const segment = segments[boundaryIndex];
            const value = segment?.end ?? 100;
            const min = segment?.start ?? 0;
            const max = segments[boundaryIndex + 1]?.end ?? 100;
            const slot = `min(32px, ${100 / partners.length}%)`;
            const left = `min(${i * 32}px, ${i * 100 / partners.length}%)`;
            const right = `min(${(partners.length - i - 1) * 32}px, ${(partners.length - i - 1) * 100 / partners.length}%)`;
            const memojiEl = (
              <span className="risiko-memoji flex items-center justify-center w-full h-full overflow-hidden rounded-full text-lg leading-none" aria-hidden="true">{p.emoji}</span>
            );
            if (readOnly) {
              return (
                <div key={p.key} className="absolute top-1/2 z-10 -translate-y-1/2"
                  style={{ width: slot, height: 32, left: `calc(${left} + (100% - min(${partners.length * 32}px, 100%)) * ${value / 100})` }}>
                  {memojiEl}
                </div>
              );
            }
            return (
              <SliderPrimitive.Root key={p.key}
                className="swiper-no-swiping absolute flex items-center touch-none select-none z-10 pointer-events-none"
                style={{ left, right, top: 0, bottom: 0 }}
                value={[value]} min={0} max={100} step={1}
                onValueChange={([v]) => { if (v !== undefined) onWorkloadChange(adjustWorkloadBoundary(keys, shares, boundaryIndex, v)); }}
                onKeyDown={(e) => {
                  // keep the arrow keys from paging the card deck
                  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) e.stopPropagation();
                }}>
                <SliderPrimitive.Track className="relative w-full h-px" />
                <SliderPrimitive.Thumb aria-label={`Beziehungsarbeit ${p.name}`} aria-valuetext={`${shares[p.key]} Prozent`} aria-valuemin={min} aria-valuemax={max}
                  ref={el => { workloadThumbs.current[p.key] = el; }}
                  className="risiko-thumb cursor-ew-resize rounded-full pointer-events-auto"
                  style={{ width: `min(32px, calc(100cqw / ${partners.length}))`, height: 32 }}>
                  {memojiEl}
                </SliderPrimitive.Thumb>
              </SliderPrimitive.Root>
            );
          })}
        </div>
        <div className="relative z-10 flex flex-wrap w-full" style={{ background: "var(--risiko-label-bg)" }}>
          {partners.map(p => readOnly ? (
            <span key={p.key} className="retro-body-copy inline-flex items-center gap-1 min-h-8 px-1">
              {p.emoji} {p.name} {shares[p.key]}%
            </span>
          ) : (
            <Button key={p.key} variant="ghost" size="sm" className="h-8 px-1 gap-1 max-w-full whitespace-normal"
              aria-label={`Anteil von ${p.name} anpassen: ${shares[p.key]} Prozent`}
              onClick={() => workloadThumbs.current[p.key]?.focus()}>
              <span aria-hidden="true">{p.emoji}</span><span className="break-words">{p.name}</span><span>{shares[p.key]}%</span>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Every gap takes an equal share of the leftover height: smileys to the first
  // question, between the questions, and the last question to the buttons.
  const body = (readOnly: boolean) => (
    <div className="flex flex-col gap-3 w-full flex-1 min-h-0">
      {page.statements.map(([k, t]) => statement(k, t, readOnly))}
      {page.personKeys.length > 0 && allocation(readOnly)}
      {!readOnly && (
        <div className="risiko-auto-gap risiko-footer w-full shrink-0 flex flex-col items-start gap-2">
          <ActionRow icon="IconPencil" label="Macht Notizen" accent={pill} onClick={onEdit} />
          <ActionRow className="risiko-helper" icon="IconInfo" label="Ziehe den Punkt auf der Skala" accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
        </div>
      )}
    </div>
  );



  return (
    <div className="risiko-page flex flex-col items-start w-full h-full min-h-0" style={{ color: INK }}>
      <div className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 gap-3">
        <div className="risiko-scale-header relative flex flex-col w-full shrink-0 gap-1">
          <div className="risiko-scale-caption pointer-events-none flex justify-between" style={{ height: CAPTION_H }}>
            <span>Stimme gar nicht zu</span>
            <span>Stimme voll zu</span>
          </div>
          <FaceLayer />
        </div>
        <div className="risiko-columns absolute bottom-0 pointer-events-none flex justify-between" style={{ left: 0, right: 0, top: HEADER_H }} aria-hidden="true">
          {FACES.map((_, i) => <span key={i} className="risiko-column h-full flex justify-center" style={{ width: FACE_W }}><span className="risiko-column-line h-full" /></span>)}
        </div>
        <div className="screen-only w-full relative flex-1 min-h-0 flex flex-col">{body(false)}</div>
        <div className="hidden print-only w-full relative flex-1 min-h-0 flex flex-col">{body(true)}</div>
      </div>
    </div>
  );
};

export default RisikoSlide;
