import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Stack, Tabs, Text } from "@mantine/core";
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
import { AppFooter } from "./components/AppHeader";
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
  const mobile = useMediaQuery("(max-width: 70em)");

  const availableModels = useMemo(
    () => (models ? selectableProviders(models).flatMap(([, p]) => p.models) : []),
    [models]
  );
  const allModelIds = useMemo(() => availableModels.map((m) => m.id), [availableModels]);
  const [modelId, setModelId] = usePersistedModel(models?.defaultModelId ?? "", allModelIds);
  const canAnalyze = Boolean(opportunity && allModelIds.length > 0 && !running);
  const selectedLabel = modelLabel(models, modelId);

  const executionMode = snapshot?.mode ?? (models ? "workflows" : "unknown");

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

  useEffect(() => () => stopSubscription.current?.(), []);

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

    try {
      const { runId } = await startAnalysis(opportunity, modelId);
      setDispatching(false);
      stopSubscription.current = subscribeRun(
        runId,
        (snap) => {
          setSnapshot(snap);
          if (snap.status === "completed" || snap.status === "failed") setRunning(false);
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
  }, [canAnalyze, opportunity, modelId]);

  const handleSelectTask = (task: TaskNode | null, dimension: string) => {
    setSelectedTask(task);
    setSelectedDimension(dimension);
  };

  const analyzeLabel = running
    ? dispatching
      ? "Starting…"
      : "Running…"
    : `Analyze with ${selectedLabel}`;

  const completedTasks =
    snapshot?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const failedTasks = snapshot?.tasks.filter((task) => task.status === "failed").length ?? 0;
  const progressLabel = dispatching
    ? "Dispatching…"
    : running
      ? `${completedTasks}/5 done${failedTasks ? ` · ${failedTasks} failed` : ""}`
      : null;

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
        loading={running}
        disabled={!canAnalyze}
        onClick={() => void analyze()}
      >
        {analyzeLabel}
      </Button>
      {progressLabel ? (
        <Text size="xs" c="dimmed" ta="center">{progressLabel}</Text>
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
        onViewAnalysis={() => setAnalysisOpen(true)}
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
          onBack={() => setAnalysisOpen(false)}
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
        <AppFooter
          mode={executionMode === "unknown" ? "unknown" : executionMode}
          onHowItWorks={() => setShowHow(true)}
        />
      </Box>
    </Box>
  );
}
