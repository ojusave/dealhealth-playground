<p align="center">
  <img src="web/public/favicon.svg" width="56" height="56" alt="Render" />
</p>

<h1 align="center">Deal Review</h1>

<p align="center">
  Review one sales opportunity across five dimensions, watch the work fan out, and inspect the final evidence.
</p>

<p align="center">
  <a href="https://render.com/docs/workflows"><img src="https://img.shields.io/badge/Render-Workflows-6c63ff?style=flat-square&logo=render&logoColor=white" alt="Render Workflows" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://hono.dev/"><img src="https://img.shields.io/badge/Hono-API-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" /></a>
</p>

<p align="center">
  <a href="https://platform.openai.com/docs"><img src="https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI" /></a>
  <a href="https://docs.anthropic.com/"><img src="https://img.shields.io/badge/Anthropic-Claude-191919?style=flat-square&logo=anthropic&logoColor=white" alt="Anthropic" /></a>
  <a href="https://docs.x.ai/"><img src="https://img.shields.io/badge/xAI-Grok-000000?style=flat-square&logo=x&logoColor=white" alt="xAI" /></a>
  <a href="https://discord.gg/gvC7ceS9YS"><img src="https://img.shields.io/badge/Render-Discord-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Render Developers Discord" /></a>
</p>

<p align="center">
  <a href="#how-a-review-runs">How it works</a> ·
  <a href="#deploy-on-render">Deploy</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#development">Development</a>
</p>

<p align="center">
  <a href="https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
</p>

## Overview

Deal Review is a reference application for parallel AI work on [Render Workflows](https://render.com/docs/workflows). Pick a deal and an available OpenAI, Anthropic, or xAI model. The app runs five independent reviews, merges their findings, and produces an analysis report.

<table>
  <tr>
    <td><strong>Run Explorer</strong><br />Follow the live task graph, event history, and timing.</td>
    <td><strong>Five focused reviews</strong><br />Each dimension runs as a separate workflow task.</td>
  </tr>
  <tr>
    <td><strong>Evidence, not just a score</strong><br />Inspect findings, risks, recommendations, and reasoning.</td>
    <td><strong>Provider-aware models</strong><br />Only models backed by configured API keys appear.</td>
  </tr>
</table>

## How a review runs

```text
Browser
  │  POST /api/analyze
  ▼
Render Web Service ─────────────── progress snapshots ──────────────┐
  │                                                                 │
  │  startTask                                                      │
  ▼                                                                 │
analyzeOpportunity                                                  │
  ├── Momentum ─────────────────────────────────────────────────────┤
  ├── Qualification ────────────────────────────────────────────────┤
  ├── Technical & Security ─────────────────────────────────────────┤
  ├── Commercial Readiness ─────────────────────────────────────────┤
  └── Execution Alignment ──────────────────────────────────────────┤
             │                                                      │
             └── synthesize report ──► SSE + polling fallback ─────► UI
```

The API returns `202` as soon as the run is accepted. [Render Workflows](https://render.com/docs/workflows) executes the five dimension tasks in parallel, retries failed task attempts, and keeps running if the browser closes.

The API keeps the live viewer state in memory. Restarting it clears that local state, but does not cancel the workflow.

## Deploy on Render

You need:

- A [Render account](https://render.com/register?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=readme_link)
- A [Render API key](https://render.com/docs/api#1-create-an-api-key)
- At least one provider key: [OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/), or [xAI](https://console.x.ai/)

### 1. Deploy the API and UI

Create an environment group named `dealhealth-shared` and add your provider keys. Then use the button below. The Blueprint creates a [Render Web Service](https://render.com/docs/web-services) for the API and a [Static Site](https://render.com/docs/static-sites) for the React app.

<a href="https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground">
  <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
</a>

Set the prompted values for `RENDER_API_KEY`, `EVENTS_SECRET`, `API_BASE_URL`, `ALLOWED_ORIGIN`, and `VITE_API_BASE_URL`.

### 2. Create the Workflow service

Render Workflows are configured separately from `render.yaml`.

<details>
<summary><strong>Workflow service settings</strong></summary>

1. In the [Render Dashboard](https://dashboard.render.com), create a Workflow from this repository.
2. Set the root directory to `services/workflows`.
3. Use this build command:

   ```bash
   cd ../.. && pnpm install && pnpm --filter @dealhealth/core build && pnpm --filter @dealhealth/workflows build
   ```

4. Use `node dist/index.js` as the start command.
5. Link `dealhealth-shared`, then add the same `EVENTS_SECRET` and `API_BASE_URL` used by the API.
6. Open the registered `analyzeOpportunity` task. Copy its slug into `WORKFLOW_TASK_SLUG` on the API service and redeploy the API.

</details>

See [defining workflow tasks](https://render.com/docs/workflows-defining) and [running task runs](https://render.com/docs/workflows-running) for the corresponding Dashboard and SDK concepts.

## Configuration

| Variable | Service | Purpose |
| --- | --- | --- |
| `EXECUTION_MODE` | API | Use `workflows` in production or `simulated` for in-process execution |
| `RENDER_API_KEY` | API | Starts task runs through the Render API |
| `WORKFLOW_TASK_SLUG` | API | Identifies `{workflow-slug}/analyzeOpportunity` |
| `EVENTS_SECRET` | API + Workflow | Authenticates progress callbacks |
| `API_BASE_URL` | API + Workflow | Gives workflow tasks the callback URL |
| `ALLOWED_ORIGIN` | API | Allows requests from the deployed static site |
| `VITE_API_BASE_URL` | Web build | Bakes the public API URL into the frontend |
| Provider API keys | API + Workflow | Discovers models in the API and runs inference in the workflow |

The model catalog refreshes every `MODEL_REFRESH_MINUTES`, which defaults to 15. Filtering and labels live in `packages/core/src/model-filter.ts` and `packages/core/src/models.overrides.ts`.

## Development

Requires Node.js 22 and pnpm 9.

```bash
pnpm install
pnpm test
pnpm build
pnpm dev
```

`pnpm dev` starts the API and frontend. Without `EXECUTION_MODE=workflows`, analysis runs inside the API process.

```text
packages/core/       Contracts, schemas, model adapters, orchestration
services/api/        Routes, run state, SSE, Render reconciliation
services/workflows/  Render Workflow task adapters
web/                 React interface
render.yaml          API and static-site Blueprint
```

## Operational notes

- One review uses five dimension calls and one synthesis call.
- The public API accepts eight analyses per IP every ten minutes, with six concurrent runs.
- One or two failed dimensions produce a partial report. Three failures stop aggregation.
- If a run appears stuck, compare the Workflow run with the API logs in the [Render Dashboard](https://dashboard.render.com).

## License

MIT
