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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="https://render.com/favicon.ico" alt="" className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate font-medium tracking-tight">DealHealth</span>
        </div>
        <nav className="flex shrink-0 items-center gap-3 text-label-13 text-muted">
          <button type="button" onClick={onHowItWorks} className="hover:text-ink">
            How it works
          </button>
          <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            Sign up
          </a>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer">
            <img
              src="https://render.com/images/deploy-to-render-button.svg"
              alt="Deploy to Render"
              className="h-7"
            />
          </a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-border bg-elevated p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium">How it works</h2>
        <ol className="mt-4 space-y-3 text-copy-14 text-muted">
          <li>Choose a model and sample deal.</li>
          <li>Analyze triggers five parallel Render Workflow tasks.</li>
          <li>Results stream back and merge into one dashboard.</li>
        </ol>
        <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
          Close
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
    neutral: "text-muted",
    live: "text-accent",
    healthy: "text-healthy",
    atrisk: "text-atrisk",
    critical: "text-critical",
    high: "text-atrisk",
    medium: "text-muted",
  };
  return (
    <span className={`font-mono text-label-13 ${tones[tone] ?? tones.neutral}`}>{children}</span>
  );
}
