import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchModels,
  fetchSamples,
  startAnalysis,
  subscribeRun,
  type ModelsResponse,
  type Opportunity,
  type RunSnapshot,
  type TaskNode,
} from "./lib/api";
import { DashboardView } from "./components/DashboardView";
import { renderSignupUrlWithUtms } from "./lib/renderSignup";
import {
  FanOutBoard,
  FanOutBoardIdle,
  RunTimeline,
  TaskInspector,
} from "./components/FanOutBoard";
import { ModelPicker, usePersistedModel } from "./components/ModelPicker";
import { OpportunityForm } from "./components/OpportunityForm";
import { Header, HowItWorksModal, SectionLabel } from "./components/Chrome";

const GITHUB_URL = "https://github.com/ojusave/dealhealth-playground";
const DEPLOY_URL =
  "https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground";

export default function App() {
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [samples, setSamples] = useState<Opportunity[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const allModelIds = useMemo(
    () =>
      models
        ? Object.values(models.providers).flatMap((p) => p.models.map((m) => m.id))
        : [],
    [models]
  );

  const [modelId, setModelId] = usePersistedModel(
    models?.defaultModelId ?? "gpt-5.6-terra",
    allModelIds
  );

  const modelLabel =
    Object.values(models?.providers ?? {})
      .flatMap((p) => p.models)
      .find((m) => m.id === modelId)?.label ?? modelId;

  useEffect(() => {
    void fetchModels().then(setModels).catch(() => setError("Could not load models."));
    void fetchSamples()
      .then((s) => {
        setSamples(s);
        setOpportunity(s[1] ?? s[0]);
      })
      .catch(() => setError("Could not load samples."));
  }, []);

  const analyze = useCallback(async () => {
    if (!opportunity || running) return;
    setError(null);
    setRunning(true);
    setSnapshot(null);
    setSelectedTask(null);
    setCompareMode(false);
    try {
      const { runId } = await startAnalysis(opportunity, modelId);
      subscribeRun(
        runId,
        (snap) => {
          setSnapshot(snap);
          if (snap.status === "completed" || snap.status === "failed") setRunning(false);
        },
        (msg) => {
          setError(msg);
          setRunning(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start analysis");
      setRunning(false);
    }
  }, [opportunity, modelId, running]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onHowItWorks={() => setShowHow(true)}
        githubUrl={GITHUB_URL}
        deployUrl={DEPLOY_URL}
        signupUrl={renderSignupUrlWithUtms("navbar_button")}
      />
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <section ref={formRef} className="space-y-6 lg:col-span-5">
            <div>
              <SectionLabel hint="Refreshed live from provider list endpoints">
                Frontier model
              </SectionLabel>
              <ModelPicker models={models} value={modelId} onChange={setModelId} />
              {compareMode && (
                <p className="mt-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
                  Comparison mode: pick another model, then analyze again on the same deal.
                </p>
              )}
            </div>

            {opportunity && (
              <OpportunityForm samples={samples} value={opportunity} onChange={setOpportunity} />
            )}

            <div className="panel p-4">
              <button
                type="button"
                disabled={running || !opportunity}
                onClick={() => void analyze()}
                className="btn-primary w-full"
              >
                {running && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {running ? "Fan-out in progress…" : `Analyze with ${modelLabel}`}
              </button>
              <p className="mt-3 text-center text-xs text-faint">
                Public demo · rate limited · 5 dimension tasks + 1 synthesis per run
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
                <p className="font-medium">Something went wrong</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </section>

          <section className="space-y-5 lg:col-span-7">
            {snapshot ? (
              <>
                <FanOutBoard
                  snapshot={snapshot}
                  company={opportunity?.company ?? "deal"}
                  selected={selectedTask}
                  onSelect={setSelectedTask}
                />
                <TaskInspector node={selectedTask} />
              </>
            ) : (
              <>
                <FanOutBoardIdle
                  company={opportunity?.company ?? "your deal"}
                  modelLabel={modelLabel}
                />
                <TaskInspector node={null} />
              </>
            )}
          </section>
        </div>

        {snapshot?.status === "completed" && snapshot.result && (
          <div className="mt-10 border-t border-border pt-10">
            <SectionLabel hint="Aggregated from parallel dimension analyses">
              Opportunity health dashboard
            </SectionLabel>
            <RunTimeline snapshot={snapshot} />
            <div className="mt-5">
              <DashboardView
                data={snapshot.result}
                onReanalyze={scrollToForm}
                onCompare={() => {
                  setCompareMode(true);
                  scrollToForm();
                }}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-faint">
        <p>
          Orchestrated on{" "}
          <a href="https://render.com/docs/workflows" className="text-accent hover:underline">
            Render Workflows
          </a>
          {" · "}sample opportunities, public demo
        </p>
        <p className="mt-2">
          <a href={GITHUB_URL} className="hover:text-muted">
            GitHub repository
          </a>
          {" · "}
          <a href={renderSignupUrlWithUtms("footer_link")} className="hover:text-muted">
            Sign up on Render
          </a>
        </p>
      </footer>
    </div>
  );
}
