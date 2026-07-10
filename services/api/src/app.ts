import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { randomUUID } from "node:crypto";
import {
  analyzeRequestSchema,
  ModelRegistry,
  SAMPLES,
  type ProgressEvent,
  type TaskContext,
} from "@dealhealth/core";
import type { ApiConfig } from "./config.js";
import { runSimulatedAnalysis } from "./executor/simulated.js";
import { triggerWorkflowRun } from "./executor/workflows.js";
import { pollStaleRuns } from "./render-enrich.js";
import { RateLimiter } from "./rate-limit.js";
import { RunStore } from "./run-store.js";

const MAX_CONCURRENT = 6;

export function createApp(config: ApiConfig) {
  const app = new Hono();
  const store = new RunStore();
  const limiter = new RateLimiter(8, 10 * 60_000);
  const registry = new ModelRegistry(config.keys, config.modelRefreshMinutes);
  registry.start();

  setInterval(() => {
    void pollStaleRuns(store, config.renderApiKey);
  }, 15_000);

  app.use(
    "/api/*",
    cors({
      origin: config.allowedOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  app.get("/healthz", (c) => c.json({ status: "ok" }));

  app.get("/api/models", (c) => {
    const snap = registry.getSnapshot();
    const configuredProviders = registry.configuredProviders();
    return c.json({
      defaultModelId: snap.defaultModelId,
      configuredProviders,
      providers: snap.providers,
    });
  });

  app.get("/api/samples", (c) => c.json(SAMPLES));

  app.post("/api/analyze", async (c) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = limiter.check(ip);
    if (!limited.ok) {
      return c.json(
        { error: "Easy there. This public demo allows 8 analyses per 10 minutes.", retryAfter: limited.retryAfterSec },
        429,
        { "Retry-After": String(limited.retryAfterSec) }
      );
    }
    if (store.getActiveCount() >= MAX_CONCURRENT) {
      return c.json(
        { error: "Six analyses are already running. Try again in a moment." },
        429
      );
    }

    const body = await c.req.json().catch(() => null);
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const model = registry.findModel(parsed.data.modelId);
    if (!model) {
      const configured = registry.configuredProviders();
      if (configured.length === 0) {
        return c.json(
          {
            error: "No provider API keys are configured.",
            code: "no_provider_keys",
            hint: "Add OPENAI_API_KEY, ANTHROPIC_API_KEY, or XAI_API_KEY on dealhealth-api, then redeploy.",
          },
          503
        );
      }
      if (registry.availableModels().length === 0) {
        return c.json(
          {
            error: "Model catalog is empty. Provider list endpoints failed or returned no matching models.",
            code: "catalog_empty",
            hint: "Check dealhealth-api logs and verify each provider API key can call its list-models endpoint.",
          },
          503
        );
      }
      return c.json(
        {
          error: `Model "${parsed.data.modelId}" is not in the live catalog.`,
          code: "model_unavailable",
          hint: "Pick a model from the dropdown for a provider you configured.",
        },
        400
      );
    }

    const runId = randomUUID();
    const ctx: TaskContext = {
      runId,
      opportunity: parsed.data.opportunity,
      modelId: parsed.data.modelId,
      callbackUrl: `${config.apiBaseUrl}/internal/events`,
      eventsSecret: config.eventsSecret,
      keys: config.keys,
    };

    store.create({
      runId,
      modelId: parsed.data.modelId,
      mode: config.executionMode,
    });

    if (config.executionMode === "workflows") {
      void triggerWorkflowRun(config, store, runId, ctx);
    } else {
      void runSimulatedAnalysis(config, store, runId, ctx, model.label);
    }

    return c.json({ runId }, 202);
  });

  app.get("/api/runs/:runId", (c) => {
    const snap = store.snapshot(c.req.param("runId"));
    if (!snap) return c.json({ error: "This run expired. Hit Analyze again." }, 404);
    return c.json(snap);
  });

  app.get("/api/runs/:runId/stream", (c) => {
    const runId = c.req.param("runId");
    return streamSSE(c, async (stream) => {
      const unsub = store.subscribe(runId, async (snapshot) => {
        await stream.writeSSE({ data: JSON.stringify(snapshot) });
        if (snapshot.status === "completed" || snapshot.status === "failed") {
          await stream.close();
        }
      });
      if (!unsub) {
        await stream.writeSSE({
          data: JSON.stringify({ error: "This run expired. Hit Analyze again." }),
        });
        await stream.close();
        return;
      }
      const interval = setInterval(async () => {
        const snap = store.snapshot(runId);
        if (snap) await stream.writeSSE({ data: JSON.stringify(snap) });
      }, 1000);
      stream.onAbort(() => {
        clearInterval(interval);
        unsub();
      });
    });
  });

  app.post("/internal/events", async (c) => {
    const auth = c.req.header("authorization");
    if (auth !== `Bearer ${config.eventsSecret}`) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const body = (await c.req.json()) as ProgressEvent;
    store.applyEvent(body);
    return c.json({ ok: true });
  });

  return app;
}
