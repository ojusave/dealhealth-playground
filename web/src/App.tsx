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
import { FanOutBoard, FanOutBoardIdle, RunTimeline, TaskInspector } from "./components/FanOutBoard";
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

  useEffect(() => {
    const loadModels = () => {
      void fetchModels().then(setModels).catch(() => setError("Could not load models."));
    };
    loadModels();
    const id = setInterval(loadModels, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
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

      <main className="mx-auto w-full max-w-content flex-1 px-4 py-10">
        <section ref={formRef} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
            <ModelPicker models={models} value={modelId} onChange={setModelId} />
            {opportunity && (
              <OpportunityForm samples={samples} value={opportunity} onChange={setOpportunity} />
            )}
            <button
              type="button"
              disabled={running || !opportunity}
              onClick={() => void analyze()}
              className="btn-primary w-full sm:w-auto sm:min-w-[7rem]"
            >
              {running ? "Running…" : "Analyze"}
            </button>
          </div>

          {compareMode && (
            <p className="text-label-13 text-muted">Pick another model, then Analyze.</p>
          )}
          {error && <p className="text-copy-14 text-critical">{error}</p>}
        </section>

        <section className="mt-8 space-y-4">
          {snapshot ? (
            <FanOutBoard
              snapshot={snapshot}
              company={opportunity?.company ?? "deal"}
              selected={selectedTask}
              onSelect={setSelectedTask}
            />
          ) : (
            <FanOutBoardIdle />
          )}
          <TaskInspector node={selectedTask} />
        </section>

        {snapshot?.status === "completed" && snapshot.result && (
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
      </main>

      <footer className="border-t border-border py-6 text-center text-label-13 text-faint">
        <a href="https://render.com/docs/workflows" className="hover:text-muted">
          Render Workflows
        </a>
        {" · "}
        <a href={GITHUB_URL} className="hover:text-muted">
          GitHub
        </a>
        {" · "}
        <a href={renderSignupUrlWithUtms("footer_link")} className="hover:text-muted">
          Sign up
        </a>
      </footer>
    </div>
  );
}
