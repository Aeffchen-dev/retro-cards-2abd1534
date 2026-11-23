import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerSession } from "@/hooks/use-partner-session";
import {
  asRetroAiResult,
  latestAiInsight,
  previousAiThemes,
  saveAiInsight,
  type RetroAnswerInput,
  type RetroAiResult,
  type RetroAiTheme,
} from "./retro-ai-data";

interface Props {
  answers: RetroAnswerInput[];
  accent: string;
  fallback: ReactNode;
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

function ThemeGroup({ title, themes, empty }: { title: string; themes: RetroAiTheme[]; empty: string }) {
  return (
    <section className="retro-eval-box retro-ai-category">
      <h4>{title}</h4>
      {themes.length ? (
        <div className="retro-ai-theme-list">
          {themes.map(theme => (
            <article className="retro-ai-theme" key={`${theme.status}-${theme.title}-${theme.summary}`}>
              <span className={theme.recurring ? "retro-ai-badge is-recurring" : "retro-ai-badge"}>
                {theme.recurring ? "Wiederkehrend" : "Aus dieser Runde"}
              </span>
              <h5>{theme.title}</h5>
              <p>{theme.summary}</p>
              {theme.comparison && <p className="retro-ai-comparison">{theme.comparison}</p>}
            </article>
          ))}
        </div>
      ) : <p className="retro-eval-muted">{empty}</p>}
    </section>
  );
}

/** The complete evaluation lives directly on the Takeaways card, never in a dialog. */
export default function RetroAiInsights({ answers, accent, fallback }: Props) {
  const partnerSession = usePartnerSession();
  const [result, setResult] = useState<RetroAiResult | null>(() => latestAiInsight());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const people = [...new Set(answers.map(answer => answer.person))];
  const hasAccess = Boolean(partnerSession.guest?.token || partnerSession.user);
  const canGenerate = answers.length > 0 && hasAccess && !loading;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("retro-insights", {
        body: {
          answers,
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

  const works = result?.themes.filter(theme => theme.status === "works") ?? [];
  const watch = result?.themes.filter(theme => theme.status === "watch") ?? [];
  const peopleLabel = people.length > 1 ? `${people.slice(0, -1).join(", ")} und ${people[people.length - 1]}` : (people[0] ?? "");

  return (
    <section className="retro-ai-inline" style={{ "--retro-ai-accent": accent } as CSSProperties} aria-label="Gemeinsame Gesamtauswertung">
      {result ? (
        <div className="retro-ai-inline-results" aria-live="polite">
          <ThemeGroup title="Was gut funktioniert" themes={works} empty="Daraus lässt sich gerade kein eindeutiger Stärkebereich ableiten." />
          <ThemeGroup title="Was Aufmerksamkeit braucht" themes={watch} empty="Es gibt gerade keinen eindeutigen Punkt, der Aufmerksamkeit braucht." />
          <section className="retro-eval-box retro-ai-category" aria-label="Eure Vorhaben">
            <h4>Eure Vorhaben</h4>
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
      ) : fallback}

      <div className="retro-ai-inline-meta">
        {answers.length
          ? `${answers.length} ${answers.length === 1 ? "Angabe" : "Angaben"}${people.length ? ` von ${peopleLabel}` : ""} aus dieser Retro.`
          : "Noch sind keine Angaben eingetragen."}
      </div>
      {error && <div className="retro-ai-error" role="alert"><p>{error}</p></div>}
      {loading && <div className="retro-ai-loading" role="status"><LoaderCircle className="animate-spin" size={20} /><span>Ich vergleiche eure Angaben und ordne die Themen …</span></div>}
      {!hasAccess && <p className="retro-ai-access">Verbindet euch über „Partner einladen“, um die gemeinsame KI-Einordnung zu nutzen.</p>}
      <button
        type="button"
        className="retro-ai-inline-generate swiper-no-swiping"
        disabled={!canGenerate}
        onClick={generate}
      >
        <span className="retro-ai-generate-icon" aria-hidden="true">
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : result ? <RotateCcw size={16} /> : <Sparkles size={16} />}
        </span>
        <span className="retro-ai-generate-label">{loading ? "Auswertung läuft" : result ? "Neu auswerten" : "Gesamtauswertung erstellen"}</span>
      </button>
      <p className="retro-ai-privacy">Nur für diese Auswertung verarbeitet · kein Datenbank-Eintrag</p>
    </section>
  );
}
