import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import RevealText from "@/components/RevealText";
import ActionRow from "@/components/ActionRow";
import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react";
import { RISIKO_HOT, RISIKO_STATEMENTS, scaleValue } from "./risiko-data";

const FACES = [Angry, Frown, Meh, Smile, Laugh];
const FACE_GREY = "#9B9BA3";
// The faces sit directly on the track line (not above it) with a white
// fill so the line is hidden behind each face. The dot is smaller than a
// face and drawn above it (z-10), so the face's rim stays visible around it.
const FACE_SIZE = 22;
const FACE_FILL = "#FFFFFF";

const Face = ({ Icon }: { Icon: typeof Angry }) => (
  <span className="flex items-center justify-center rounded-full" style={{ width: FACE_SIZE - 1, height: FACE_SIZE - 1, background: FACE_FILL }}>
    <Icon size={FACE_SIZE} strokeWidth={1.5} color={FACE_GREY} />
  </span>
);

const FaceLayer = () => (
  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none" aria-hidden="true">
    {FACES.map((F, i) => <Face key={i} Icon={F} />)}
  </div>
);

// Anchor faces for the allocation scale: sad at 0 (left), happy at 100 (right).
const EndFaces = () => (
  <>
    <span className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"><Face Icon={Angry} /></span>
    <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"><Face Icon={Laugh} /></span>
  </>
);

interface Person { key: string; name: string; emoji: string }
interface RisikoSlideProps {
  slideId: number;
  persons: Person[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  pill: string;
  label: string;
}

const INK = "var(--retro-black)";
const END_INSET = FACE_SIZE / 2; // px the track is shortened on each side so its
// ends line up with the centres of the outer faces

const Track = ({ value, readOnly, onChange, ariaLabel, thumb, faces, endFaces }: {
  value: number; readOnly: boolean; onChange: (v: number) => void; ariaLabel: string; thumb: React.ReactNode; faces?: boolean; endFaces?: boolean;
}) => (
  <div className="relative w-full h-10">
    <div className="absolute top-1/2 h-px" style={{ background: INK, left: (faces || endFaces) ? END_INSET : 0, right: (faces || endFaces) ? END_INSET : 0 }} />
    {faces && <FaceLayer />}
    {endFaces && <EndFaces />}
    {readOnly ? (
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: (faces || endFaces) ? `calc(${value}% + ${END_INSET - value * (2 * END_INSET) / 100}px)` : `${value}%` }}
      >
        {thumb}
      </div>
    ) : (
      <SliderPrimitive.Root
        className="swiper-no-swiping absolute flex items-center touch-none select-none z-10"
        style={{ left: (faces || endFaces) ? END_INSET : 0, right: (faces || endFaces) ? END_INSET : 0, top: 0, bottom: 0 }}
        value={[value]} min={0} max={100} step={1}
        onValueChange={([v]) => { if (v !== undefined) onChange(v); }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <SliderPrimitive.Track className="relative w-full h-px" />
        <SliderPrimitive.Thumb aria-label={ariaLabel} className="block cursor-ew-resize rounded-full">
          {thumb}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    )}
  </div>
);

const RisikoSlide = ({ slideId, persons, values, onChange, pill, label }: RisikoSlideProps) => {
  // No white halo: it would cover most of the 22px face. The dot is smaller
  // than the face, so the smiley's rim and eyes stay visible around it.
  const dot = <span className="block w-3.5 h-3.5 rounded-full" style={{ background: INK }} />;
  const memoji = (emoji: string) => (
    <span className="flex items-center justify-center w-7 h-7 rounded-full text-lg leading-none" style={{ background: FACE_FILL, boxShadow: "0 0 0 1.5px #201C1D" }}>{emoji}</span>
  );

  const statement = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="flex flex-col">
      <span className="retro-body-copy">{text}</span>
      <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text} faces
        onChange={(v) => onChange(key, String(v))} thumb={dot} />
    </div>
  );

  // Every partner gets their own draggable lane; the scale ends are marked
  // with a sad face (0) on the left and a happy face (100) on the right.
  const allocation = (readOnly: boolean) => {
    const title = persons.length > 2 ? "Wer leistet wie viel Beziehungsarbeit?" : "Verteilung der Beziehungsarbeit";
    return (
      <div className="flex flex-col gap-1 mt-2">
        <span className="retro-body-copy">{title}</span>
        {persons.map((p) => (
          <Track key={p.key} value={scaleValue(values[`work_${p.key}`] ?? values.allocation)} readOnly={readOnly}
            ariaLabel={`Beziehungsarbeit ${p.name}`} onChange={(v) => onChange(`work_${p.key}`, String(v))}
            thumb={memoji(p.emoji)} endFaces />
        ))}
      </div>
    );
  };

  const body = (readOnly: boolean) => (
    <div className="flex flex-col gap-3 w-full mt-4">
      {RISIKO_STATEMENTS.map(([k, t]) => statement(k, t, readOnly))}
      {allocation(readOnly)}
      {statement(RISIKO_HOT[0], RISIKO_HOT[1], readOnly)}
    </div>
  );

  return (
    <div className="flex flex-col items-start w-full min-h-full" style={{ color: INK }}>
      <h2 className="retro-heading w-full"><RevealText text="Risikofaktoren" color={pill} slideIndex={slideId} /></h2>
      <div className="screen-only w-full">{body(false)}</div>
      <div className="hidden print-only w-full">{body(true)}</div>
      <div className="screen-only w-full mt-6">
        <ActionRow icon="IconInfo" label="Verschiebe den Punkt auf der Skala" accent="#F1F2F4" fieldBg="#F1F2F4" iconColor="#201C1D" labelColor="#201C1D" />
      </div>
    </div>
  );
};

export default RisikoSlide;
