import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import RevealText from "@/components/RevealText";
import ActionRow from "@/components/ActionRow";
import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, type RisikoPage } from "./risiko-data";

export const FACES = [Angry, Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header; every slider aligns with its five column centres.
const FACE_SIZE = 40;
const FACE_FILL = "var(--risiko-face-fill)";

const Face = ({ Icon }: { Icon: typeof Angry }) => (
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_SIZE - 1, height: FACE_SIZE - 1, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header relative flex items-center justify-between pointer-events-none shrink-0 h-10" aria-hidden="true">
    {FACES.map((F, i) => <Face key={i} Icon={F} />)}
  </div>
);

interface Person { key: string; name: string; emoji: string }
interface RisikoSlideProps {
  slideId: number;
  page: RisikoPage;
  pageNumber: number;
  pageCount: number;
  persons: Person[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  pill: string;
}

const INK = "var(--retro-black)";
const END_INSET = FACE_SIZE / 2; // px the track is shortened on each side so its
// ends line up with the centres of the outer faces

const ExpressionPoint = ({ value, active }: { value: number; active: boolean }) => {
  const expression = scaleExpression(value);
  return (
    <span className={`risiko-expression-point ${active ? "is-dragging" : ""}`} data-expression={expression} aria-hidden="true">
      <span className="risiko-plain-dot" />
      <svg className="risiko-drag-face" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="16" cy="16" r="14" />
        <circle cx="11" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="21" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <path d={`M 9 21 Q 16 ${21 + expression * 10} 23 21`} />
        <path d={`M 8 8 L 13 ${8 - Math.min(0, expression) * 3} M 19 ${8 - Math.min(0, expression) * 3} L 24 8`} opacity={Math.max(0, -expression)} />
      </svg>
    </span>
  );
};

const Track = ({ value, readOnly, onChange, ariaLabel, thumb }: {
  value: number; readOnly: boolean; onChange: (v: number) => void; ariaLabel: string; thumb?: React.ReactNode;
}) => {
  const [dragging, setDragging] = useState(false);
  const marker = thumb ?? <ExpressionPoint value={value} active={dragging && !readOnly} />;
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
        style={{ left: END_INSET, right: END_INSET, top: 0, bottom: 0 }}
        value={[value]} min={0} max={100} step={1}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        onBlur={() => setDragging(false)}
        onKeyUp={() => setDragging(false)}
        onValueChange={([v]) => { if (v !== undefined) onChange(v); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) setDragging(true);
        }}
      >
        <SliderPrimitive.Track className="relative w-full h-px" />
        <SliderPrimitive.Thumb aria-label={ariaLabel} className="block cursor-ew-resize rounded-full">
          {marker}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    )}
  </div>
  );
};

const RisikoSlide = ({ slideId, page, pageNumber, pageCount, persons, values, onChange, pill }: RisikoSlideProps) => {
  const memoji = (emoji: string) => (
    <span className="risiko-memoji flex items-center justify-center w-7 h-7 rounded-full text-lg leading-none">{emoji}</span>
  );

  const statement = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="flex flex-col">
      <span className="retro-body-copy risiko-label relative z-10 self-start">{text}</span>
      <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text}
        onChange={(v) => onChange(key, String(v))} />
    </div>
  );

  // Every partner gets their own draggable lane on the shared columns.
  const allocation = (readOnly: boolean) => {
    const title = persons.length > 2 ? "Wer leistet wie viel Beziehungsarbeit?" : "Verteilung der Beziehungsarbeit";
    return (
      <div className="flex flex-col gap-1">
        <span className="retro-body-copy risiko-label relative z-10 self-start">{title}</span>
        {persons.filter(p => page.personKeys.includes(p.key)).map((p) => (
          <Track key={p.key} value={scaleValue(values[`work_${p.key}`] ?? values.allocation)} readOnly={readOnly}
            ariaLabel={`Beziehungsarbeit ${p.name}`} onChange={(v) => onChange(`work_${p.key}`, String(v))}
            thumb={memoji(p.emoji)} />
        ))}
      </div>
    );
  };

  const body = (readOnly: boolean) => (
    <div className="flex flex-col gap-3 w-full">
      {page.statements.map(([k, t]) => statement(k, t, readOnly))}
      {page.personKeys.length > 0 && allocation(readOnly)}
    </div>
  );

  return (
    <div className="risiko-page flex flex-col items-start w-full h-full min-h-0 gap-5" style={{ color: INK }}>
      <div className="w-full shrink-0">
      <h2 className="retro-heading w-full"><RevealText text="Risikofaktoren" color={pill} slideIndex={slideId} /></h2>
      <span className="retro-small">{pageNumber} / {pageCount}</span>
      </div>
      <div className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 gap-4">
        <FaceLayer />
        <div className="risiko-columns absolute bottom-0 pointer-events-none flex justify-between" style={{ left: END_INSET, right: END_INSET, top: FACE_SIZE }} aria-hidden="true">
          {FACES.map((_, i) => <span key={i} className="risiko-column h-full" />)}
        </div>
        <div className="screen-only w-full relative">{body(false)}</div>
        <div className="hidden print-only w-full relative">{body(true)}</div>
      </div>
      <div className="screen-only w-full mt-auto shrink-0">
        <ActionRow className="risiko-helper" icon="IconInfo" label="Verschiebe den Punkt auf der Skala" accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
      </div>
    </div>
  );
};

export default RisikoSlide;
