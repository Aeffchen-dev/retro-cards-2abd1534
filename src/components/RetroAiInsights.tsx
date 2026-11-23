import { useState, type CSSProperties } from "react";
import { ArrowRight, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import ActionRow from "./ActionRow";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerSession } from "@/hooks/use-partner-session";
import {
  asRetroAiResult,
  latestAiInsight,
  previousAiThemes,
  saveAiInsight,
  type RetroAnswerInput,
  type RetroAiResult,
} from "./retro-ai-data";

interface Props {
  answers: RetroAnswerInput[];
  accent: string;
}

async function functionErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json() as { error?: unknown };
        if (typeof body.error === "string") return body.error;
      } catch {
        // Fall through to the generic, safe message.
      }
    }
  }
  return "Die Auswertung ist gerade nicht möglich. Bitte versuche es erneut.";
}

export default function RetroAiInsights({ answers, accent }: Props) {
  const partnerSession = usePartnerSession();
  const [open, setOpen] = useState(false);
  const [extraContext, setExtraContext] = useState("");
  const [result, setResult] = useState<RetroAiResult | null>(() => latestAiInsight());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const people = [...new Set(answers.map(answer => answer.person))];
  const hasAccess = Boolean(partnerSession.guest?.token || partnerSession.user);
  const canGenerate = (answers.length > 0 || extraContext.trim().length >= 3) && hasAccess && !loading;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("retro-insights", {
        body: {
          answers,
          extraContext: extraContext.trim(),
          previousThemes: previousAiThemes(),
          guestToken: partnerSession.guest?.token,
        },
      });
      if (invokeError) throw invokeError;
      const parsed = asRetroAiResult(data);
      if (!parsed) throw new Error("Die Auswertung hatte ein unerwartetes Format. Bitte versuche es erneut.");
      setResult(parsed);
      saveAiInsight(parsed);
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes("unerwartetes Format")
        ? cause.message
        : await functionErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ActionRow
        iconNode={<Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />}
        label="KI-Auswertung"
        accent={accent}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="retro-ai-dialog swiper-no-swiping" style={{ "--retro-ai-accent": accent } as CSSProperties}>
          <DialogHeader className="retro-ai-header">
            <DialogTitle className="retro-ai-title">Eure gemeinsame Auswertung</DialogTitle>
            <DialogDescription className="retro-ai-description">
              Erkennt wiederkehrende Themen und formuliert daraus konkrete nächste Schritte.
            </DialogDescription>
          </DialogHeader>

          <div className="retro-ai-scroll">
            <section className="retro-ai-input" aria-label="Grundlage der Auswertung">
              <h3>Das wird berücksichtigt</h3>
              <p>
                {answers.length
                  ? `${answers.length} ${answers.length === 1 ? "Antwort" : "Antworten"}${people.length ? ` von ${people.join(" und ")}` : ""} aus dieser Retro.`
                  : "Noch sind keine Textantworten eingetragen."}
              </p>
              <label htmlFor="retro-ai-context">Zusätzlicher Kontext <span>optional</span></label>
              <textarea
                id="retro-ai-context"
                value={extraContext}
                onChange={event => setExtraContext(event.target.value)}
                placeholder="Was soll die Auswertung sonst noch wissen?"
                maxLength={3000}
                rows={3}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {!hasAccess && <p className="retro-ai-access">Verbindet euch über „Partner einladen“, um die KI-Auswertung gemeinsam zu nutzen.</p>}
            </section>

            {error && <div className="retro-ai-error" role="alert"><p>{error}</p></div>}
            {loading && <div className="retro-ai-loading" role="status"><LoaderCircle className="animate-spin" size={20} /><span>Ich lese eure Antworten und verbinde die Themen …</span></div>}

            {result && !loading && (
              <div className="retro-ai-results" aria-live="polite">
                <section aria-labelledby="retro-ai-themes">
                  <h3 id="retro-ai-themes">Wiederkehrende Themen</h3>
                  <div className="retro-ai-theme-list">
                    {result.themes.map(theme => (
                      <article className="retro-ai-theme" key={`${theme.title}-${theme.summary}`}>
                        <span className={theme.recurring ? "retro-ai-badge is-recurring" : "retro-ai-badge"}>
                          {theme.recurring ? "Wiederkehrend" : "Aus dieser Runde"}
                        </span>
                        <h4>{theme.title}</h4>
                        <p>{theme.summary}</p>
                      </article>
                    ))}
                  </div>
                </section>
                <section aria-labelledby="retro-ai-steps">
                  <h3 id="retro-ai-steps">Eure nächsten Schritte</h3>
                  <ol className="retro-ai-step-list">
                    {result.nextSteps.map(step => (
                      <li key={`${step.action}-${step.timing}`}>
                        <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
                        <div><strong>{step.action}</strong><span>{step.timing}</span></div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            )}
          </div>

          <div className="retro-ai-footer">
            <p>Nur für diese Auswertung verarbeitet · kein Datenbank-Eintrag</p>
            <Button
              type="button"
              className="retro-ai-generate"
              disabled={!canGenerate}
              onClick={generate}
              style={{ "--retro-ai-accent": accent } as CSSProperties}
            >
              {loading ? <LoaderCircle className="animate-spin" size={17} /> : result ? <RotateCcw size={17} /> : <Sparkles size={17} />}
              {loading ? "Auswertung läuft" : result ? "Neu auswerten" : "Themen & Schritte erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
