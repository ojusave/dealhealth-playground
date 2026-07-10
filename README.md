<div align="center">

# Deal Review

Run the same sales opportunity through five parallel AI reviews, then inspect the score, evidence, risks, and execution trace.

<a href="https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground">
  <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
</a>

[Sign up for Render](https://render.com/register?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=readme_link) · [Render Workflows docs](https://render.com/docs/workflows) · [GitHub repository](https://github.com/ojusave/dealhealth-playground)

</div>

## What it does

Choose a sample deal or enter your own, then select an available OpenAI, Anthropic, or xAI model. Deal Review runs five checks in parallel:

- Momentum
- Qualification
- Technical and security
- Commercial readiness
- Execution alignment

The completed run becomes a report with an overall score, dimension findings, risks, recommended actions, and model reasoning. Run Explorer shows the underlying task graph and event history while the work is happening.

## How a run works

The React UI sends `POST /api/analyze` to a [Render Web Service](https://render.com/docs/web-services). The API starts an `analyzeOpportunity` task on [Render Workflows](https://render.com/docs/workflows), which fans out five `analyzeDimension` tasks and merges their results.

Workflow tasks send progress callbacks to the API. The browser follows the run through SSE, with polling as a fallback. Closing the browser does not stop the workflow.

The API stores live run state in memory. A restart clears the live viewer state, although the workflow itself can still finish on Render.

## Deploy on Render

You need a [Render account](https://render.com/register?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=readme_link), a [Render API key](https://render.com/docs/api#1-create-an-api-key), and a key from at least one model provider: [OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/), or [xAI](https://console.x.ai/).

1. Create an environment group named `dealhealth-shared` and add the provider keys you want to use.
2. Click **Deploy to Render** above. The Blueprint creates the API web service and React static site.
3. Fill in the prompted values:
   - `RENDER_API_KEY`: used by the API to start workflow tasks
   - `EVENTS_SECRET`: a random shared secret for progress callbacks
   - `API_BASE_URL`: the public API URL
   - `ALLOWED_ORIGIN`: the public static-site URL
   - `VITE_API_BASE_URL`: the same public API URL, available during the web build
4. In the [Render Dashboard](https://dashboard.render.com), create a Workflow service from this repository:
   - Root directory: `services/workflows`
   - Build command: `cd ../.. && pnpm install && pnpm --filter @dealhealth/core build && pnpm --filter @dealhealth/workflows build`
   - Start command: `node dist/index.js`
5. Link `dealhealth-shared` to the Workflow service. Add the same `EVENTS_SECRET` and `API_BASE_URL` used by the API.
6. Open the `analyzeOpportunity` task in the Dashboard. Copy its slug into `WORKFLOW_TASK_SLUG` on the API service, then redeploy the API.

[Render Workflows are created separately from the Blueprint](https://render.com/docs/workflows): `render.yaml` defines the API and UI.

## Configuration

- `EXECUTION_MODE`: `workflows` in production; `simulated` runs the same pipeline inside the API.
- `WORKFLOW_TASK_SLUG`: the deployed `{workflow-slug}/analyzeOpportunity` task.
- `MODEL_REFRESH_MINUTES`: model-catalog refresh interval. Defaults to 15 minutes.
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`: set provider keys on both the API and Workflow service. The API discovers models; the workflow performs inference.

Model filtering and labels live in `packages/core/src/model-filter.ts` and `packages/core/src/models.overrides.ts`.

## Development

Use Node.js 22 and pnpm 9.

```bash
pnpm install
pnpm test
pnpm build
pnpm dev
```

`pnpm dev` starts the API and web app. Without `EXECUTION_MODE=workflows`, the API uses simulated execution.

## Project map

```text
packages/core/       Shared contracts, schemas, model adapters, and orchestration
services/api/        HTTP routes, live run state, SSE, and Render reconciliation
services/workflows/  Render Workflow task adapters
web/                 React interface
render.yaml          API and static-site Blueprint
```

The public API includes model and sample endpoints, `POST /api/analyze`, run snapshots, and an SSE stream. Workflow callbacks use the authenticated `POST /internal/events` endpoint.

## Operational notes

- One analysis makes five dimension calls and one synthesis call.
- The public API allows eight analyses per IP every ten minutes and six concurrent runs.
- One or two failed dimensions produce a partial report. Three failures stop aggregation.
- If the UI remains queued, check the workflow run and API logs in the [Render Dashboard](https://dashboard.render.com).
- For task registration or slug errors, see [defining tasks](https://render.com/docs/workflows-defining) and [running tasks](https://render.com/docs/workflows-running).

## License

MIT
