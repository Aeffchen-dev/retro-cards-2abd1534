import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const variants = [
  { key: "round", label: "Rund", family: "Nunito" },
  { key: "technical", label: "Technisch", family: "JetBrains Mono" },
  { key: "serif", label: "Serif", family: "Instrument Serif" },
];

export default function QuestionFontPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="font-preview-trigger screen-only" title="Schriften vergleichen">
          <Type aria-hidden="true" /> Schriftvorschau
        </Button>
      </DialogTrigger>
      <DialogContent className="font-preview-dialog" aria-describedby={undefined}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400&family=JetBrains+Mono:wght@400&family=Instrument+Serif&display=swap" />
        <DialogTitle>Große Frage · Schriftvergleich</DialogTitle>
        <Tabs defaultValue="round">
          <TabsList className="w-full" aria-label="Schriftstil">
            {variants.map((variant) => (
              <TabsTrigger key={variant.key} value={variant.key} className="flex-1">{variant.label}</TabsTrigger>
            ))}
          </TabsList>
          {variants.map((variant) => (
            <TabsContent key={variant.key} value={variant.key}>
              <div className={`font-preview-card font-preview-${variant.key}`}>
                <span className="font-preview-chapter">Health Check</span>
                <h2 className="font-preview-question" lang="de">Ist unsere Beziehungsarbeit gerecht verteilt?</h2>
                <p className="font-preview-support">Oder leistet einer von uns einen deutlich größeren Anteil?</p>
                <div className="font-preview-sample-footer">{variant.family} · Regular 400</div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}