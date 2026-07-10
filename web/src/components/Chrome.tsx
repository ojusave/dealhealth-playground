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
    <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-content px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">DealHealth Playground</h1>
          <p className="text-sm text-muted mt-1 max-w-xl">
            Point the newest frontier models at a sales deal. Watch the analysis fan out in real time on Render Workflows.
          </p>
          <p className="text-xs text-muted mt-1">Public demo · mock data</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onHowItWorks}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface"
          >
            How it works
          </button>
          <a
            href={signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface"
          >
            Sign up on Render
          </a>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer">
            <img
              src="https://render.com/images/deploy-to-render-button.svg"
              alt="Deploy to Render"
              className="h-7"
            />
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm text-muted hover:text-ink"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border max-w-lg w-full p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <ol className="space-y-4 text-sm text-muted">
          <li>
            <strong className="text-ink">1. Pick a model</strong> from live provider catalogs (OpenAI, Anthropic, xAI).
          </li>
          <li>
            <strong className="text-ink">2. Pick or edit a deal</strong> using samples or your own signals.
          </li>
          <li>
            <strong className="text-ink">3. Watch the run.</strong> The API hands your request to Render Workflows. The engine spins up an isolated instance for each of the five analysis dimensions, runs them in parallel, retries any that fail, and merges the results into your dashboard. Close the tab if you want; the run finishes anyway.
          </li>
        </ol>
        <div className="mt-4 p-3 rounded-lg bg-surface border border-border text-xs font-mono text-muted">
          API → analyzeOpportunity → [dim₁ dim₂ dim₃ dim₄ dim₅] → aggregate
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-md bg-accent text-white text-sm font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    neutral: "bg-surface text-muted border-border",
    live: "bg-accent/10 text-accent border-accent/30",
    new: "bg-healthy/10 text-healthy border-healthy/30",
    retry: "bg-atrisk/15 text-atrisk border-atrisk/30",
    critical: "bg-critical/10 text-critical border-critical/30",
    high: "bg-atrisk/10 text-atrisk border-atrisk/30",
    medium: "bg-atrisk/5 text-muted border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}
