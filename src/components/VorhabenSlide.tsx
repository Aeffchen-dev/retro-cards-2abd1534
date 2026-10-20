import React from "react";
import PostItField from "@/components/PostItField";
import RevealText from "@/components/RevealText";
import { VORHABEN_QUESTIONS } from "./vorhaben-data";
import "./VorhabenSlide.css";

interface VorhabenSlideProps {
  slideId: number;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const VorhabenSlide = ({ slideId, values, onChange }: VorhabenSlideProps) => {
  const fields = (readOnly: boolean) => VORHABEN_QUESTIONS.map(([key, label]) => (
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
