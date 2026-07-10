import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp(config);

serve({ fetch: app.fetch, hostname: "0.0.0.0", port: config.port }, () => {
  console.log(`DealHealth API on http://0.0.0.0:${config.port} (${config.executionMode} mode)`);
});
