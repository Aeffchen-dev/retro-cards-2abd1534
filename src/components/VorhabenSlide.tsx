import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { ArrowDown } from "lucide-react";
import PostItField from "@/components/PostItField";
import RevealText from "@/components/RevealText";
import { allocationValue, VORHABEN_QUESTIONS } from "./vorhaben-data";
import "./VorhabenSlide.css";

interface VorhabenSlideProps {
  slideId: number;
  emoji1: string;
  emoji2: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const VorhabenSlide = ({ slideId, emoji1, emoji2, values, onChange }: VorhabenSlideProps) => {
  const allocation = allocationValue(values.allocation);
  const scale = (readOnly: boolean) => (
    <div className="flex flex-col w-full">
      <div className="vorhaben-question-label retro-body-copy self-start">{VORHABEN_QUESTIONS[1][1]}</div>
      <div className="vorhaben-scale-surface flex items-center gap-3 px-3 py-5 w-full">
        <span className="text-2xl shrink-0" aria-label="Person 1">{emoji1}</span>
        <div className="relative flex-1 min-w-0 h-12">
          <div className="pointer-events-none absolute inset-x-0 top-7 flex justify-between" aria-hidden="true">
            {Array.from({ length: 11 }, (_, i) => <span key={i} className={`vorhaben-scale-tick w-px ${i === 5 ? "h-4" : "h-2"}`} />)}
          </div>
          {readOnly ? (
            <>
              <div className="vorhaben-scale-line absolute inset-x-0 top-7 h-px" />
              <ArrowDown className="absolute top-0 -translate-x-1/2" size={28} style={{ left: `${allocation}%` }} />
            </>
          ) : (
            <SliderPrimitive.Root
              className="swiper-no-swiping absolute inset-x-0 top-0 h-14 flex items-center touch-none select-none"
              value={[allocation]} min={0} max={100} step={1}
              onValueChange={([value]) => { if (value !== undefined) onChange("allocation", String(value)); }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <SliderPrimitive.Track className="vorhaben-scale-line relative w-full h-px" />
              <SliderPrimitive.Thumb
                aria-label="Verteilung der Beziehungsarbeit" aria-valuetext={`${100 - allocation}% links, ${allocation}% rechts`}
                className="vorhaben-scale-arrow flex items-center justify-center w-8 h-11 -translate-y-3 cursor-ew-resize focus-visible:outline-none"
              ><ArrowDown size={28} strokeWidth={1.5} /></SliderPrimitive.Thumb>
            </SliderPrimitive.Root>
          )}
        </div>
        <span className="text-2xl shrink-0" aria-label="Person 2">{emoji2}</span>
      </div>
    </div>
  );

  const fields = (readOnly: boolean) => VORHABEN_QUESTIONS.map(([key, label]) => key === "allocation" ? (
    <React.Fragment key={key}>{scale(readOnly)}</React.Fragment>
  ) : (
    <PostItField key={key} label={label} placeholder="Deine Antwort" accent="var(--vorhaben-label)"
      readOnly={readOnly} minHeight={96} value={values[key] || ""} onChange={(value) => onChange(key, value)} />
  ));

  return (
    <div className="vorhaben-slide flex flex-col items-start w-full min-h-full">
      <h2 className="retro-heading w-full"><RevealText text="Vorhaben" color="var(--vorhaben-pill)" slideIndex={slideId} /></h2>
      <div className="screen-only flex flex-col flex-1 w-full gap-4 mt-6">{fields(false)}</div>
      <div className="hidden print-only flex-col flex-1 w-full gap-4 mt-6">{fields(true)}</div>
    </div>
  );
};

export default VorhabenSlide;