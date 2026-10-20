import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import ActionRow from "@/components/ActionRow";
import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react";
import { scaleValue, scaleExpression, type RisikoPage } from "./risiko-data";

export const FACES = [Angry, Frown, Meh, Smile, Laugh];
export const FACE_GREY = "#9B9BA3";
// Shared smiley header; every slider aligns with its five column centres.
const FACE_SIZE = 24;
const FACE_W = FACE_SIZE - 1; // rendered face box; scale ends line up with its centre
const FACE_FILL = "var(--risiko-face-fill)";

const Face = ({ Icon }: { Icon: typeof Angry }) => (
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_W, height: FACE_W, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="risiko-face-header relative flex items-center justify-between pointer-events-none shrink-0 h-6" aria-hidden="true">
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

// One SVG face whose mouth morphs continuously with the value: the curve bows
// up (sad) below 50 and down (happy) above 50, and the mouth opens while dragging.
const MorphFace = ({ value, open }: { value: number; open: boolean }) => {
  const t = scaleExpression(value); // -1 sad … +1 happy
  const mouth = open
    ? `M 8.5 15 Q 12 ${13.5 - t * 1.5} 15.5 15 Q 12 ${20 + t * 1.5} 8.5 15 Z`
    : `M 7.5 16 Q 12 ${16 - t * 4.5} 16.5 16`;
  return (
    <svg width={FACE_SIZE} height={FACE_SIZE} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={FACE_FILL} />
      <circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <path d={mouth} fill={open ? "currentColor" : "none"} />
    </svg>
  );
};

const ExpressionPoint = ({ value, active }: { value: number; active: boolean }) => {
  const expression = scaleExpression(value);
  return (
    <span className={`risiko-expression-point ${active ? "is-dragging" : ""}`} data-expression={expression} aria-hidden="true">
      <span className="risiko-plain-dot" />
      <span className="risiko-drag-face">
        <MorphFace value={value} open={active} />
      </span>
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
        style={{ left: 0, right: 0, top: 0, bottom: 0 }}
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

  // Rows fill the whole card: the free height is shared out between them.
  const body = (readOnly: boolean) => (
    <div className="flex flex-col gap-3 w-full flex-1 min-h-0 justify-between">
      {page.statements.map(([k, t]) => statement(k, t, readOnly))}
      {page.personKeys.length > 0 && allocation(readOnly)}
    </div>
  );


  return (
    <div className="risiko-page flex flex-col items-start w-full h-full min-h-0 gap-5" style={{ color: INK }}>
      <div className="risiko-scale-area relative flex flex-col w-full flex-1 min-h-0 gap-4">
        <FaceLayer />
        <div className="risiko-columns absolute bottom-0 pointer-events-none flex justify-between" style={{ left: 0, right: 0, top: FACE_SIZE }} aria-hidden="true">
          {FACES.map((_, i) => <span key={i} className="risiko-column h-full flex justify-center" style={{ width: FACE_W }}><span className="risiko-column-line h-full" /></span>)}
        </div>
        <div className="screen-only w-full relative">{body(false)}</div>
        <div className="hidden print-only w-full relative">{body(true)}</div>
      </div>
      <div className="screen-only w-full mt-auto shrink-0 flex flex-col items-start gap-2">
        <ActionRow icon="IconPencil" label="Macht Notizen" accent={pill} onClick={onEdit} />
        <ActionRow className="risiko-helper" icon="IconInfo" label="Verschiebe den Punkt auf der Skala" accent="var(--risiko-helper-bg)" fieldBg="var(--risiko-helper-bg)" iconColor={INK} labelColor={INK} />
      </div>
    </div>
  );
};

export default RisikoSlide;
