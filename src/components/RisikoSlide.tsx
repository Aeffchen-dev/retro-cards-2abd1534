import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import RevealText from "@/components/RevealText";
import { RISIKO_HOT, RISIKO_SMILEYS, RISIKO_STATEMENTS, scaleValue } from "./risiko-data";

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

const Track = ({ value, readOnly, onChange, ariaLabel, thumb }: {
  value: number; readOnly: boolean; onChange: (v: number) => void; ariaLabel: string; thumb: React.ReactNode;
}) => (
  <div className="relative w-full h-10">
    <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: INK }} />
    {readOnly ? (
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${value}%` }}>{thumb}</div>
    ) : (
      <SliderPrimitive.Root
        className="swiper-no-swiping absolute inset-0 flex items-center touch-none select-none"
        value={[value]} min={0} max={100} step={1}
        onValueChange={([v]) => { if (v !== undefined) onChange(v); }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <SliderPrimitive.Track className="relative w-full h-px" />
        <SliderPrimitive.Thumb aria-label={ariaLabel} className="block cursor-ew-resize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-full">
          {thumb}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    )}
  </div>
);

const RisikoSlide = ({ slideId, persons, values, onChange, pill, label }: RisikoSlideProps) => {
  const dot = <span className="block w-6 h-6 rounded-full border-2" style={{ background: pill, borderColor: INK }} />;
  const memoji = (emoji: string) => <span className="flex items-center justify-center w-9 h-9 rounded-full text-2xl leading-none" style={{ background: label }}>{emoji}</span>;

  const statement = (key: string, text: string, readOnly: boolean) => (
    <div key={key} className="flex flex-col">
      <span className="retro-body-copy">{text}</span>
      <Track value={scaleValue(values[key])} readOnly={readOnly} ariaLabel={text}
        onChange={(v) => onChange(key, String(v))} thumb={dot} />
    </div>
  );

  const allocation = (readOnly: boolean) => {
    const title = persons.length > 2 ? "Wer leistet wie viel Beziehungsarbeit?" : "Verteilung der Beziehungsarbeit";
    return (
      <div className="flex flex-col gap-1 mt-2">
        <span className="retro-body-copy">{title}</span>
        {persons.length <= 2 ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{persons[0]?.emoji}</span>
            <div className="flex-1 min-w-0">
              <Track value={scaleValue(values.allocation)} readOnly={readOnly} ariaLabel="Verteilung der Beziehungsarbeit"
                onChange={(v) => onChange("allocation", String(v))} thumb={dot} />
            </div>
            <span className="text-2xl">{persons[1]?.emoji}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs" style={{ color: INK }}><span>wenig</span><span>viel</span></div>
            {persons.map((p) => (
              <Track key={p.key} value={scaleValue(values[`work_${p.key}`])} readOnly={readOnly}
                ariaLabel={`Beziehungsarbeit ${p.name}`} onChange={(v) => onChange(`work_${p.key}`, String(v))}
                thumb={memoji(p.emoji)} />
            ))}
          </>
        )}
      </div>
    );
  };

  const body = (readOnly: boolean) => (
    <div className="relative flex flex-col gap-3 w-full mt-4">
      {/* 5 columns across the whole page */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-5" aria-hidden="true">
        {RISIKO_SMILEYS.map((_, i) => <div key={i} className={i ? "border-l border-dashed" : ""} style={{ borderColor: INK, opacity: 0.25 }} />)}
      </div>
      <div className="grid grid-cols-5 text-center text-2xl" aria-hidden="true">
        {RISIKO_SMILEYS.map((s) => <span key={s}>{s}</span>)}
      </div>
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
    </div>
  );
};

export default RisikoSlide;
