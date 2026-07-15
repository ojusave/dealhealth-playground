import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { Group, Stack, Text, Title } from "@mantine/core";
import { DIMENSIONS } from "../../constants";
import type { RunSnapshot, TaskNode } from "../../lib/api";
import { FlowNode, type FlowNodeData } from "./FlowNodes";

const NODE_TYPES = { flow: FlowNode };

// Dimension cards render ~95px tall in every state (elapsed time sits inline
// with the status badge), so a 116px pitch keeps a clear gutter between cards.
// Root and aggregate share the middle dimension's y: all cards are the same
// height, so aligning tops vertically centers them against the fan.
const DIM_PITCH = 116;
const POSITIONS = {
  root: { x: 0, y: 2 * DIM_PITCH },
  aggregate: { x: 640, y: 2 * DIM_PITCH },
  dimensions: [0, 1, 2, 3, 4].map((i) => ({ x: 300, y: i * DIM_PITCH })),
};

function edgeStyle(status: string, animated: boolean): Partial<Edge> {
  if (status === "failed") {
    return {
      animated: false,
      style: { stroke: "var(--mantine-color-red-5)", strokeWidth: 2 },
    };
  }
  if (status === "completed") {
    return {
      animated: false,
      style: { stroke: "var(--mantine-color-green-5)", strokeWidth: 2 },
    };
  }
  return {
    animated,
    style: { stroke: "var(--mantine-color-indigo-4)", strokeWidth: animated ? 2 : 1.5 },
  };
}

function buildGraph(
  snapshot: RunSnapshot | null,
  idle: boolean,
  company: string
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const tasks = snapshot?.tasks ?? [];
  const taskByDim = new Map(tasks.map((t) => [t.dimension, t]));
  const aggregateStatus = snapshot?.result
    ? "completed"
    : snapshot?.status === "failed"
      ? "failed"
      : snapshot?.status === "running"
        ? "running"
        : "queued";

  const nodes: Node<FlowNodeData>[] = [
    {
      id: "root",
      type: "flow",
      position: POSITIONS.root,
      data: {
        kind: "root",
        label: idle ? "Analyze" : company,
        status: idle ? "queued" : (snapshot?.status ?? "queued"),
        attempt: 1,
        dimmed: idle,
      },
    },
    ...DIMENSIONS.map((dim, i) => {
      const task = taskByDim.get(dim);
      return {
        id: `dim-${i}`,
        type: "flow" as const,
        position: POSITIONS.dimensions[i],
        data: {
          kind: "dimension" as const,
          label: dim,
          status: task?.status ?? "queued",
          score: task?.score,
          attempt: task?.attempt ?? 1,
          startedAt: task?.startedAt,
          dimmed: idle,
        },
      };
    }),
    {
      id: "aggregate",
      type: "flow",
      position: POSITIONS.aggregate,
      data: {
        kind: "aggregate",
        label: "Merge",
        status: aggregateStatus,
        score: snapshot?.result?.overall_score,
        attempt: 1,
        dimmed: idle,
      },
    },
  ];

  const edges: Edge[] = DIMENSIONS.flatMap((dim, i) => {
    const task = taskByDim.get(dim);
    const status = task?.status ?? "queued";
    const running = status === "running";
    return [
      {
        id: `root-dim-${i}`,
        source: "root",
        target: `dim-${i}`,
        ...edgeStyle(status, running),
      },
      {
        id: `dim-${i}-agg`,
        source: `dim-${i}`,
        target: "aggregate",
        ...edgeStyle(status, running),
      },
    ];
  });

  return { nodes, edges };
}

export function FlowBoard({
  snapshot,
  idle,
  company,
  onSelectTask,
  embedded = false,
}: {
  snapshot: RunSnapshot | null;
  idle: boolean;
  company: string;
  onSelectTask: (task: TaskNode | null, dimension: string) => void;
  embedded?: boolean;
}) {
  const { nodes, edges } = useMemo(
    () => buildGraph(snapshot, idle, company),
    [snapshot, idle, company]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (idle || node.id === "root" || node.id === "aggregate") {
        onSelectTask(null, "");
        return;
      }
      const idx = Number(node.id.replace("dim-", ""));
      const dimension = DIMENSIONS[idx];
      const task = snapshot?.tasks.find((t) => t.dimension === dimension) ?? null;
      onSelectTask(task, dimension);
    },
    [idle, snapshot, onSelectTask]
  );

  const body = (
    <Stack gap="sm">
      {!embedded && (
        <Group justify="space-between" align="flex-end">
          <Title order={3} fw={600}>
            {idle ? "Run graph" : company}
          </Title>
          {!idle && snapshot?.status && (
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {snapshot.status}
            </Text>
          )}
        </Group>
      )}
      {embedded && (
        <Text size="sm" fw={600}>
          {idle ? "Idle" : company}
        </Text>
      )}
      <div className="dh-flow-canvas dh-flow-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          preventScrolling={false}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          proOptions={{ hideAttribution: true }}
        >
          {/* The color prop feeds an inline CSS custom property on the pattern
              svg, so a var() reference resolves against the cascade and flips
              with the color scheme (see .dh-flow-shell in index.css). */}
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--dh-flow-dot)" />
        </ReactFlow>
      </div>
      <Text size="xs" c="dimmed">
        {idle ? "Click Analyze to start." : "Click a dimension for details."}
      </Text>
    </Stack>
  );

  if (embedded) return body;
  return <div className="dh-panel" style={{ padding: "var(--mantine-spacing-md)" }}>{body}</div>;
}
