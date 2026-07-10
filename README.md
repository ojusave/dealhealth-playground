<div align="center">

# DealHealth Playground

A public frontier-model test bench: point OpenAI, Anthropic, and xAI at the same sales opportunity, watch five dimension analyses fan out as parallel **Render Workflows** task runs, and compare how each model scores and reasons about the deal.

<p>
  <a href="https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
</p>

<p>
  <a href="https://render.com/docs/workflows">
    <img src="https://img.shields.io/badge/Render-Workflows-6c63ff?logo=render&logoColor=white" alt="Render Workflows" />
  </a>
  <a href="https://platform.openai.com/docs">
    <img src="https://img.shields.io/badge/OpenAI-API-412991?logo=openai&logoColor=white" alt="OpenAI" />
  </a>
  <a href="https://docs.anthropic.com/">
    <img src="https://img.shields.io/badge/Anthropic-Claude-191919?logo=anthropic&logoColor=white" alt="Anthropic" />
  </a>
  <a href="https://docs.x.ai/">
    <img src="https://img.shields.io/badge/xAI-Grok-000000?logo=x&logoColor=white" alt="xAI" />
  </a>
</p>

<p>
  <a href="https://hono.dev/">
    <img src="https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white" alt="Hono" />
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=black" alt="React" />
  </a>
  <a href="https://vite.dev/">
    <img src="https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white" alt="Vite" />
  </a>
  <a href="https://discord.gg/gvC7ceS9YS">
    <img src="https://img.shields.io/badge/Discord-Render%20Developers-5865F2?logo=discord&logoColor=white" alt="Discord" />
  </a>
</p>

</div>

## What This Demo Shows

This repo demonstrates how to build a multi-model AI playground using:

