import { useRef, useState, useEffect, type PointerEvent, type DragEvent } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";
import { equipmentRegistry } from "../data/equipmentRegistry";
import { EquipmentSVG } from "./EquipmentSVG";

type WebGLCanvasProps = {
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

export function WebGLCanvas({
  instances,
  connections,
  selectedIds,
  isSimulating,
  onSelect,
  onUpdateInstance,
  onAddInstance,
  onAddConnection,
  onDeleteConnection: _onDeleteConnection,
  onDeleteSelected,
  onDuplicateSelected,
}: WebGLCanvasProps) {
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [visMode, setVisMode] = useState<"waves" | "beam" | "particle" | "probability">("waves");
  const [propSpeed, setPropSpeed] = useState(5.0);
  const [activePort, setActivePort] = useState<{
    id: string;
    portId: string;
    type: "input" | "output";
    kind: "beam" | "signal";
    x: number;
    y: number;
  } | null>(null);
  const [tempLine, setTempLine] = useState<{ x: number; y: number } | null>(null);

  // Selection box state
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [portMismatchToast, setPortMismatchToast] = useState<string | null>(null);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const dragRef = useRef<{
    type: "pan" | "drag-item" | "resize" | "rotate" | "select-box" | null;
    startX: number;
    startY: number;
    panStart?: { x: number; y: number };
    itemStartPos?: { x: number; y: number }[];
    itemStartSize?: { width: number; height: number };
    itemStartRot?: number;
    resizeHandle?: string;
    itemId?: string;
  }>({ type: null, startX: 0, startY: 0 });

  // WebGL / Canvas 2D Wave Propagation Shader Renderer
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const renderWaveField = () => {
      time += 0.03 * (propSpeed / 5);
      const width = canvas.width;
      const height = canvas.height;

      // Dark quantum background
      ctx.fillStyle = "#050814";
      ctx.fillRect(0, 0, width, height);

      // Render quantum dot grid pattern
      const gridSize = 30 * zoom;
      const offsetX = (pan.x * zoom) % gridSize;
      const offsetY = (pan.y * zoom) % gridSize;

      ctx.fillStyle = "rgba(0, 240, 255, 0.07)";
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }

      // If active instances exist, render WebGL-style wave field interference gradients
      if (instances.length > 0) {
        instances.forEach((inst) => {
          const screenX = (inst.position.x + pan.x) * zoom;
          const screenY = (inst.position.y + pan.y) * zoom;

          if (isSimulating || visMode === "waves") {
            const grad = ctx.createRadialGradient(screenX, screenY, 5, screenX, screenY, 140 * zoom);
            if (visMode === "waves") {
              const pulse = Math.sin(time * 4) * 0.15 + 0.25;
              grad.addColorStop(0, `rgba(0, 240, 255, ${pulse})`);
              grad.addColorStop(0.5, `rgba(59, 130, 246, ${pulse * 0.5})`);
              grad.addColorStop(1, "rgba(5, 8, 20, 0)");
            } else if (visMode === "beam") {
              grad.addColorStop(0, "rgba(0, 255, 170, 0.35)");
              grad.addColorStop(1, "rgba(5, 8, 20, 0)");
            } else if (visMode === "probability") {
              grad.addColorStop(0, "rgba(217, 70, 239, 0.3)");
              grad.addColorStop(1, "rgba(5, 8, 20, 0)");
            } else {
              grad.addColorStop(0, "rgba(234, 179, 8, 0.3)");
              grad.addColorStop(1, "rgba(5, 8, 20, 0)");
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 140 * zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      animId = requestAnimationFrame(renderWaveField);
    };

    renderWaveField();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [instances, isSimulating, visMode, propSpeed, zoom, pan]);

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = bgCanvasRef.current.parentElement?.clientWidth || 800;
        bgCanvasRef.current.height = bgCanvasRef.current.parentElement?.clientHeight || 600;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Screen to Canvas coordinate transform
  const screenToWorld = (screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = screenX - rect.left;
    const rawY = screenY - rect.top;
    return {
      x: (rawX - pan.x * zoom) / zoom,
      y: (rawY - pan.y * zoom) / zoom,
    };
  };

  // Grid snap helper (10px grid)
  const snapToGrid = (val: number) => Math.round(val / 10) * 10;

  // Keyboard shortcuts (Del / Backspace / Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Pointer event handlers
  const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      dragRef.current = {
        type: "pan",
        startX: e.clientX,
        startY: e.clientY,
        panStart: { ...pan },
      };
      return;
    }

    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === "svg") {
      onSelect([]);
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setSelectionStart(worldPos);
      setSelectionEnd(worldPos);
      dragRef.current = {
        type: "select-box",
        startX: e.clientX,
        startY: e.clientY,
      };
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (dragRef.current.type === "pan" && dragRef.current.panStart) {
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      setPan({
        x: dragRef.current.panStart.x + dx,
        y: dragRef.current.panStart.y + dy,
      });
      return;
    }

    if (dragRef.current.type === "select-box") {
      const currentWorld = screenToWorld(e.clientX, e.clientY);
      setSelectionEnd(currentWorld);
      return;
    }

    if (dragRef.current.type === "drag-item" && dragRef.current.itemStartPos) {
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;

      selectedIds.forEach((id, index) => {
        const start = dragRef.current.itemStartPos![index];
        if (start) {
          onUpdateInstance(id, {
            position: {
              x: snapToGrid(start.x + dx),
              y: snapToGrid(start.y + dy),
            },
          });
        }
      });
      return;
    }

    if (activePort) {
      setTempLine(screenToWorld(e.clientX, e.clientY));
    }
  };

  const handlePointerUp = () => {
    if (dragRef.current.type === "select-box" && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      const enclosed = instances.filter((inst) => {
        const def = equipmentRegistry.find((d) => d.id === inst.definitionId);
        const w = inst.size?.width || def?.defaultSize?.width || 80;
        const h = inst.size?.height || def?.defaultSize?.height || 60;
        return (
          inst.position.x >= minX &&
          inst.position.x + w <= maxX &&
          inst.position.y >= minY &&
          inst.position.y + h <= maxY
        );
      });
      onSelect(enclosed.map((i) => i.id));
    }

    dragRef.current = { type: null, startX: 0, startY: 0 };
    setSelectionStart(null);
    setSelectionEnd(null);
    setActivePort(null);
    setTempLine(null);
  };

  // Drop equipment onto canvas
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const definitionId = e.dataTransfer.getData("application/react-flow") || e.dataTransfer.getData("text/plain");
    const def = equipmentRegistry.find((d) => d.id === definitionId);
    if (!definitionId || !def) return;

    const dropWorld = screenToWorld(e.clientX, e.clientY);
    const width = def.defaultSize?.width || 80;
    const height = def.defaultSize?.height || 60;

    const newInst: EquipmentInstance = {
      id: `${definitionId}-${Date.now().toString().substring(7)}`,
      definitionId,
      name: `${def.name} ${instances.filter((i) => i.definitionId === definitionId).length + 1}`,
      position: {
        x: snapToGrid(dropWorld.x - width / 2),
        y: snapToGrid(dropWorld.y - height / 2),
      },
      rotation: 0,
      size: { width, height },
      parameters: {},
    };

    onAddInstance(newInst);
    onSelect([newInst.id]);
  };

  // Wheel Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.5);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setPan({
        x: mouseX / newZoom - (mouseX / zoom - pan.x),
        y: mouseY / newZoom - (mouseY / zoom - pan.y),
      });
    }
    setZoom(newZoom);
  };

  return (
    <div className="webgl-canvas-shell" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Background WebGL / Canvas 2D Wave Propagation Shader Layer */}
      <canvas
        ref={bgCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Floating Canvas Visualization Bar */}
      <div
        className="canvas-floating-bar"
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 16px",
          borderRadius: "30px",
          background: "rgba(10, 14, 28, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0, 240, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          VISUALIZATION MODE:
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "waves", label: "〰〰 Wave" },
            { id: "beam", label: "──➔ Beam" },
            { id: "particle", label: "•••• Particle" },
            { id: "probability", label: "█ Probability" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setVisMode(mode.id as any)}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "16px",
                background: visMode === mode.id ? "rgba(0, 240, 255, 0.2)" : "transparent",
                color: visMode === mode.id ? "#00f0ff" : "#94a3b8",
                border: visMode === mode.id ? "1px solid rgba(0, 240, 255, 0.4)" : "1px solid transparent",
                transition: "all 0.18s ease",
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div style={{ height: "16px", width: "1px", background: "rgba(255, 255, 255, 0.1)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>Speed c: {propSpeed.toFixed(1)} tiles/s</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={propSpeed}
            onChange={(e) => setPropSpeed(parseFloat(e.target.value))}
            style={{ width: "80px", accentColor: "#00f0ff", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* SVG Workspace Vector Overlay */}
      <svg
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          cursor: dragRef.current.type === "pan" ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onWheel={handleWheel}
      >
        <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
          {/* Render Connections / Cables / Optical Beams */}
          {connections.map((conn) => {
            const fromInst = instances.find((i) => i.id === conn.fromId);
            const toInst = instances.find((i) => i.id === conn.toId);
            if (!fromInst || !toInst) return null;

            const fromDef = equipmentRegistry.find((d) => d.id === fromInst.definitionId);
            const toDef = equipmentRegistry.find((d) => d.id === toInst.definitionId);

            const fromPort = fromDef?.ports?.find((p) => p.id === conn.fromPort);
            const toPort = toDef?.ports?.find((p) => p.id === conn.toPort);

            const fromX = fromInst.position.x + (fromPort?.position?.x || 40);
            const fromY = fromInst.position.y + (fromPort?.position?.y || 30);
            const toX = toInst.position.x + (toPort?.position?.x || 40);
            const toY = toInst.position.y + (toPort?.position?.y || 30);

            return (
              <g key={conn.id}>
                {/* Glow outline */}
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="#00f0ff"
                  strokeWidth={isSimulating ? 5 : 3}
                  strokeOpacity={0.25}
                  strokeLinecap="round"
                />
                {/* Core ray / signal */}
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={conn.kind === "measurement" ? "#c084fc" : "#00ffaa"}
                  strokeWidth={2}
                  strokeDasharray={isSimulating ? "6 4" : undefined}
                >
                  {isSimulating && (
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  )}
                </line>
              </g>
            );
          })}

          {/* Active Wire Dragging Line */}
          {activePort && tempLine && (
            <line
              x1={activePort.x}
              y1={activePort.y}
              x2={tempLine.x}
              y2={tempLine.y}
              stroke="#00f0ff"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {/* Selection Marquee Box */}
          {selectionStart && selectionEnd && (
            <rect
              x={Math.min(selectionStart.x, selectionEnd.x)}
              y={Math.min(selectionStart.y, selectionEnd.y)}
              width={Math.abs(selectionEnd.x - selectionStart.x)}
              height={Math.abs(selectionEnd.y - selectionStart.y)}
              fill="rgba(0, 240, 255, 0.08)"
              stroke="#00f0ff"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}

          {/* Render Equipment Component Nodes */}
          {instances.map((inst) => {
            const def = equipmentRegistry.find((d) => d.id === inst.definitionId);
            const isSelected = selectedIds.includes(inst.id);
            const w = inst.size?.width || def?.defaultSize?.width || 80;
            const h = inst.size?.height || def?.defaultSize?.height || 60;

            return (
              <g
                key={inst.id}
                transform={`translate(${inst.position.x}, ${inst.position.y}) rotate(${inst.rotation || 0}, ${w / 2}, ${h / 2})`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!isSelected) {
                    if (e.shiftKey) {
                      onSelect([...selectedIds, inst.id]);
                    } else {
                      onSelect([inst.id]);
                    }
                  }
                  dragRef.current = {
                    type: "drag-item",
                    startX: e.clientX,
                    startY: e.clientY,
                    itemStartPos: selectedIds.includes(inst.id)
                      ? selectedIds.map((id) => instances.find((i) => i.id === id)!.position)
                      : [inst.position],
                  };
                }}
              >
                {/* Sleek Selection Box when selected */}
                {isSelected && (
                  <rect
                    width={w}
                    height={h}
                    rx={6}
                    fill="rgba(0, 240, 255, 0.05)"
                    stroke="#00f0ff"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))",
                    }}
                  />
                )}

                {/* SVG Vector Apparatus */}
                <EquipmentSVG
                  svgId={def?.svg || inst.definitionId}
                  width={w}
                  height={h}
                  parameters={inst.parameters || {}}
                  isSelected={isSelected}
                  isSimulating={isSimulating}
                />

                {/* Label */}
                <text
                  x={w / 2}
                  y={h + 16}
                  textAnchor="middle"
                  fill={isSelected ? "#00f0ff" : "#94a3b8"}
                  fontSize={10}
                  fontWeight={700}
                >
                  {inst.name}
                </text>

                {/* Sockets / Port Dots */}
                {def?.ports?.map((port) => (
                  <circle
                    key={port.id}
                    cx={port.position?.x || 0}
                    cy={port.position?.y || 0}
                    r={5}
                    fill={port.type === "input" ? "#ef4444" : "#10b981"}
                    stroke="#050814"
                    strokeWidth={1.5}
                    style={{ cursor: "pointer" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActivePort({
                        id: inst.id,
                        portId: port.id,
                        type: port.type,
                        kind: port.kind,
                        x: inst.position.x + (port.position?.x || 0),
                        y: inst.position.y + (port.position?.y || 0),
                      });
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      if (activePort && activePort.id !== inst.id) {
                        if (activePort.type === port.type) {
                          setPortMismatchToast("Cannot connect Input to Input or Output to Output!");
                          setTimeout(() => setPortMismatchToast(null), 3000);
                          return;
                        }
                        const fromInstId = activePort.type === "output" ? activePort.id : inst.id;
                        const fromPortId = activePort.type === "output" ? activePort.portId : port.id;
                        const toInstId = activePort.type === "input" ? activePort.id : inst.id;
                        const toPortId = activePort.type === "input" ? activePort.portId : port.id;

                        onAddConnection({
                          id: `conn-${Date.now()}`,
                          fromId: fromInstId,
                          fromPort: fromPortId,
                          toId: toInstId,
                          toPort: toPortId,
                          kind: "flow",
                        });
                        setActivePort(null);
                        setTempLine(null);
                      }
                    }}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Port mismatch error toast */}
      {portMismatchToast && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            background: "#ef4444",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 800,
            boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
          }}
        >
          ⚠ {portMismatchToast}
        </div>
      )}

      {/* Bottom Canvas Help Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          fontSize: "10px",
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.4)",
          pointerEvents: "none",
        }}
      >
        Drag items from sidebar • Pointer-drag to move • Scroll wheel to zoom • Alt+Drag background to pan • Del key to delete
      </div>
    </div>
  );
}
