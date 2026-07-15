import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import type { PanelSize } from "react-resizable-panels";

/** Width (px) of a collapsed sidebar rail. */
const COLLAPSED_PANE_PX = 28;

/**
 * A panel reports its collapsed size (28px) when collapsed and >= minSize
 * (230/260px) otherwise. Sizes near zero are ignored: the very first onResize
 * can fire before the group has been measured.
 */
function isCollapsedSize(size: PanelSize) {
  return size.inPixels > 0 && size.inPixels <= COLLAPSED_PANE_PX + 2;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M9 3.5 L5 7 L9 10.5" : "M5 3.5 L9 7 L5 10.5"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaneToggle({
  label,
  chevron,
  expanded,
  tooltipSide,
  onClick,
}: {
  label: string;
  chevron: "left" | "right";
  expanded: boolean;
  tooltipSide: "left" | "right";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip label={label} position={tooltipSide} openDelay={300}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size={22}
        aria-label={label}
        aria-expanded={expanded}
        onClick={onClick}
      >
        <ChevronIcon direction={chevron} />
      </ActionIcon>
    </Tooltip>
  );
}

export function ResizableWorkspace({
  controls,
  canvas,
  inspector,
}: {
  controls: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}) {
  const controlsRef = usePanelRef();
  const inspectorRef = usePanelRef();
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  return (
    <Group orientation="horizontal" className="workspace-resizable">
      <Panel
        id="controls"
        defaultSize="22%"
        minSize={230}
        maxSize={420}
        collapsible
        collapsedSize={COLLAPSED_PANE_PX}
        panelRef={controlsRef}
        onResize={(size) => setControlsCollapsed(isCollapsedSize(size))}
        groupResizeBehavior="preserve-pixel-size"
      >
        <aside
          className={`workspace-pane workspace-pane--controls${
            controlsCollapsed ? " workspace-pane--collapsed" : ""
          }`}
        >
          {controlsCollapsed ? (
            <div
              className="pane-collapse-rail"
              onClick={() => controlsRef.current?.expand()}
            >
              <PaneToggle
                label="Expand inputs"
                chevron="right"
                expanded={false}
                tooltipSide="right"
                onClick={(event) => {
                  event.stopPropagation();
                  controlsRef.current?.expand();
                }}
              />
            </div>
          ) : (
            <div className="pane-collapse-bar pane-collapse-bar--controls">
              <PaneToggle
                label="Collapse inputs"
                chevron="left"
                expanded
                tooltipSide="right"
                onClick={() => controlsRef.current?.collapse()}
              />
            </div>
          )}
          <div className="pane-scroll">{controls}</div>
        </aside>
      </Panel>

      <Separator className="resize-handle" aria-label="Resize inputs and canvas" />

      <Panel id="canvas" defaultSize="56%" minSize={480}>
        <main className="workspace-pane workspace-pane--canvas">
          <div className="pane-scroll">{canvas}</div>
        </main>
      </Panel>

      <Separator className="resize-handle" aria-label="Resize canvas and details" />

      <Panel
        id="inspector"
        defaultSize="22%"
        minSize={260}
        maxSize={480}
        collapsible
        collapsedSize={COLLAPSED_PANE_PX}
        panelRef={inspectorRef}
        onResize={(size) => setInspectorCollapsed(isCollapsedSize(size))}
        groupResizeBehavior="preserve-pixel-size"
      >
        <aside
          className={`workspace-pane workspace-pane--inspector${
            inspectorCollapsed ? " workspace-pane--collapsed" : ""
          }`}
        >
          {inspectorCollapsed ? (
            <div
              className="pane-collapse-rail"
              onClick={() => inspectorRef.current?.expand()}
            >
              <PaneToggle
                label="Expand details"
                chevron="left"
                expanded={false}
                tooltipSide="left"
                onClick={(event) => {
                  event.stopPropagation();
                  inspectorRef.current?.expand();
                }}
              />
            </div>
          ) : (
            <div className="pane-collapse-bar pane-collapse-bar--inspector">
              <PaneToggle
                label="Collapse details"
                chevron="right"
                expanded
                tooltipSide="left"
                onClick={() => inspectorRef.current?.collapse()}
              />
            </div>
          )}
          <div className="pane-scroll">{inspector}</div>
        </aside>
      </Panel>
    </Group>
  );
}
