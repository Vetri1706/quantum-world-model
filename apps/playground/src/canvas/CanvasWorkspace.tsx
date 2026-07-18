import { useRef, useState, type PointerEvent, type DragEvent, useEffect } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";
import { equipmentRegistry } from "../data/equipmentRegistry";
import { EquipmentSVG } from "./EquipmentSVG";

type CanvasWorkspaceProps = {
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  selectedIds: string[];
  isSimulating: boolean;
  onSelect: (ids: string[]) => void;
  onUpdateInstance: (id: string, updates: Partial<EquipmentInstance>) => void;
  onAddInstance: (instance: EquipmentInstance) => void;
  onAddConnection: (conn: CanvasConnection) => void;
  onDeleteConnection: (id: string) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
};

export function CanvasWorkspace({
  instances,
  connections,
  selectedIds,
  isSimulating,
  onSelect,
  onUpdateInstance,
  onAddInstance,
  onAddConnection,
  onDeleteConnection,
  onDeleteSelected,
  onDuplicateSelected,
}: CanvasWorkspaceProps) {
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [activePort, setActivePort] = useState<{
    id: string;
    portId: string;
    type: "input" | "output";
    kind: "beam" | "signal";
    x: number;
    y: number;
  } | null>(null);
  const [tempLine, setTempLine] = useState<{ x: number; y: number } | null>(null);

  // Drag selection box state
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Snap guidelines state
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);
  const [portMismatchToast, setPortMismatchToast] = useState<string | null>(null);

  // Refs for tracking drag operations
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    type: "pan" | "drag-item" | "resize" | "rotate" | "select-box" | null;
    startX: number;
    startY: number;
    panStart?: { x: number; y: number };
    itemStartPos?: { x: number; y: number }[];
    itemStartSize?: { width: number; height: number };
    itemStartRot?: number;
    resizeHandle?: string; // "tl" | "tr" | "bl" | "br"
    itemId?: string;
  }>({ type: null, startX: 0, startY: 0 });

  // Handle keyboard events (delete and duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus check - don't trigger if user is inside an input field
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        onDeleteSelected();
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onDuplicateSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDeleteSelected, onDuplicateSelected]);

  // Convert client viewport coordinates to canvas coordinates (relative to zoom and pan)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Convert local component port coordinates to canvas absolute coordinates
  const getAbsolutePortCoords = (instance: EquipmentInstance, portId: string) => {
    const definition = equipmentRegistry.find((def) => def.id === instance.definitionId);
    if (!definition) return { x: instance.position.x, y: instance.position.y };

    const port = definition.ports.find((p) => p.id === portId);
    if (!port) return { x: instance.position.x, y: instance.position.y };

    // Bounding Box coordinates
    const halfW = instance.size.width / 2;
    const halfH = instance.size.height / 2;

    // Component-space position relative to center
    const localX = (port.position.x / 100) * instance.size.width - halfW;
    const localY = (port.position.y / 100) * instance.size.height - halfH;

    // Rotate local coordinates around component center
    const rad = (instance.rotation * Math.PI) / 180;
    const rotX = localX * Math.cos(rad) - localY * Math.sin(rad);
    const rotY = localX * Math.sin(rad) + localY * Math.cos(rad);

    return {
      x: instance.position.x + rotX,
      y: instance.position.y + rotY,
    };
  };

  // Render snap grid line spacing
  const gridSpacing = 20;

  // Snapping calculations
  const calculateSnap = (val: number) => {
    return Math.round(val / 10) * 10;
  };

  // Pan canvas mousewheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.2, Math.min(3, nextZoom)));
  };

  // Pointer interactions
  const handlePointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const isCanvasBg = target.classList.contains("canvas-bg") || target.nodeName === "svg";
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Cancel active connection drag if clicking elsewhere
    if (activePort && !target.closest(".port-dot")) {
      setActivePort(null);
      setTempLine(null);
      return;
    }

    if (isCanvasBg) {
      if (e.button === 0 && e.shiftKey) {
        // Shift+Drag to box select
        dragRef.current = {
          type: "select-box",
          startX: coords.x,
          startY: coords.y,
        };
        setSelectionStart(coords);
        setSelectionEnd(coords);
      } else {
        // Drag to Pan
        dragRef.current = {
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          panStart: { ...pan },
        };
      }
      onSelect([]);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag.type) {
      // If dragging a connection port, update temporary line endpoint
      if (activePort) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setTempLine(coords);
      }
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (drag.type === "pan" && drag.panStart) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setPan({
        x: drag.panStart.x + dx,
        y: drag.panStart.y + dy,
      });
    } else if (drag.type === "select-box" && selectionStart) {
      setSelectionEnd(coords);

      // Identify components inside the boundary box
      const minX = Math.min(selectionStart.x, coords.x);
      const maxX = Math.max(selectionStart.x, coords.x);
      const minY = Math.min(selectionStart.y, coords.y);
      const maxY = Math.max(selectionStart.y, coords.y);

      const itemsInside = instances
        .filter(
          (inst) =>
            inst.position.x >= minX &&
            inst.position.x <= maxX &&
            inst.position.y >= minY &&
            inst.position.y <= maxY
        )
        .map((inst) => inst.id);

      onSelect(itemsInside);
    } else if (drag.type === "drag-item" && drag.itemId && drag.itemStartPos) {
      const dx = coords.x - drag.startX;
      const dy = coords.y - drag.startY;

      // Snapping coordinates alignment
      const rawX = drag.itemStartPos[0].x + dx;
      const rawY = drag.itemStartPos[0].y + dy;
      const snappedX = calculateSnap(rawX);
      const snappedY = calculateSnap(rawY);

      // Snap guidelines detection
      const snapLinesList: { x?: number; y?: number }[] = [];
      let finalX = snappedX;
      let finalY = snappedY;

      instances.forEach((inst) => {
        if (selectedIds.includes(inst.id)) return;
        if (Math.abs(inst.position.x - rawX) < 12) {
          finalX = inst.position.x;
          snapLinesList.push({ x: inst.position.x });
        }
        if (Math.abs(inst.position.y - rawY) < 12) {
          finalY = inst.position.y;
          snapLinesList.push({ y: inst.position.y });
        }
      });

      setSnapLines(snapLinesList);

      // Update positions of all selected items
      const deltaX = finalX - drag.itemStartPos[0].x;
      const deltaY = finalY - drag.itemStartPos[0].y;

      selectedIds.forEach((id, idx) => {
        if (drag.itemStartPos && drag.itemStartPos[idx]) {
          onUpdateInstance(id, {
            position: {
              x: drag.itemStartPos[idx].x + deltaX,
              y: drag.itemStartPos[idx].y + deltaY,
            },
          });
        }
      });
    } else if (drag.type === "resize" && drag.itemId && drag.itemStartSize && drag.itemStartPos) {
      const instance = instances.find((i) => i.id === drag.itemId);
      if (!instance) return;

      const dx = coords.x - drag.startX;
      const dy = coords.y - drag.startY;

      // Account for rotation in resize
      const rad = (instance.rotation * Math.PI) / 180;
      const localDx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
      const localDy = dx * Math.sin(-rad) + dy * Math.cos(-rad);

      let nextWidth = drag.itemStartSize.width;
      let nextHeight = drag.itemStartSize.height;

      if (drag.resizeHandle === "tr") {
        nextWidth = Math.max(30, drag.itemStartSize.width + localDx * 2);
        nextHeight = Math.max(30, drag.itemStartSize.height - localDy * 2);
      } else if (drag.resizeHandle === "br") {
        nextWidth = Math.max(30, drag.itemStartSize.width + localDx * 2);
        nextHeight = Math.max(30, drag.itemStartSize.height + localDy * 2);
      } else if (drag.resizeHandle === "bl") {
        nextWidth = Math.max(30, drag.itemStartSize.width - localDx * 2);
        nextHeight = Math.max(30, drag.itemStartSize.height + localDy * 2);
      } else if (drag.resizeHandle === "tl") {
        nextWidth = Math.max(30, drag.itemStartSize.width - localDx * 2);
        nextHeight = Math.max(30, drag.itemStartSize.height - localDy * 2);
      }

      // Keep snapping width / height in increments of 10
      nextWidth = Math.round(nextWidth / 10) * 10;
      nextHeight = Math.round(nextHeight / 10) * 10;

      onUpdateInstance(drag.itemId, {
        size: { width: nextWidth, height: nextHeight },
      });
    } else if (drag.type === "rotate" && drag.itemId && drag.itemStartRot !== undefined) {
      const instance = instances.find((i) => i.id === drag.itemId);
      if (!instance) return;

      // Calculate angle between cursor and component center
      const angle =
        (Math.atan2(coords.y - instance.position.y, coords.x - instance.position.x) * 180) / Math.PI +
        90;
      let normalizedAngle = (angle + 360) % 360;

      // Snap to 15-degree increments if shift is held
      if (e.shiftKey) {
        normalizedAngle = Math.round(normalizedAngle / 15) * 15;
      }

      onUpdateInstance(drag.itemId, { rotation: normalizedAngle });
    }
  };

  const handlePointerUp = (e: PointerEvent<SVGSVGElement>) => {
    dragRef.current = { type: null, startX: 0, startY: 0 };
    setSelectionStart(null);
    setSelectionEnd(null);
    setSnapLines([]);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Drag-and-drop support from Library
  const handleDragOver = (e: DragEvent<HTMLElement | SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLElement | SVGSVGElement>) => {
    e.preventDefault();
    const definitionId =
      e.dataTransfer.getData("application/react-flow") ||
      e.dataTransfer.getData("text/plain");
    if (!definitionId) return;

    const definition = equipmentRegistry.find((def) => def.id === definitionId);
    if (!definition) return;

    // Calculate dropping coordinates
    const coords = getCanvasCoords(e.clientX, e.clientY);

    const newInstance: EquipmentInstance = {
      id: `${definitionId}-${Date.now().toString().substring(7)}`,
      definitionId,
      name: `${definition.name} ${instances.filter((i) => i.definitionId === definitionId).length + 1}`,
      position: {
        x: calculateSnap(coords.x),
        y: calculateSnap(coords.y),
      },
      rotation: 0,
      size: { ...definition.defaultSize },
      parameters: definition.inspector.reduce((acc, field) => {
        acc[field.id] = field.defaultValue;
        return acc;
      }, {} as Record<string, any>),
    };

    onAddInstance(newInstance);
    onSelect([newInstance.id]);
  };

  // Start connection link dragging
  const handlePortPointerDown = (
    e: PointerEvent,
    instance: EquipmentInstance,
    port: { id: string; type: "input" | "output"; kind: "beam" | "signal" }
  ) => {
    e.stopPropagation();
    const absCoords = getAbsolutePortCoords(instance, port.id);
    setActivePort({
      id: instance.id,
      portId: port.id,
      type: port.type,
      kind: port.kind,
      x: absCoords.x,
      y: absCoords.y,
    });
    setTempLine(absCoords);
  };

  // Complete connection link dragging
  const handlePortPointerUp = (
    e: PointerEvent,
    targetInstance: EquipmentInstance,
    targetPort: { id: string; type: "input" | "output"; kind: "beam" | "signal" }
  ) => {
    e.stopPropagation();
    if (!activePort) return;

    // Prevent connecting to same component
    if (activePort.id === targetInstance.id) {
      setActivePort(null);
      setTempLine(null);
      return;
    }

    // Connect input to output only
    if (activePort.type === targetPort.type) {
      setActivePort(null);
      setTempLine(null);
      return;
    }

    // Must be same kind (beam to beam or signal to signal)
    if (activePort.kind !== targetPort.kind) {
      setPortMismatchToast(
        activePort.kind === "beam"
          ? "💡 Port Mismatch: Optical/Particle Beams (Green/Red) cannot connect directly to Electronic BNC Signal ports (Violet). Insert a Quantum Detector or Counter to convert the beam into an electronic signal!"
          : "💡 Port Mismatch: Electronic BNC Cables (Violet) cannot connect to Optical Beam ports. Connect to electronic BNC terminals!"
      );
      setActivePort(null);
      setTempLine(null);
      return;
    }

    // Format connections correctly (from = output, to = input)
    const fromId = activePort.type === "output" ? activePort.id : targetInstance.id;
    const fromPort = activePort.type === "output" ? activePort.portId : targetPort.id;
    const toId = activePort.type === "input" ? activePort.id : targetInstance.id;
    const toPort = activePort.type === "input" ? activePort.portId : targetPort.id;

    onAddConnection({
      id: `${fromId}-${fromPort}-to-${toId}-${toPort}`,
      fromId,
      fromPort,
      toId,
      toPort,
      kind: activePort.kind === "beam" ? "flow" : "measurement",
    });

    setActivePort(null);
    setTempLine(null);
  };

  return (
    <section
      className="canvas-shell"
      aria-label="Quantum workspace workbench"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="canvas-caption">
        <span>Infinite laboratory workspace</span>
        <span>Grid: 10px snap · Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      {portMismatchToast && (
        <div className="port-mismatch-banner">
          <span>{portMismatchToast}</span>
          <button onClick={() => setPortMismatchToast(null)}>✕</button>
        </div>
      )}

      <svg
        ref={canvasRef}
        className="canvas"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <defs>
          {/* Subtle laboratory grid background patterns */}
          <pattern
            id="laboratory-grid"
            width={gridSpacing}
            height={gridSpacing}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          >
            <path d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`} fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
          </pattern>
          <pattern
            id="laboratory-grid-major"
            width={gridSpacing * 5}
            height={gridSpacing * 5}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          >
            <rect width={gridSpacing * 5} height={gridSpacing * 5} fill="url(#laboratory-grid)" />
            <path d={`M ${gridSpacing * 5} 0 L 0 0 0 ${gridSpacing * 5}`} fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
          </pattern>

          {/* Neon Glow Filters */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Markers */}
          <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#ff007f" />
          </marker>
        </defs>

        {/* Grid Background */}
        <rect width="100%" height="100%" fill="url(#laboratory-grid-major)" className="canvas-bg" />

        {/* Transformed Laboratory workbench */}
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          
          {/* ================= SNAP LINES ================= */}
          {snapLines.map((line, idx) => (
            <line
              key={idx}
              x1={line.x !== undefined ? line.x : -5000}
              y1={line.y !== undefined ? line.y : -5000}
              x2={line.x !== undefined ? line.x : 5000}
              y2={line.y !== undefined ? line.y : 5000}
              stroke="#00ffcc"
              strokeWidth="0.8"
              strokeDasharray="4 4"
              opacity="0.75"
            />
          ))}

          {/* ================= RENDER CONNECTIONS ================= */}
          {connections.map((conn) => {
            const fromInst = instances.find((i) => i.id === conn.fromId);
            const toInst = instances.find((i) => i.id === conn.toId);
            if (!fromInst || !toInst) return null;

            const fromCoords = getAbsolutePortCoords(fromInst, conn.fromPort);
            const toCoords = getAbsolutePortCoords(toInst, conn.toPort);

            // Double clicking a connection deletes it
            const handleConnectionDoubleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              onDeleteConnection(conn.id);
            };

            if (conn.kind === "flow") {
              // RENDER OPTICAL / BEAM PATHS (laser streams)
              // Dynamically color coordinate beams based on wavelengths
              const wl = fromInst.parameters.wavelength || 532;
              let beamColor = "#ff0000";
              if (wl >= 380 && wl < 450) beamColor = "#d8b4fe";
              if (wl >= 450 && wl < 495) beamColor = "#3b82f6";
              if (wl >= 495 && wl < 570) beamColor = "#10b981";
              if (wl >= 570 && wl < 590) beamColor = "#fbbf24";
              if (wl >= 590 && wl < 620) beamColor = "#fb923c";

              return (
                <g key={conn.id} onDoubleClick={handleConnectionDoubleClick} className="canvas-beam">
                  {/* Background laser beam thick glow */}
                  <line
                    x1={fromCoords.x}
                    y1={fromCoords.y}
                    x2={toCoords.x}
                    y2={toCoords.y}
                    stroke={beamColor}
                    strokeWidth="6"
                    opacity={isSimulating ? "0.3" : "0.08"}
                    strokeLinecap="round"
                    filter="url(#laser-glow)"
                  />
                  {/* Core sharp laser beam */}
                  <line
                    x1={fromCoords.x}
                    y1={fromCoords.y}
                    x2={toCoords.x}
                    y2={toCoords.y}
                    stroke={beamColor}
                    strokeWidth="2.5"
                    strokeDasharray={isSimulating && fromInst.definitionId === "electron-gun" ? "8 6" : undefined}
                    opacity="0.9"
                    strokeLinecap="round"
                  >
                    {isSimulating && fromInst.definitionId === "electron-gun" && (
                      <animate attributeName="stroke-dashoffset" values="50;0" dur="2s" repeatCount="indefinite" />
                    )}
                  </line>

                  {/* Flowing particle streams & wave packet bullet pulses */}
                  {isSimulating && (
                    <>
                      {/* Particle bullets ••••••••> */}
                      <circle r="4" fill={beamColor} filter="url(#laser-glow)">
                        <animateMotion
                          path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`}
                          dur="1.2s"
                          begin="0s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="3.5" fill={beamColor} filter="url(#laser-glow)">
                        <animateMotion
                          path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`}
                          dur="1.2s"
                          begin="0.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="3" fill="#ffffff">
                        <animateMotion
                          path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`}
                          dur="1.2s"
                          begin="0.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            } else {
              // RENDER ELECTRICAL SIGNAL CABLES (Hanging bezier patch cables)
              const midX = (fromCoords.x + toCoords.x) / 2;
              // Add a "sag" factor representing cable weight falling under gravity
              const sag = Math.max(50, Math.abs(toCoords.x - fromCoords.x) * 0.2);
              const pathD = `M ${fromCoords.x} ${fromCoords.y} C ${midX} ${fromCoords.y + sag}, ${midX} ${toCoords.y + sag}, ${toCoords.x} ${toCoords.y}`;

              return (
                <g key={conn.id} onDoubleClick={handleConnectionDoubleClick} className="canvas-cable">
                  {/* Cable outline drop shadow */}
                  <path d={pathD} fill="none" stroke="#000000" strokeWidth="4" opacity="0.4" />
                  {/* Main patch cord cable body */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray={isSimulating ? "5 5" : undefined}
                  >
                    {isSimulating && (
                      <animate attributeName="stroke-dashoffset" values="30;0" dur="1s" repeatCount="indefinite" />
                    )}
                  </path>

                  {/* Flowing coax electrical pulse markers */}
                  {isSimulating && (
                    <>
                      <circle r="2.5" fill="#e2e8f0" filter="url(#neon-glow)">
                        <animateMotion
                          path={pathD}
                          dur="1.2s"
                          begin="0s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="2.5" fill="#e2e8f0" filter="url(#neon-glow)">
                        <animateMotion
                          path={pathD}
                          dur="1.2s"
                          begin="0.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            }
          })}

          {/* ================= DRAGGING CONNECTION PREVIEW ================= */}
          {activePort && tempLine && (
            <line
              x1={activePort.x}
              y1={activePort.y}
              x2={tempLine.x}
              y2={tempLine.y}
              stroke={activePort.kind === "beam" ? "#00ffcc" : "#a855f7"}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* ================= RENDER EQUIPMENT INSTANCES ================= */}
          {instances.map((instance) => {
            const isSelected = selectedIds.includes(instance.id);
            const definition = equipmentRegistry.find((def) => def.id === instance.definitionId);
            if (!definition) return null;

            const halfW = instance.size.width / 2;
            const halfH = instance.size.height / 2;

            // Handle dragging/selection for components
            const handleItemPointerDown = (e: PointerEvent) => {
              e.stopPropagation();
              const target = e.target as SVGElement;

              // Don't trigger dragging if clicking a port socket or handle
              if (target.closest(".port-dot") || target.closest(".resize-handle") || target.closest(".rotate-ring")) {
                return;
              }

              const coords = getCanvasCoords(e.clientX, e.clientY);

              // Multi-select holding shift key
              if (e.shiftKey) {
                if (isSelected) {
                  onSelect(selectedIds.filter((id) => id !== instance.id));
                } else {
                  onSelect([...selectedIds, instance.id]);
                }
              } else {
                if (!isSelected) {
                  onSelect([instance.id]);
                }
              }

              // Initialize dragging
              const startPositions = selectedIds.includes(instance.id)
                ? selectedIds.map((id) => {
                    const inst = instances.find((i) => i.id === id)!;
                    return { ...inst.position };
                  })
                : [{ ...instance.position }];

              dragRef.current = {
                type: "drag-item",
                startX: coords.x,
                startY: coords.y,
                itemId: instance.id,
                itemStartPos: startPositions,
              };

              target.setPointerCapture(e.pointerId);
            };

            // Resize handle pointer initiate
            const handleResizePointerDown = (e: PointerEvent, handle: string) => {
              e.stopPropagation();
              const coords = getCanvasCoords(e.clientX, e.clientY);
              dragRef.current = {
                type: "resize",
                startX: coords.x,
                startY: coords.y,
                itemId: instance.id,
                itemStartSize: { ...instance.size },
                itemStartPos: [{ ...instance.position }],
                resizeHandle: handle,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            };

            // Rotate ring pointer initiate
            const handleRotatePointerDown = (e: PointerEvent) => {
              e.stopPropagation();
              const coords = getCanvasCoords(e.clientX, e.clientY);
              dragRef.current = {
                type: "rotate",
                startX: coords.x,
                startY: coords.y,
                itemId: instance.id,
                itemStartRot: instance.rotation,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            };

            return (
              <g
                key={instance.id}
                transform={`translate(${instance.position.x} ${instance.position.y})`}
                className={`canvas-equipment-instance ${isSelected ? "is-selected" : ""}`}
              >
                {/* Visual wrapper containing SVG illustrations */}
                <g transform={`rotate(${instance.rotation})`}>
                  {/* Bounding box offset so that coordinates align with the center */}
                  <g transform={`translate(${-halfW} ${-halfH})`}>
                    <rect
                      width={instance.size.width}
                      height={instance.size.height}
                      fill="none"
                      stroke={isSelected ? "rgba(0, 255, 204, 0.4)" : "none"}
                      strokeWidth="1.5"
                      rx="4"
                      className="bounding-box-border"
                    />
                    
                    {/* Render actual inline stylized SVG asset */}
                    <foreignObject width={instance.size.width} height={instance.size.height}>
                      <div
                        onPointerDown={handleItemPointerDown}
                        style={{ width: "100%", height: "100%", cursor: "grab" }}
                      >
                        <EquipmentSVG
                          svgId={definition.svg}
                          width={instance.size.width}
                          height={instance.size.height}
                          parameters={instance.parameters}
                          isSelected={isSelected}
                          isSimulating={isSimulating}
                        />
                      </div>
                    </foreignObject>
                  </g>

                  {/* Render Port Sockets when selected or hovered */}
                  {definition.ports.map((port) => {
                    const localX = (port.position.x / 100) * instance.size.width - halfW;
                    const localY = (port.position.y / 100) * instance.size.height - halfH;

                    const isPortActive =
                      activePort && activePort.id === instance.id && activePort.portId === port.id;

                    return (
                      <circle
                        key={port.id}
                        cx={localX}
                        cy={localY}
                        r="5.5"
                        className={`port-dot ${port.type} ${port.kind} ${isPortActive ? "is-dragging" : ""}`}
                        onPointerDown={(e) => handlePortPointerDown(e, instance, port)}
                        onPointerUp={(e) => handlePortPointerUp(e, instance, port)}
                      >
                        <title>{`${port.label} (${port.kind})`}</title>
                      </circle>
                    );
                  })}
                </g>

                {/* Display Label text underneath the component */}
                <text x="0" y={halfH + 18} className="instance-label" textAnchor="middle">
                  {instance.name}
                </text>

                {/* ================= FIGMA/BLENDER SELECTION BORDERS & HANDLES ================= */}
                {isSelected && (
                  <g>
                    {/* Top Rotation Ring */}
                    <line x1="0" y1={-halfH} x2="0" y2={-halfH - 20} stroke="#00ffcc" strokeWidth="1.5" />
                    <circle
                      cx="0"
                      cy={-halfH - 22}
                      r="6"
                      className="rotate-ring"
                      onPointerDown={handleRotatePointerDown}
                    >
                      <title>Drag to Rotate (Hold Shift to snap)</title>
                    </circle>

                    {/* Corner Resize Handles */}
                    {/* Top Left */}
                    <rect
                      x={-halfW - 4}
                      y={-halfH - 4}
                      width="8"
                      height="8"
                      className="resize-handle tl"
                      onPointerDown={(e) => handleResizePointerDown(e, "tl")}
                    />
                    {/* Top Right */}
                    <rect
                      x={halfW - 4}
                      y={-halfH - 4}
                      width="8"
                      height="8"
                      className="resize-handle tr"
                      onPointerDown={(e) => handleResizePointerDown(e, "tr")}
                    />
                    {/* Bottom Left */}
                    <rect
                      x={-halfW - 4}
                      y={halfH - 4}
                      width="8"
                      height="8"
                      className="resize-handle bl"
                      onPointerDown={(e) => handleResizePointerDown(e, "bl")}
                    />
                    {/* Bottom Right */}
                    <rect
                      x={halfW - 4}
                      y={halfH - 4}
                      width="8"
                      height="8"
                      className="resize-handle br"
                      onPointerDown={(e) => handleResizePointerDown(e, "br")}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* ================= SELECTION BOX PREVIEW ================= */}
          {selectionStart && selectionEnd && (
            <rect
              x={Math.min(selectionStart.x, selectionEnd.x)}
              y={Math.min(selectionStart.y, selectionEnd.y)}
              width={Math.abs(selectionStart.x - selectionEnd.x)}
              height={Math.abs(selectionStart.y - selectionEnd.y)}
              className="selection-marquee"
            />
          )}

        </g>
      </svg>

      {/* Powder Toy Canvas MiniMap Navigator */}
      <div className="canvas-minimap" title="Canvas Minimap Viewport">
        <svg viewBox="-500 -500 1000 1000" className="minimap-svg">
          <rect x="-500" y="-500" width="1000" height="1000" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="8" rx="20" />
          
          {/* Render Equipment Position Dots */}
          {instances.map((inst) => (
            <circle key={inst.id} cx={inst.position.x} cy={inst.position.y} r="22" fill="#2563eb" />
          ))}

          {/* Current Pan/Zoom Viewport Bounds */}
          <rect
            x={-pan.x / zoom - 300}
            y={-pan.y / zoom - 200}
            width={600 / zoom}
            height={400 / zoom}
            fill="rgba(37, 99, 235, 0.12)"
            stroke="#2563eb"
            strokeWidth="14"
            rx="10"
          />
        </svg>
      </div>

      <p className="canvas-help">
        Drag items from sidebar · Pointer-drag to move · Scroll wheel to zoom · Shift+Drag background to multi-select box · Click sockets to link cabling · Del key to delete
      </p>
    </section>
  );
}
