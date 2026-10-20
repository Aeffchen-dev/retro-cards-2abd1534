import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, scaleFaceGeometry, type RisikoPage } from "./risiko-data";

export const FACES = [Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header; every slider aligns with its four column centres.
const FACE_SIZE = 32;
const FACE_W = FACE_SIZE - 1; // rendered face box; scale ends line up with its centre
const CAPTION_H = 12; // tiny end labels above the smileys
const HEADER_H = CAPTION_H + 4 + FACE_SIZE; // caption, its gap, then the smileys
const FACE_FILL = "var(--risiko-face-fill)";

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
  pill: string;
  onEdit: () => void;
}

const INK = "var(--retro-black)";
// Radix clamps the thumb inside the track by half its own width, so a thumb as
// wide as a face puts the track ends exactly under the outer face centres.
const END_INSET = FACE_W / 2;

// Morph the eyes and mouth through all four header expressions.
const MorphFace = ({ value }: { value: number }) => {
  const { eyeY, brow, mouth } = scaleFaceGeometry(value);
  const path = `M ${mouth.slice(0, 2).join(" ")} ${[2, 8, 14, 20].map(i => `C ${mouth.slice(i, i + 6).join(" ")}`).join(" ")} Z`;
  return (
    <svg width={FACE_SIZE} height={FACE_SIZE} viewBox="0 0 24 24" fill="none"
      stroke={FACE_FILL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={INK} />
      <path d={`M 9 ${eyeY} h .01 M 15 ${eyeY} h .01`} />
      <path d={`M 7.5 ${9 - brow} L 10 9 M 14 9 L 16.5 ${9 - brow}`} strokeWidth={1.5 * brow} />
      <path d={path} />
    </svg>
  );
};

const ExpressionPoint = ({ value, active, shown }: { value: number; active: boolean; shown: boolean }) => {
  const expression = scaleExpression(value);
  return (
    <span className={`risiko-expression-point ${shown ? "is-shown" : ""} ${active ? "is-dragging" : ""}`} data-expression={expression} aria-hidden="true">
      <span className="risiko-plain-dot" />
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
    <div className="absolute top-1/2 h-px" style={{ background: INK, left: END_INSET, right: END_INSET }} />
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

const RisikoSlide = ({ page, persons, values, onChange, pill, onEdit }: RisikoSlideProps) => {
  const memoji = (emoji: string) => (
    <span className="risiko-memoji flex items-center justify-center w-7 h-7 rounded-full text-lg leading-none">{emoji}</span>
  );

  const statement = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="risiko-auto-gap flex flex-col">
      <span className="retro-body-copy risiko-label relative z-10 self-start">{text}</span>
      <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text} hasValue={values[key] !== undefined}
        onChange={(v) => onChange(key, String(v))} />
    </div>
  );

  // All partner Memoji share one line: each is its own draggable thumb, the
  // line reads 0% at the left end and 100% at the right end.
  const allocation = (readOnly: boolean) => {
    const partners = persons.filter(p => page.personKeys.includes(p.key));
    return (
      <div className="risiko-auto-gap flex flex-col gap-1">
        <span className="retro-body-copy risiko-label relative z-10 self-start">Wer leistet wie viel der Beziehungsarbeit?</span>
        <div className="risiko-scale-caption pointer-events-none flex justify-between" style={{ height: CAPTION_H, paddingLeft: END_INSET, paddingRight: END_INSET }}>
          <span style={{ background: "var(--risiko-label-bg)" }}>0%</span>
          <span style={{ background: "var(--risiko-label-bg)" }}>100%</span>
        </div>
        <div className="relative w-full h-10 shrink-0">
          <div className="absolute top-1/2 h-px" style={{ background: INK, left: END_INSET, right: END_INSET }} />
          {partners.map((p) => {
            const value = scaleValue(values[`work_${p.key}`] ?? values.allocation);
            const memojiEl = (
              <span className="risiko-memoji flex items-center justify-center w-7 h-7 rounded-full text-lg leading-none">{p.emoji}</span>
            );
            if (readOnly) {
              return (
                <div key={p.key} className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `calc(${value}% + ${END_INSET - (value * 2 * END_INSET) / 100}px)` }}>
                  {memojiEl}
                </div>
              );
            }
            return (
              <SliderPrimitive.Root key={p.key}
                className="swiper-no-swiping absolute inset-0 flex items-center touch-none select-none z-10 pointer-events-none"
                value={[value]} min={0} max={100} step={1}
                onValueChange={([v]) => { if (v !== undefined) onChange(`work_${p.key}`, String(v)); }}>
                <SliderPrimitive.Track className="relative w-full h-px" />
                <SliderPrimitive.Thumb aria-label={`Beziehungsarbeit ${p.name}`}
                  className="risiko-thumb cursor-ew-resize rounded-full pointer-events-auto"
                  style={{ width: FACE_W, height: FACE_W }}>
                  {memojiEl}
                </SliderPrimitive.Thumb>
              </SliderPrimitive.Root>
            );
          })}
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
          <ActionRow className="risiko-helper" icon="IconInfo" label="Ziehe den Punkt auf der Skala" accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor="var(--risiko-caption)" labelColor="var(--risiko-caption)" />
        </div>
      )}
    </div>
  );



  return (
    <div className="risiko-page flex flex-col items-start w-full h-full min-h-0" style={{ color: INK }}>
      <div className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 gap-3">
        <div className="risiko-scale-header relative flex flex-col w-full shrink-0 gap-1">
          <div className="risiko-scale-caption pointer-events-none flex justify-between" style={{ height: CAPTION_H, paddingLeft: END_INSET, paddingRight: END_INSET }}>
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
