import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { RunStore } from "../run-store.js";

/** Register run snapshots and the optional SSE fast path. */
export function registerRunRoutes(app: Hono, store: RunStore): void {
  app.get("/api/runs/:runId", (context) => {
    const snapshot = store.snapshot(context.req.param("runId"));
    if (!snapshot) {
      return context.json({ error: "This run expired. Hit Analyze again." }, 404);
    }
    return context.json(snapshot);
  });

  app.get("/api/runs/:runId/stream", (context) => {
    const runId = context.req.param("runId");
    return streamSSE(context, async (stream) => {
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe?.();
      };

      const initial = store.snapshot(runId);
      if (!initial) {
        await stream.writeSSE({
          data: JSON.stringify({ error: "This run expired. Hit Analyze again." }),
        });
        await stream.close();
        return;
      }
      if (initial.status === "completed" || initial.status === "failed") {
        await stream.writeSSE({ data: JSON.stringify(initial) });
        await stream.close();
        return;
      }

      unsubscribe = store.subscribe(runId, async (snapshot) => {
        await stream.writeSSE({ data: JSON.stringify(snapshot) });
        if (snapshot.status === "completed" || snapshot.status === "failed") {
          cleanup();
          await stream.close();
        }
      });

      if (!unsubscribe) return;

      heartbeat = setInterval(async () => {
        const snapshot = store.snapshot(runId);
        if (snapshot) await stream.writeSSE({ data: JSON.stringify(snapshot) });
      }, 1_000);

      stream.onAbort(cleanup);
    });
  });
}
