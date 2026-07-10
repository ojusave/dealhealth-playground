import type { ReactNode } from "react";

export function Header({
  onHowItWorks,
  githubUrl,
  deployUrl,
  signupUrl,
}: {
  onHowItWorks: () => void;
  githubUrl: string;
  deployUrl: string;
  signupUrl: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-render/30 bg-render/15 shadow-glow">
            <img src="https://render.com/favicon.ico" alt="" className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-ink">
              DealHealth Playground
            </p>
            <p className="mt-0.5 max-w-xl text-sm text-muted">
              Frontier models on one deal. Five parallel workflow tasks. One live dashboard.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button type="button" onClick={onHowItWorks} className="btn-ghost">
            How it works
          </button>
          <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Sign up on Render
          </a>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img
              src="https://render.com/images/deploy-to-render-button.svg"
              alt="Deploy to Render"
              className="h-8"
            />
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-faint hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

export function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-lift animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold">How it works</h2>
        <p className="mt-2 text-sm text-muted">
          A public demo wired to real Render Workflows fan-out, not a scripted animation.
        </p>

        <ol className="mt-6 space-y-5 text-sm">
          {[
            ["Pick a model", "Live catalogs from OpenAI, Anthropic, and xAI refresh every 15 minutes."],
            ["Pick a deal", "Use a sample opportunity or edit signals yourself."],
            [
              "Watch the run",
              "The API triggers analyzeOpportunity. Render spins up five isolated dimension tasks in parallel, retries failures, and streams progress back over SSE.",
            ],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface font-mono text-xs text-accent">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl border border-border bg-surface p-4 font-mono text-xs text-muted">
          Browser → API → analyzeOpportunity → [dim₁ … dim₅] → merge & score → dashboard
        </div>

        <button type="button" onClick={onClose} className="btn-primary mt-6 w-full">
          Got it
        </button>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-border bg-surface text-muted",
    live: "border-accent/40 bg-accent/15 text-accent",
    new: "border-healthy/40 bg-healthy/10 text-healthy",
    retry: "border-atrisk/40 bg-atrisk/10 text-atrisk",
    critical: "border-critical/40 bg-critical/10 text-critical",
    high: "border-atrisk/40 bg-atrisk/10 text-atrisk",
    medium: "border-border bg-surface text-muted",
    fallback: "border-atrisk/30 bg-atrisk/5 text-atrisk",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tones[tone] ?? tones.neutral}`}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
        {children}
      </h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
