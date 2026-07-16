import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { ModelRegistry } from "@dealhealth/core";
import type { ApiConfig } from "./config.js";
import { RateLimiter } from "./rate-limit.js";
import { registerAnalysisRoutes } from "./routes/analysis.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerRunRoutes } from "./routes/runs.js";
import { RunStore } from "./run-store.js";
import { RenderWorkflowClient } from "./workflow-client.js";
import { WorkflowReconciler } from "./workflow-reconciler.js";

export function createApp(config: ApiConfig) {
  const app = new Hono();
  const store = new RunStore();
  const limiter = new RateLimiter(8, 10 * 60_000);
  const registry = new ModelRegistry(config.keys, config.modelRefreshMinutes);
  registry.start();
  const workflowClient =
    config.executionMode === "workflows" && config.renderApiKey
      ? new RenderWorkflowClient(config.renderApiKey)
      : undefined;
  const reconciler = workflowClient
    ? new WorkflowReconciler(store, workflowClient)
    : undefined;
  reconciler?.start();

  app.use(
    "/api/*",
    cors({
      origin: config.allowedOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  app.get("/healthz", (c) => c.json({ status: "ok" }));
  registerCatalogRoutes(app, registry);
  registerAnalysisRoutes(app, {
    config,
    store,
    limiter,
    registry,
    workflowClient,
    reconciler,
  });
  registerRunRoutes(app, store);
  registerEventRoutes(app, store, config.eventsSecret);

  if (config.serveWeb) {
    const webRoot = config.webRoot ?? "web/dist";
    app.use("/*", serveStatic({ root: webRoot }));
    app.get("*", serveStatic({ root: webRoot, path: "index.html" }));
  }

  return app;
}
