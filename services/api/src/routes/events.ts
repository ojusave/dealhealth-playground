import { Hono } from "hono";
import type { ProgressEvent } from "@dealhealth/core";
import type { RunStore } from "../run-store.js";

/** Register the authenticated workflow progress callback. */
export function registerEventRoutes(
  app: Hono,
  store: RunStore,
  eventsSecret: string
): void {
  app.post("/internal/events", async (context) => {
    if (context.req.header("authorization") !== `Bearer ${eventsSecret}`) {
      return context.json({ error: "Unauthorized" }, 401);
    }
    store.applyEvent((await context.req.json()) as ProgressEvent);
    return context.json({ ok: true });
  });
}
