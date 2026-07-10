import { Hono } from "hono";
import { ModelRegistry, SAMPLES } from "@dealhealth/core";

/** Register model-catalog and sample-data endpoints. */
export function registerCatalogRoutes(app: Hono, registry: ModelRegistry): void {
  app.get("/api/models", (context) => {
    const snapshot = registry.getSnapshot();
    return context.json({
      defaultModelId: snapshot.defaultModelId,
      configuredProviders: registry.configuredProviders(),
      providers: snapshot.providers,
    });
  });

  app.get("/api/samples", (context) => context.json(SAMPLES));
}
