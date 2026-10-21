import React from "react";
import PostItField from "@/components/PostItField";
import RevealText from "@/components/RevealText";
import { VORHABEN_QUESTIONS } from "./vorhaben-data";
import "./VorhabenSlide.css";

interface VorhabenSlideProps {
  slideId: number;
  /** Heading colour — the same combo the Questions card wears */
  pillColor: string;
  /** Label-bar colour — the combo's companion colour */
  labelColor: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const VorhabenSlide = ({ slideId, pillColor, labelColor, values, onChange }: VorhabenSlideProps) => {
  const fields = (readOnly: boolean) => VORHABEN_QUESTIONS.map(([key, label]) => (
    <PostItField key={key} label={label} placeholder="Deine Antwort" accent={labelColor} barColor={labelColor}
      readOnly={readOnly} minHeight={96} value={values[key] || ""} onChange={(value) => onChange(key, value)} />
  ));

  return (
    <div className="vorhaben-slide flex flex-col items-start w-full min-h-full"
      style={{ ["--vorhaben-pill" as string]: pillColor, ["--vorhaben-label" as string]: labelColor } as React.CSSProperties}>
      <h2 className="retro-heading w-full"><RevealText text="Das nehmen wir uns bis zur nächsten Retro vor" color={pillColor} slideIndex={slideId} /></h2>
      <div className="screen-only flex flex-col flex-1 w-full gap-4 mt-6">{fields(false)}</div>
      <div className="hidden print-only flex-col flex-1 w-full gap-4 mt-6">{fields(true)}</div>
    </div>
  );
};

export default VorhabenSlide;
