import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { Card, Stack, Text } from "@mantine/core";
import { DIMENSIONS } from "../../constants";
import type { RunSnapshot, TaskNode } from "../../lib/api";
import { FlowNode, type FlowNodeData } from "./FlowNodes";

const NODE_TYPES = { flow: FlowNode };

const POSITIONS = {
  root: { x: 24, y: 168 },
  aggregate: { x: 500, y: 168 },
  dimensions: [32, 112, 192, 272, 352].map((y) => ({ x: 248, y })),
};

function edgeStyle(status: string, animated: boolean): Partial<Edge> {
  if (status === "failed") {
    return {
      animated: false,
      style: { stroke: "var(--mantine-color-red-6)" },
    };
  }
  if (status === "completed") {
    return {
      animated: false,
      style: { stroke: "var(--mantine-color-green-6)" },
    };
  }
  return {
    animated,
    style: { stroke: "var(--mantine-color-indigo-4)" },
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
    const rootEdge = {
      id: `root-dim-${i}`,
      source: "root",
      target: `dim-${i}`,
      ...edgeStyle(status, running),
    };
    const aggEdge = {
      id: `dim-${i}-agg`,
      source: `dim-${i}`,
      target: "aggregate",
      ...edgeStyle(status, running),
    };
    return [rootEdge, aggEdge];
  });

  return { nodes, edges };
}

export function FlowBoard({
  snapshot,
  idle,
  company,
  onSelectTask,
}: {
  snapshot: RunSnapshot | null;
  idle: boolean;
  company: string;
  onSelectTask: (task: TaskNode | null, dimension: string) => void;
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

  const caption =
    snapshot?.mode === "simulated"
      ? "Simulated locally with the same code."
      : "Each card is an isolated task run on Render Workflows. Close the tab; the run finishes anyway.";

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
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
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: false }}
          style={{ width: "100%", height: 400 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
        <Text size="sm" c="dimmed">
          {idle ? "Run an analysis to see it fan out here." : caption}
        </Text>
      </Stack>
    </Card>
  );
}
