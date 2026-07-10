import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
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
import { AppFooter, AppHeader, AppHero } from "./components/AppHeader";
import { DashboardView } from "./components/DashboardView";
import { FlowBoard } from "./components/flow/FlowBoard";
import { GanttStrip } from "./components/GanttStrip";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ModelPicker, modelLabel, usePersistedModel } from "./components/ModelPicker";
import { OpportunityForm } from "./components/OpportunityForm";
import { RenderCtas } from "./components/RenderCtas";
import { TaskInspector } from "./components/TaskInspector";

export default function App() {
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [catalogError, setCatalogError] = useState<AppError | null>(null);
  const [rateLimitAlert, setRateLimitAlert] = useState<AppError | null>(null);
  const [samples, setSamples] = useState<Opportunity[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null);
  const [selectedDimension, setSelectedDimension] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);
  const notifiedRunError = useRef<string | null>(null);

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
    setSnapshot(null);
    setSelectedTask(null);
    setSelectedDimension("");
    setInspectorOpen(false);
    setCompareMode(false);
    notifiedRunError.current = null;

    try {
      const { runId } = await startAnalysis(opportunity, modelId);
      setDispatching(false);
      subscribeRun(
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

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSelectTask = (task: TaskNode | null, dimension: string) => {
    setSelectedTask(task);
    setSelectedDimension(dimension);
    setInspectorOpen(Boolean(task || dimension));
  };

  const analyzeLabel = running
    ? dispatching
      ? "Dispatching to Render Workflows…"
      : "Running analysis…"
    : `Analyze with ${selectedLabel}`;

  const showGantt = snapshot?.status === "completed";
  const showBoard = !showGantt;
  const showDashboard = Boolean(snapshot?.result);

  return (
    <Box className="dh-page">
      <AppHeader
        mode={executionMode === "unknown" ? "unknown" : executionMode}
        onHowItWorks={() => setShowHow(true)}
      />
      <HowItWorksModal opened={showHow} onClose={() => setShowHow(false)} />

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <AppHero />

          <Group hiddenFrom="sm" justify="center">
            <RenderCtas signupContent="navbar_button" />
          </Group>

          {initialLoading && !models ? (
            <LoadingSkeleton />
          ) : (
            <Box ref={formRef}>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Stack gap="lg">
                <ModelPicker
                  models={models}
                  value={modelId}
                  onChange={setModelId}
                  disabled={!allModelIds.length || running}
                />

                {opportunity && (
                  <OpportunityForm
                    samples={samples}
                    value={opportunity}
                    onChange={setOpportunity}
                  />
                )}

                <Button
                  size="lg"
                  fullWidth
                  loading={running}
                  disabled={!canAnalyze}
                  onClick={() => void analyze()}
                >
                  {analyzeLabel}
                </Button>

                {compareMode && (
                  <Text size="sm" c="dimmed" ta="center">
                    Pick another model, then run analyze again.
                  </Text>
                )}

                {catalogError && !running && (
                  <Alert color="yellow" variant="light" title={catalogError.title}>
                    {catalogError.message}
                  </Alert>
                )}

                {rateLimitAlert && (
                  <Alert color="yellow" variant="light" title={rateLimitAlert.title}>
                    {rateLimitAlert.message}
                    {rateLimitAlert.hint && (
                      <Text size="sm" mt="xs" c="dimmed">
                        {rateLimitAlert.hint}
                      </Text>
                    )}
                  </Alert>
                )}
              </Stack>

              <Stack gap="md">
                {showBoard && (
                  <FlowBoard
                    snapshot={snapshot}
                    idle={!snapshot}
                    company={opportunity?.company ?? "Deal"}
                    onSelectTask={handleSelectTask}
                  />
                )}
                {showGantt && snapshot && <GanttStrip snapshot={snapshot} />}
              </Stack>
            </SimpleGrid>
            </Box>
          )}

          <TaskInspector
            node={selectedTask}
            dimension={selectedDimension}
            opened={inspectorOpen}
            onClose={() => setInspectorOpen(false)}
          />

          {showDashboard && snapshot?.result && (
            <DashboardView
              data={snapshot.result}
              onReanalyze={scrollToForm}
              onCompare={() => {
                setCompareMode(true);
                scrollToForm();
              }}
            />
          )}

          <Divider />
          <AppFooter />
        </Stack>
      </Container>
    </Box>
  );
}
