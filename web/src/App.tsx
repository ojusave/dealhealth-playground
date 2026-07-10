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
import { FanOutBoard, RunTimeline, TaskInspector } from "./components/FanOutBoard";
import { ModelPicker, usePersistedModel } from "./components/ModelPicker";
import { OpportunityForm } from "./components/OpportunityForm";
import { Header, HowItWorksModal } from "./components/Chrome";

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
    <div className="min-h-screen flex flex-col">
      <Header
        onHowItWorks={() => setShowHow(true)}
        githubUrl={GITHUB_URL}
        deployUrl={DEPLOY_URL}
        signupUrl={renderSignupUrlWithUtms("navbar_button")}
      />
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />

      <main className="flex-1 mx-auto w-full max-w-content px-4 py-8 space-y-8">
        <section ref={formRef} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Model</h2>
            <ModelPicker models={models} value={modelId} onChange={setModelId} />
            {compareMode && (
              <p className="text-sm text-accent mt-2">Pick another model, then analyze again.</p>
            )}
          </div>

          {opportunity && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Opportunity</h2>
              <OpportunityForm samples={samples} value={opportunity} onChange={setOpportunity} />
            </div>
          )}

          <button
            type="button"
            disabled={running || !opportunity}
            onClick={() => void analyze()}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-accent text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {running && (
              <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {running ? "Analyzing…" : `Analyze with ${modelLabel}`}
          </button>

          {error && (
            <p className="text-sm text-critical border border-critical/30 bg-critical/5 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </section>

        {snapshot && (
          <>
            <FanOutBoard
              snapshot={snapshot}
              company={opportunity?.company ?? "deal"}
              selected={selectedTask}
              onSelect={setSelectedTask}
            />
            <TaskInspector node={selectedTask} />
            {snapshot.status === "completed" && snapshot.result && (
              <>
                <RunTimeline snapshot={snapshot} />
                <DashboardView
                  data={snapshot.result}
                  onReanalyze={scrollToForm}
                  onCompare={() => {
                    setCompareMode(true);
                    scrollToForm();
                  }}
                />
              </>
            )}
            {snapshot.status === "failed" && (
              <p className="text-sm text-critical">{snapshot.error ?? "Run failed."}</p>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted space-y-1">
        <p>
          Runs on{" "}
          <a href="https://render.com/docs/workflows" className="text-accent hover:underline">
            Render Workflows
          </a>
          {" · "}mock data, public demo
        </p>
        <p>
          <a href={GITHUB_URL} className="hover:text-ink">
            GitHub repository
          </a>
          {" · "}
          <a href={renderSignupUrlWithUtms("footer_link")} className="hover:text-ink">
            Sign up on Render
          </a>
        </p>
      </footer>
    </div>
  );
}
