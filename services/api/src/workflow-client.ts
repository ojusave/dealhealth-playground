import { Render } from "@renderinc/sdk";

export interface WorkflowRunDetails {
  status: string;
  results?: unknown[];
  error?: unknown;
  input?: unknown;
}

export interface WorkflowRunSummary {
  id: string;
  retries?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowClient {
  startTask(taskSlug: string, input: unknown[]): Promise<{ taskRunId: string }>;
  getTaskRun(taskRunId: string): Promise<WorkflowRunDetails>;
  listTaskRuns(rootTaskRunId: string): Promise<WorkflowRunSummary[]>;
}

/** Render SDK adapter used by workflow dispatch and reconciliation. */
export class RenderWorkflowClient implements WorkflowClient {
  private readonly render: Render;

  constructor(token: string) {
    this.render = new Render({ token });
  }

  async startTask(taskSlug: string, input: unknown[]): Promise<{ taskRunId: string }> {
    return this.render.workflows.startTask(taskSlug, input);
  }

  async getTaskRun(taskRunId: string): Promise<WorkflowRunDetails> {
    return this.render.workflows.getTaskRun(taskRunId);
  }

  async listTaskRuns(rootTaskRunId: string): Promise<WorkflowRunSummary[]> {
    const entries = await this.render.workflows.listTaskRuns({
      rootTaskRunId: [rootTaskRunId],
      limit: 20,
    });
    return entries.map(({ taskRun }) => ({
      id: taskRun.id,
      retries: taskRun.retries,
      startedAt: taskRun.startedAt,
      completedAt: taskRun.completedAt,
    }));
  }
}
