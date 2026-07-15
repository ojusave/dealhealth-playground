import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Loader, Stack, Tabs, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  catalogIssues,
  fetchModels,
  fetchSamples,
  selectableProviders,
  startAnalysis,
  subscribeRun,
  type AppError,
  type ModelsResponse,
  type Opportunity,
  type RunSnapshot,
  type TaskNode,
} from "./lib/api";
import { notifyError, notifyRateLimit } from "./lib/notify";
import { AnalysisReport } from "./components/AnalysisReport";
import { AppFooter } from "./components/AppFooter";
import { ExecutionTrace } from "./components/ExecutionTrace";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { InspectorPanel } from "./components/InspectorPanel";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ModelPicker, modelLabel, usePersistedModel } from "./components/ModelPicker";
import { OpportunityForm } from "./components/OpportunityForm";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import { RunPanel } from "./components/RunPanel";
import { RunSummary } from "./components/RunSummary";
import { WorkspaceHeader } from "./components/WorkspaceHeader";

/** Pause after a live run completes so the canvas can flip green before the report opens. */
const COMPLETION_BEAT_MS = 900;

export default function App() {
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [catalogError, setCatalogError] = useState<AppError | null>(null);
  const [rateLimitAlert, setRateLimitAlert] = useState<AppError | null>(null);
  const [samples, setSamples] = useState<Opportunity[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null);
  const [selectedDimension, setSelectedDimension] = useState("");
  const [running, setRunning] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const notifiedRunError = useRef<string | null>(null);
  const stopSubscription = useRef<(() => void) | null>(null);
  const autoOpenTimer = useRef<number | null>(null);
  const prevRunStatus = useRef<RunSnapshot["status"] | null>(null);
  const mobile = useMediaQuery("(max-width: 70em)");

  const availableModels = useMemo(
    () => (models ? selectableProviders(models).flatMap(([, p]) => p.models) : []),
    [models]
  );
  const allModelIds = useMemo(() => availableModels.map((m) => m.id), [availableModels]);
  const [modelId, setModelId] = usePersistedModel(models?.defaultModelId ?? "", allModelIds);
  const canAnalyze = Boolean(opportunity && allModelIds.length > 0 && !running);
  const selectedLabel = modelLabel(models, modelId);

  useEffect(() => {
    const loadModels = () => {
      void fetchModels()
        .then((data) => {
          setModels(data);
          const issue = catalogIssues(data);
          setCatalogError(issue);
          if (issue) notifyError(issue);
        })
        .catch((err: AppError) => {
          const error =
            err?.title
              ? err
              : {
                  title: "Could not load models",
                  message: "The model catalog request failed.",
                  hint: "Check VITE_API_BASE_URL and dealhealth-api health.",
                };
          setCatalogError(error);
          notifyError(error);
        })
        .finally(() => setInitialLoading(false));
    };
    loadModels();
    const id = setInterval(loadModels, 60_000);
    return () => clearInterval(id);
  }, []);

  const cancelAutoOpen = useCallback(() => {
    if (autoOpenTimer.current !== null) {
      window.clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      stopSubscription.current?.();
      cancelAutoOpen();
    },
    [cancelAutoOpen]
  );

  useEffect(() => {
    void fetchSamples()
      .then((s) => {
        setSamples(s);
        setOpportunity(s[1] ?? s[0]);
      })
      .catch((err: AppError) => {
        const error =
          err?.title
            ? err
            : {
                title: "Could not load samples",
                message: "Sample opportunities failed to load.",
              };
        setCatalogError(error);
        notifyError(error);
      });
  }, []);

  const analyze = useCallback(async () => {
    if (!canAnalyze || !opportunity) return;
    setRateLimitAlert(null);
    setDispatching(true);
    setRunning(true);
    setAnalysisOpen(false);
    setSnapshot(null);
    setSelectedTask(null);
    setSelectedDimension("");
    notifiedRunError.current = null;
    stopSubscription.current?.();
    cancelAutoOpen();
    prevRunStatus.current = null;

    try {
      const { runId } = await startAnalysis(opportunity, modelId);
      setDispatching(false);
      stopSubscription.current = subscribeRun(
        runId,
        (snap) => {
          setSnapshot(snap);
          const wasCompleted = prevRunStatus.current === "completed";
          prevRunStatus.current = snap.status;
          if (snap.status === "completed" || snap.status === "failed") setRunning(false);
          // Completion beat: this live run just finished with a result. Hold long
          // enough to see the canvas flip green, then surface the report. Opening
          // or closing the report manually during the beat cancels the timer.
          if (
            snap.status === "completed" &&
            snap.result &&
            !wasCompleted &&
            autoOpenTimer.current === null
          ) {
            autoOpenTimer.current = window.setTimeout(() => {
              autoOpenTimer.current = null;
              setAnalysisOpen(true);
            }, COMPLETION_BEAT_MS);
          }
        },
        (err) => {
          if (notifiedRunError.current !== err.message) {
            notifiedRunError.current = err.message;
            notifyError(err);
          }
          setRunning(false);
          setDispatching(false);
        }
      );
    } catch (err) {
      const error = (err as AppError)?.title
        ? (err as AppError)
        : {
            title: "Analysis did not start",
            message: err instanceof Error ? err.message : "Unknown error",
          };
      if (error.message.toLowerCase().includes("rate") || error.hint?.includes("minutes")) {
        setRateLimitAlert({
          title: "Rate limit reached",
          message:
            error.message ||
            "This public demo allows 8 analyses per 10 minutes.",
          hint: error.hint ?? "Try again in a few minutes.",
        });
        notifyRateLimit(error.message, error.hint);
      } else {
        notifyError(error);
      }
      setRunning(false);
      setDispatching(false);
    }
  }, [canAnalyze, opportunity, modelId, cancelAutoOpen]);

  const handleSelectTask = (task: TaskNode | null, dimension: string) => {
    setSelectedTask(task);
    setSelectedDimension(dimension);
  };

  const completedTasks =
    snapshot?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const failedTasks = snapshot?.tasks.filter((task) => task.status === "failed").length ?? 0;

  const analyzeLabel = running
    ? dispatching
      ? "Starting…"
      : `Analyzing… ${completedTasks}/5`
    : `Analyze with ${selectedLabel}`;
  const progressNote = failedTasks ? `${failedTasks} of 5 tasks failed` : null;

  const controls = (
    <Stack gap="md" className="control-stack">
      {opportunity ? (
        <OpportunityForm samples={samples} value={opportunity} onChange={setOpportunity} />
      ) : null}
      <ModelPicker
        models={models}
        value={modelId}
        onChange={setModelId}
        disabled={!allModelIds.length || running}
      />
      <Button
        size="md"
        fullWidth
        disabled={!canAnalyze && !running}
        aria-busy={running || undefined}
        leftSection={running ? <Loader size="xs" color="var(--button-color)" /> : undefined}
        style={running ? { pointerEvents: "none" } : undefined}
        onClick={() => void analyze()}
      >
        {analyzeLabel}
      </Button>
      {running ? (
        <Text size="xs" c="dimmed" ta="center" aria-live="polite">
          {progressNote}
        </Text>
      ) : null}
      {catalogError && !running ? (
        <Alert color="yellow" variant="light" title={catalogError.title}>
          {catalogError.message}
        </Alert>
      ) : null}
      {rateLimitAlert ? (
        <Alert color="yellow" variant="light" title={rateLimitAlert.title}>
          {rateLimitAlert.message}
          {rateLimitAlert.hint ? <Text size="sm" mt="xs" c="dimmed">{rateLimitAlert.hint}</Text> : null}
        </Alert>
      ) : null}
    </Stack>
  );

  const canvas = (
    <Stack gap="md" className="canvas-stack">
      <RunSummary
        snapshot={snapshot}
        modelLabel={selectedLabel}
        onViewAnalysis={() => {
          cancelAutoOpen();
          setAnalysisOpen(true);
        }}
      />
      <RunPanel
        snapshot={snapshot}
        company={opportunity?.company ?? "Deal"}
        onSelectTask={handleSelectTask}
      />
      <ExecutionTrace snapshot={snapshot} />
    </Stack>
  );

  const inspector = (
    <InspectorPanel
      task={selectedTask}
      dimension={selectedDimension}
      snapshot={snapshot}
    />
  );

  return (
    <Box className="workspace-page">
      <WorkspaceHeader />
      <HowItWorksModal opened={showHow} onClose={() => setShowHow(false)} />
      {analysisOpen && snapshot?.result && opportunity ? (
        <AnalysisReport
          data={snapshot.result}
          opportunity={opportunity}
          snapshot={snapshot}
          onBack={() => {
            cancelAutoOpen();
            setAnalysisOpen(false);
          }}
          onRunAgain={() => {
            setAnalysisOpen(false);
            void analyze();
          }}
        />
      ) : initialLoading && !models ? (
        <Box p="md"><LoadingSkeleton /></Box>
      ) : mobile ? (
        <Tabs defaultValue="canvas" className="mobile-workspace">
          <Tabs.List grow>
            <Tabs.Tab value="controls">Inputs</Tabs.Tab>
            <Tabs.Tab value="canvas">Canvas</Tabs.Tab>
            <Tabs.Tab value="inspector">Details</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="controls" p="md">{controls}</Tabs.Panel>
          <Tabs.Panel value="canvas" p="md">{canvas}</Tabs.Panel>
          <Tabs.Panel value="inspector">{inspector}</Tabs.Panel>
        </Tabs>
      ) : (
        <ResizableWorkspace controls={controls} canvas={canvas} inspector={inspector} />
      )}
      <Box className="workspace-footer">
        <AppFooter onHowItWorks={() => setShowHow(true)} />
      </Box>
    </Box>
  );
}