| Platform | Role |
| --- | --- |
| **[Render Workflows](https://render.com/docs/workflows)** | Orchestrates five parallel dimension-analysis tasks with per-task retries, isolated instances, and Dashboard observability |
| **[Render Web Services](https://render.com/docs/web-services)** | Hosts the Hono API: validates requests, triggers workflow runs, streams progress via SSE |
| **[Render Static Sites](https://render.com/docs/static-sites)** | Serves the React UI with live fan-out board and Opportunity Health Dashboard |
| **OpenAI / Anthropic / xAI APIs** | Frontier models discovered live from each provider's list-models endpoint |

## How It Works

1. **Browser** selects a model and opportunity, then calls `POST /api/analyze` on the **Hono API**
2. **API** returns `202` immediately and triggers `analyzeOpportunity` on **Render Workflows**
3. **Root task** fans out five chained `analyzeDimension` runs in parallel (`Promise.allSettled`), each on its own instance:

| Render Workflow Task | What It Does |
| --- | --- |
| `analyzeDimension` (×5) | One LLM call per dimension: Momentum, Qualification, Technical & Security, Commercial Readiness, Execution Alignment |
| `analyzeOpportunity` (root) | Fans out dimension tasks, aggregates scores, runs synthesis call, posts final dashboard |

4. Each task POSTs progress events to the API; the UI subscribes via **SSE** and updates the fan-out board in real time
5. User can close the tab: the workflow run completes on Render regardless

> The API keeps an in-memory event store for the live viewer only. If the API restarts mid-run, the workflow still finishes; only the live feed is lost.

## Quick Start

### Prerequisites

- [Render account](https://render.com/register?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=readme_link) (free tier works)
- API keys for at least one provider: [OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/), and/or [xAI](https://console.x.ai/)

### Deploy

1. Click **Deploy to Render** above
2. When prompted, set Blueprint secrets on **dealhealth-api** and **dealhealth-web**:
   - `RENDER_API_KEY` — [Create one](https://render.com/docs/api#1-create-an-api-key)
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY` — at least one provider key on the workflow service (see step 3)
   - `EVENTS_SECRET` — strong random string (shared between API and workflow service)
   - `ALLOWED_ORIGIN` — your **dealhealth-web** URL after deploy
   - `API_BASE_URL` — your **dealhealth-api** URL
   - `VITE_API_BASE_URL` — same as `API_BASE_URL` (web build-time variable)

3. Create the **Workflow** service manually (Blueprints do not support Workflows during beta):
   - Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Workflow**
   - Connect this repository
   - **Root Directory:** `services/workflows`
   - **Build command:** `cd ../.. && pnpm install && pnpm --filter @dealhealth/core build && pnpm --filter @dealhealth/workflows build`
   - **Start command:** `node dist/index.js`
   - **Name:** `dealhealth-workflows` (or your choice; must match slug prefix below)
   - Add env vars:
     - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`
     - `EVENTS_SECRET` (same value as API)
     - `API_BASE_URL` (public API URL for task callbacks)

4. Copy the task slug from **Tasks → analyzeOpportunity** (format `{workflow-slug}/analyzeOpportunity`) into `WORKFLOW_TASK_SLUG` on **dealhealth-api**, then redeploy the API.

5. Open your static site URL, pick a sample deal, and click **Analyze**.

## Features

| Feature | Description |
| --- | --- |
| **Live model discovery** | Model picker populated from provider list endpoints; new models appear without redeploy |
| **Real fan-out visualization** | Five task nodes driven by actual workflow callback events, not scripted animation |
| **Model comparison** | Re-run the same deal with another model in one click |
| **Task inspector** | Per-dimension lifecycle timestamps, run IDs, scores, and reasoning steps |
| **Run timeline** | Gantt strip from real event timestamps: wall-clock vs summed compute |
| **Partial dashboards** | 1–2 dimension failures still produce a dashboard with a notice |
| **Public demo guardrails** | Rate limits (8 analyses / 10 min per IP, 6 concurrent runs) |

## Configuration

| Variable | Where | Description |
| --- | --- | --- |
| `EXECUTION_MODE` | API | Set to `workflows` in production (Blueprint default) |
| `RENDER_API_KEY` | API | [Render API key](https://render.com/docs/api#1-create-an-api-key) for triggering workflow tasks |
| `WORKFLOW_TASK_SLUG` | API | Task slug from Dashboard, e.g. `dealhealth-workflows/analyzeOpportunity` |
| `EVENTS_SECRET` | API + Workflow | Shared bearer secret for `POST /internal/events` |
| `API_BASE_URL` | API + Workflow | Public API URL (workflow tasks POST progress here) |
| `ALLOWED_ORIGIN` | API | Static site URL for CORS |
| `VITE_API_BASE_URL` | Web (build) | Public API URL baked into the static build |
| `OPENAI_API_KEY` | API + Workflow | OpenAI key: API uses it for live `/v1/models`; workflow uses it for inference |
| `ANTHROPIC_API_KEY` | API + Workflow | Anthropic key: API uses it for live models list; workflow uses it for inference |
| `XAI_API_KEY` | API + Workflow | xAI key: API uses it for live models list; workflow uses it for inference |
| `MODEL_REFRESH_MINUTES` | API | Live model-list refresh interval (default: 15) |

Provider keys must be set on **both** the API and workflow services: the API calls each provider's list-models endpoint every `MODEL_REFRESH_MINUTES`; the workflow service runs the actual LLM calls.

## Model Discovery

On startup and every `MODEL_REFRESH_MINUTES`, the API fetches:

- OpenAI `GET /v1/models`
- Anthropic `GET /v1/models` (paginated)
- xAI `GET /v1/language-models` (falls back to `/v1/models`)

Include patterns and curation live in `packages/core/src/model-filter.ts` and `packages/core/src/models.overrides.ts`. Loosen `PROVIDER_INCLUDE_PATTERNS` to surface more models; add entries to `MODEL_OVERRIDES` to curate labels and ordering.

### Optional: OpenRouter

[OpenRouter](https://openrouter.ai/api/v1/models) exposes a single catalog and can proxy all three providers with one key. This demo talks to each provider directly so you exercise native APIs.

## Cost and Limits

| Limit | Value |
| --- | --- |
| Per-IP rate limit | 8 analyses per 10 minutes |
| Global concurrency | 6 simultaneous runs |
| LLM calls per analysis | 5 dimension + 1 synthesis |
| Dimension task plan | `starter` (0.5 CPU / 512 MB), 1 retry |

## Project Structure

```
packages/core/               Shared schemas, model registry, prompts, analyzers
services/api/                Hono API (Render web service)
services/workflows/          Render Workflows task definitions
web/                         React + Vite static site
render.yaml                  Blueprint (API + web; workflow created manually)
```

## API Routes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Health check |
| `GET` | `/api/models` | Live model registry grouped by provider |
| `GET` | `/api/samples` | Five sample opportunities |
| `POST` | `/api/analyze` | Start analysis; returns `202 { runId }` |
| `GET` | `/api/runs/:runId` | Run snapshot (polling fallback) |
| `GET` | `/api/runs/:runId/stream` | SSE stream of run snapshots |
| `POST` | `/internal/events` | Progress ingestion from workflow tasks (Bearer auth) |

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Workflow tasks fail immediately | Ensure provider API keys are set on the **workflow service**, not only the API |
| `WORKFLOW_TASK_SLUG` mismatch | Slug must match Dashboard exactly: `{workflow-slug}/analyzeOpportunity` |
| CORS errors in browser | Set `ALLOWED_ORIGIN` to your static site URL (include `https://`, no trailing slash issues) |
| Model picker shows `fallback` | Provider key missing or list endpoint failed; add key and wait for refresh |
| Live board stops updating | API in-memory store lost on redeploy; analysis still completes in Render Dashboard |
| Rate limited (`429`) | Public demo cap; wait for `Retry-After` or try again later |
| Partial dashboard notice | 1–2 dimensions failed; check failed node in inspector for per-model errors |

## Learn More

**Render:**
- [Render Workflows Documentation](https://render.com/docs/workflows)
- [Defining Workflow Tasks](https://render.com/docs/workflows-defining)
- [Triggering Task Runs](https://render.com/docs/workflows-running)
- [Render Developers Discord](https://discord.gg/gvC7ceS9YS)

**Model providers:**
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Anthropic Models API](https://docs.anthropic.com/en/api/models-list)
- [xAI API](https://docs.x.ai/docs/models)

## License

MIT
