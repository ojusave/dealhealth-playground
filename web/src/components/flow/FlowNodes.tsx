import { memo, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge, Group, Loader, Paper, Text } from "@mantine/core";
import { DIM_SHORT } from "../../constants";

export type FlowNodeData = {
  label: string;
  status: string;
  score?: number;
  attempt: number;
  startedAt?: string;
  dimmed?: boolean;
  kind: "root" | "dimension" | "aggregate";
};

function statusMeta(status: string, attempt: number, score?: number) {
  if (status === "running") {
    return attempt > 1
      ? {
          label: `Retry ${attempt}`,
          color: "yellow" as const,
          showLoader: true,
          accent: "var(--mantine-color-yellow-6)",
        }
      : {
          label: "Running",
          color: "indigo" as const,
          showLoader: true,
          accent: "var(--mantine-color-indigo-5)",
        };
  }
  if (status === "completed") {
    return {
      label: score != null ? String(score) : "Done",
      color: "green" as const,
      showLoader: false,
      accent: "var(--mantine-color-green-6)",
    };
  }
  if (status === "failed") {
    return {
      label: "Failed",
      color: "red" as const,
      showLoader: false,
      accent: "var(--mantine-color-red-6)",
    };
  }
  if (attempt > 1) {
    return {
      label: `Retry ${attempt}`,
      color: "yellow" as const,
      showLoader: false,
      accent: "var(--mantine-color-yellow-6)",
    };
  }
  // gray-4 is the slate ramp (#94a3b8) — structural, reads on both schemes.
  return {
    label: "Queued",
    color: "gray" as const,
    showLoader: false,
    accent: "var(--mantine-color-gray-4)",
  };
}

function useElapsed(startedAt?: string, active?: boolean): string | null {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [active, startedAt]);
  if (!active || !startedAt) return null;
  const sec = Math.max(0, (now - Date.parse(startedAt)) / 1000);
  return `${sec.toFixed(1)}s`;
}

function FlowNodeInner({ data }: NodeProps) {
  const d = data as FlowNodeData;
  const meta = statusMeta(d.status, d.attempt, d.score);
  const elapsed = useElapsed(d.startedAt, d.status === "running");
  const short = DIM_SHORT[d.label] ?? d.label;

  return (
    <Paper
      withBorder
      p="sm"
      w={d.kind === "root" || d.kind === "aggregate" ? 128 : 156}
      shadow="sm"
      style={{
        opacity: d.dimmed ? 0.5 : 1,
        borderTop: `3px solid ${meta.accent}`,
        transition: "opacity 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
    >
      {d.kind !== "root" && <Handle type="target" position={Position.Left} />}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.04em" }}>
        {d.kind === "dimension" ? "Dimension" : d.kind}
      </Text>
      <Text size="sm" fw={600} lineClamp={1} mt={2}>
        {d.kind === "dimension" ? short : d.label}
      </Text>
      {/* Elapsed time rides inline with the badge so the card keeps the same
          height in every state — the graph layout in FlowBoard depends on it. */}
      <Group gap={6} mt={8} wrap="nowrap">
        <Badge size="sm" color={meta.color} variant="light">
          {meta.label}
        </Badge>
        {meta.showLoader && <Loader size="xs" color="indigo" />}
        {elapsed && (
          <Text size="xs" ff="monospace" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            {elapsed}
          </Text>
        )}
      </Group>
      {d.kind !== "aggregate" && <Handle type="source" position={Position.Right} />}
    </Paper>
  );
}

export const FlowNode = memo(FlowNodeInner);
