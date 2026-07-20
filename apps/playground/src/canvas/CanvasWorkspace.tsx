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
  const [visMode, setVisMode] = useState<"waves" | "beam" | "detections" | "probability">("waves");
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
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);
  const [portMismatchToast, setPortMismatchToast] = useState<string | null>(null);

  const canvasRef = useRef<SVGSVGElement | null>(null);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") onDeleteSelected();
      else if (e.key === "d" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onDuplicateSelected(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDeleteSelected, onDuplicateSelected]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  };

  const getAbsolutePortCoords = (instance: EquipmentInstance, portId: string) => {
    const definition = equipmentRegistry.find((def) => def.id === instance.definitionId);
    if (!definition) return { x: instance.position.x, y: instance.position.y };
    const port = definition.ports.find((p) => p.id === portId);
    if (!port) return { x: instance.position.x, y: instance.position.y };
    const halfW = instance.size.width / 2;
    const halfH = instance.size.height / 2;
    const localX = (port.position.x / 100) * instance.size.width - halfW;
    const localY = (port.position.y / 100) * instance.size.height - halfH;
    const rad = (instance.rotation * Math.PI) / 180;
    const rotX = localX * Math.cos(rad) - localY * Math.sin(rad);
    const rotY = localX * Math.sin(rad) + localY * Math.cos(rad);
    return { x: instance.position.x + rotX, y: instance.position.y + rotY };
  };

  const gridSpacing = 20;
  const calculateSnap = (val: number) => Math.round(val / 10) * 10;

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.2, Math.min(3, nextZoom)));
  };

  const handlePointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const isCanvasBg = target.classList.contains("canvas-bg") || target.nodeName === "svg";
    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (activePort && !target.closest(".port-dot")) {
      setActivePort(null);
      setTempLine(null);
      return;
    }

    if (isCanvasBg) {
      if (e.button === 0 && e.shiftKey) {
        dragRef.current = { type: "select-box", startX: coords.x, startY: coords.y };
        setSelectionStart(coords);
        setSelectionEnd(coords);
      } else {
        dragRef.current = { type: "pan", startX: e.clientX, startY: e.clientY, panStart: { ...pan } };
      }
      onSelect([]);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag.type) {
      if (activePort) {
        setTempLine(getCanvasCoords(e.clientX, e.clientY));
      }
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (drag.type === "pan" && drag.panStart) {
      setPan({ x: drag.panStart.x + (e.clientX - drag.startX), y: drag.panStart.y + (e.clientY - drag.startY) });
    } else if (drag.type === "select-box" && selectionStart) {
      setSelectionEnd(coords);
      const minX = Math.min(selectionStart.x, coords.x);
      const maxX = Math.max(selectionStart.x, coords.x);
      const minY = Math.min(selectionStart.y, coords.y);
      const maxY = Math.max(selectionStart.y, coords.y);
      onSelect(instances.filter((inst) => inst.position.x >= minX && inst.position.x <= maxX && inst.position.y >= minY && inst.position.y <= maxY).map((inst) => inst.id));
    } else if (drag.type === "drag-item" && drag.itemId && drag.itemStartPos) {
      const dx = coords.x - drag.startX;
      const dy = coords.y - drag.startY;
      const rawX = drag.itemStartPos[0].x + dx;
      const rawY = drag.itemStartPos[0].y + dy;
      const snapLinesList: { x?: number; y?: number }[] = [];
      let finalX = calculateSnap(rawX);
      let finalY = calculateSnap(rawY);

      instances.forEach((inst) => {
        if (selectedIds.includes(inst.id)) return;
        if (Math.abs(inst.position.x - rawX) < 12) { finalX = inst.position.x; snapLinesList.push({ x: inst.position.x }); }
        if (Math.abs(inst.position.y - rawY) < 12) { finalY = inst.position.y; snapLinesList.push({ y: inst.position.y }); }
      });

      setSnapLines(snapLinesList);
      const deltaX = finalX - drag.itemStartPos[0].x;
      const deltaY = finalY - drag.itemStartPos[0].y;
      selectedIds.forEach((id, idx) => {
        if (drag.itemStartPos && drag.itemStartPos[idx]) {
          onUpdateInstance(id, { position: { x: drag.itemStartPos[idx].x + deltaX, y: drag.itemStartPos[idx].y + deltaY } });
        }
      });
    } else if (drag.type === "resize" && drag.itemId && drag.itemStartSize) {
      const instance = instances.find((i) => i.id === drag.itemId);
      if (!instance) return;
      const dx = coords.x - drag.startX;
      const dy = coords.y - drag.startY;
      const rad = (instance.rotation * Math.PI) / 180;
      const localDx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
      const localDy = dx * Math.sin(-rad) + dy * Math.cos(-rad);

      let nextW = drag.itemStartSize.width;
      let nextH = drag.itemStartSize.height;
      if (drag.resizeHandle === "tr") { nextW = Math.max(30, drag.itemStartSize.width + localDx * 2); nextH = Math.max(30, drag.itemStartSize.height - localDy * 2); }
      else if (drag.resizeHandle === "br") { nextW = Math.max(30, drag.itemStartSize.width + localDx * 2); nextH = Math.max(30, drag.itemStartSize.height + localDy * 2); }
      else if (drag.resizeHandle === "bl") { nextW = Math.max(30, drag.itemStartSize.width - localDx * 2); nextH = Math.max(30, drag.itemStartSize.height + localDy * 2); }
      else if (drag.resizeHandle === "tl") { nextW = Math.max(30, drag.itemStartSize.width - localDx * 2); nextH = Math.max(30, drag.itemStartSize.height - localDy * 2); }

      onUpdateInstance(drag.itemId, { size: { width: Math.round(nextW / 10) * 10, height: Math.round(nextH / 10) * 10 } });
    } else if (drag.type === "rotate" && drag.itemId) {
      const instance = instances.find((i) => i.id === drag.itemId);
      if (!instance) return;
      let angle = (Math.atan2(coords.y - instance.position.y, coords.x - instance.position.x) * 180) / Math.PI + 90;
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      onUpdateInstance(drag.itemId, { rotation: (angle + 360) % 360 });
    }
  };

  const handlePointerUp = (e: PointerEvent<SVGSVGElement>) => {
    dragRef.current = { type: null, startX: 0, startY: 0 };
    setSelectionStart(null);
    setSelectionEnd(null);
    setSnapLines([]);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDragOver = (e: DragEvent<HTMLElement | SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLElement | SVGSVGElement>) => {
    e.preventDefault();
    const definitionId = e.dataTransfer.getData("application/react-flow") || e.dataTransfer.getData("text/plain");
    if (!definitionId) return;
    const definition = equipmentRegistry.find((def) => def.id === definitionId);
    if (!definition) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const newInstance: EquipmentInstance = {
      id: `${definitionId}-${Date.now().toString().substring(7)}`,
      definitionId,
      name: `${definition.name} ${instances.filter((i) => i.definitionId === definitionId).length + 1}`,
      position: { x: calculateSnap(coords.x), y: calculateSnap(coords.y) },
      rotation: 0,
      size: { ...definition.defaultSize },
      parameters: definition.inspector.reduce((acc, field) => { acc[field.id] = field.defaultValue; return acc; }, {} as Record<string, any>),
    };
    onAddInstance(newInstance);
    onSelect([newInstance.id]);
  };

  const handlePortPointerDown = (e: PointerEvent, instance: EquipmentInstance, port: { id: string; type: "input" | "output"; kind: "beam" | "signal" }) => {
    e.stopPropagation();
    const absCoords = getAbsolutePortCoords(instance, port.id);
    setActivePort({ id: instance.id, portId: port.id, type: port.type, kind: port.kind, x: absCoords.x, y: absCoords.y });
    setTempLine(absCoords);
  };

  const handlePortPointerUp = (e: PointerEvent, targetInstance: EquipmentInstance, targetPort: { id: string; type: "input" | "output"; kind: "beam" | "signal" }) => {
    e.stopPropagation();
    if (!activePort || activePort.id === targetInstance.id) { setActivePort(null); setTempLine(null); return; }
    if (activePort.type === targetPort.type) { setActivePort(null); setTempLine(null); return; }
    if (activePort.kind !== targetPort.kind) {
      setPortMismatchToast("Port kind mismatch: beam ports cannot connect to signal ports.");
      setActivePort(null);
      setTempLine(null);
      return;
    }
    const fromId = activePort.type === "output" ? activePort.id : targetInstance.id;
    const fromPort = activePort.type === "output" ? activePort.portId : targetPort.id;
    const toId = activePort.type === "input" ? activePort.id : targetInstance.id;
    const toPort = activePort.type === "input" ? activePort.portId : targetPort.id;
    onAddConnection({ id: `${fromId}-${fromPort}-to-${toId}-${toPort}`, fromId, fromPort, toId, toPort, kind: activePort.kind === "beam" ? "flow" : "measurement" });
    setActivePort(null);
    setTempLine(null);
  };

  return (
    <section className="canvas-shell" aria-label="Quantum workspace" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="canvas-caption">
        <div className="flytrap-mode-bar">
          <span className="mode-bar-title">VIS MODE:</span>
          {(["waves", "beam", "detections", "probability"] as const).map((mode) => (
            <button key={mode} className={`v-mode-btn ${visMode === mode ? "active" : ""}`} onClick={() => setVisMode(mode)}>
              {mode === "waves" ? "Wave" : mode === "beam" ? "Beam" : mode === "detections" ? "Particle" : "Probability"}
            </button>
          ))}
        </div>
        <div className="flytrap-speed-bar">
          <span>Speed: {propSpeed.toFixed(1)}</span>
          <input type="range" min="1.0" max="10.0" step="0.5" value={propSpeed} onChange={(e) => setPropSpeed(parseFloat(e.target.value))} className="speed-slider" />
        </div>
      </div>

      {portMismatchToast && (
        <div className="port-mismatch-banner">
          <span>{portMismatchToast}</span>
          <button onClick={() => setPortMismatchToast(null)}>X</button>
        </div>
      )}

      <svg ref={canvasRef} className="canvas"
        onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        onDragOver={handleDragOver} onDrop={handleDrop}
      >
        <defs>
          <pattern id="laboratory-grid" width={gridSpacing} height={gridSpacing} patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            <path d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`} fill="none" stroke="rgba(153,153,153,0.12)" strokeWidth="0.5" />
          </pattern>
          <pattern id="laboratory-grid-major" width={gridSpacing * 5} height={gridSpacing * 5} patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            <rect width={gridSpacing * 5} height={gridSpacing * 5} fill="url(#laboratory-grid)" />
            <path d={`M ${gridSpacing * 5} 0 L 0 0 0 ${gridSpacing * 5}`} fill="none" stroke="rgba(153,153,153,0.2)" strokeWidth="0.8" />
          </pattern>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="var(--bg-base)" className="canvas-bg" />
        <rect width="100%" height="100%" fill="url(#laboratory-grid-major)" className="canvas-bg" />

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {snapLines.map((line, idx) => (
            <line key={idx}
              x1={line.x !== undefined ? line.x : -5000} y1={line.y !== undefined ? line.y : -5000}
              x2={line.x !== undefined ? line.x : 5000} y2={line.y !== undefined ? line.y : 5000}
              stroke="var(--accent-alt)" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.5"
            />
          ))}

          {connections.map((conn) => {
            const fromInst = instances.find((i) => i.id === conn.fromId);
            const toInst = instances.find((i) => i.id === conn.toId);
            if (!fromInst || !toInst) return null;
            const fromCoords = getAbsolutePortCoords(fromInst, conn.fromPort);
            const toCoords = getAbsolutePortCoords(toInst, conn.toPort);

            const handleConnDblClick = (e: React.MouseEvent) => { e.stopPropagation(); onDeleteConnection(conn.id); };

            if (conn.kind === "flow") {
              const wl = fromInst.parameters.wavelength || 532;
              let beamColor = "#CC3333";
              if (wl >= 380 && wl < 450) beamColor = "#9966CC";
              else if (wl >= 450 && wl < 495) beamColor = "#5682C4";
              else if (wl >= 495 && wl < 570) beamColor = "#47833E";
              else if (wl >= 570 && wl < 590) beamColor = "#D4922A";
              else if (wl >= 590 && wl < 620) beamColor = "#CC6633";

              return (
                <g key={conn.id} onDoubleClick={handleConnDblClick} className="canvas-beam">
                  <line x1={fromCoords.x} y1={fromCoords.y} x2={toCoords.x} y2={toCoords.y}
                    stroke={beamColor} strokeWidth="5" opacity={isSimulating ? "0.25" : "0.06"} strokeLinecap="round" filter="url(#laser-glow)" />
                  <line x1={fromCoords.x} y1={fromCoords.y} x2={toCoords.x} y2={toCoords.y}
                    stroke={beamColor} strokeWidth="2" strokeLinecap="round" opacity="0.85"
                    strokeDasharray={isSimulating && fromInst.definitionId === "electron-gun" ? "6 4" : undefined}>
                    {isSimulating && fromInst.definitionId === "electron-gun" && (
                      <animate attributeName="stroke-dashoffset" values="50;0" dur="2s" repeatCount="indefinite" />
                    )}
                  </line>
                  {isSimulating && (
                    <>
                      <circle r="3" fill={beamColor} filter="url(#laser-glow)">
                        <animateMotion path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`} dur="1.2s" begin="0s" repeatCount="indefinite" />
                      </circle>
                      <circle r="2.5" fill={beamColor} filter="url(#laser-glow)">
                        <animateMotion path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`} dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                      </circle>
                      <circle r="2" fill="#E8E8E8">
                        <animateMotion path={`M ${fromCoords.x} ${fromCoords.y} L ${toCoords.x} ${toCoords.y}`} dur="1.2s" begin="0.8s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                </g>
              );
            } else {
              const midX = (fromCoords.x + toCoords.x) / 2;
              const sag = Math.max(40, Math.abs(toCoords.x - fromCoords.x) * 0.15);
              const pathD = `M ${fromCoords.x} ${fromCoords.y} C ${midX} ${fromCoords.y + sag}, ${midX} ${toCoords.y + sag}, ${toCoords.x} ${toCoords.y}`;
              return (
                <g key={conn.id} onDoubleClick={handleConnDblClick} className="canvas-cable">
                  <path d={pathD} fill="none" stroke="#000" strokeWidth="3" opacity="0.3" />
                  <path d={pathD} fill="none" stroke="#9966CC" strokeWidth="2" strokeDasharray={isSimulating ? "4 4" : undefined}>
                    {isSimulating && <animate attributeName="stroke-dashoffset" values="30;0" dur="1s" repeatCount="indefinite" />}
                  </path>
                  {isSimulating && (
                    <circle r="2" fill="#E8E8E8" filter="url(#neon-glow)">
                      <animateMotion path={pathD} dur="1.2s" begin="0s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            }
          })}

          {activePort && tempLine && (
            <line x1={activePort.x} y1={activePort.y} x2={tempLine.x} y2={tempLine.y}
              stroke={activePort.kind === "beam" ? "var(--accent)" : "#9966CC"} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
          )}

          {instances.map((instance) => {
            const isSelected = selectedIds.includes(instance.id);
            const definition = equipmentRegistry.find((def) => def.id === instance.definitionId);
            if (!definition) return null;
            const halfW = instance.size.width / 2;
            const halfH = instance.size.height / 2;

            const handleItemPointerDown = (e: PointerEvent) => {
              e.stopPropagation();
              const target = e.target as SVGElement;
              if (target.closest(".port-dot") || target.closest(".resize-handle") || target.closest(".rotate-ring")) return;
              const coords = getCanvasCoords(e.clientX, e.clientY);
              if (e.shiftKey) { onSelect(isSelected ? selectedIds.filter((id) => id !== instance.id) : [...selectedIds, instance.id]); }
              else if (!isSelected) onSelect([instance.id]);
              const startPositions = selectedIds.includes(instance.id) ? selectedIds.map((id) => ({ ...instances.find((i) => i.id === id)!.position })) : [{ ...instance.position }];
              dragRef.current = { type: "drag-item", startX: coords.x, startY: coords.y, itemId: instance.id, itemStartPos: startPositions };
              target.setPointerCapture(e.pointerId);
            };

            const handleResizePointerDown = (e: PointerEvent, handle: string) => {
              e.stopPropagation();
              const coords = getCanvasCoords(e.clientX, e.clientY);
              dragRef.current = { type: "resize", startX: coords.x, startY: coords.y, itemId: instance.id, itemStartSize: { ...instance.size }, itemStartPos: [{ ...instance.position }], resizeHandle: handle };
              e.currentTarget.setPointerCapture(e.pointerId);
            };

            const handleRotatePointerDown = (e: PointerEvent) => {
              e.stopPropagation();
              const coords = getCanvasCoords(e.clientX, e.clientY);
              dragRef.current = { type: "rotate", startX: coords.x, startY: coords.y, itemId: instance.id, itemStartRot: instance.rotation };
              e.currentTarget.setPointerCapture(e.pointerId);
            };

            return (
              <g key={instance.id} transform={`translate(${instance.position.x} ${instance.position.y})`} className={`canvas-equipment-instance ${isSelected ? "is-selected" : ""}`}>
                <g transform={`rotate(${instance.rotation})`}>
                  <g transform={`translate(${-halfW} ${-halfH})`}>
                    <rect width={instance.size.width} height={instance.size.height}
                      fill="none" stroke={isSelected ? "var(--accent-alt)" : "none"} strokeWidth="1.5" rx="3" className="bounding-box-border" />
                    <foreignObject width={instance.size.width} height={instance.size.height}>
                      <div onPointerDown={handleItemPointerDown} style={{ width: "100%", height: "100%", cursor: "grab" }}>
                        <EquipmentSVG svgId={definition.svg} width={instance.size.width} height={instance.size.height} parameters={instance.parameters} isSelected={isSelected} isSimulating={isSimulating} />
                      </div>
                    </foreignObject>
                  </g>

                  {definition.ports.map((port) => {
                    const localX = (port.position.x / 100) * instance.size.width - halfW;
                    const localY = (port.position.y / 100) * instance.size.height - halfH;
                    const isPortActive = activePort && activePort.id === instance.id && activePort.portId === port.id;
                    return (
                      <circle key={port.id} cx={localX} cy={localY} r="5" className={`port-dot ${port.type} ${port.kind} ${isPortActive ? "is-dragging" : ""}`}
                        onPointerDown={(e) => handlePortPointerDown(e, instance, port)}
                        onPointerUp={(e) => handlePortPointerUp(e, instance, port)}>
                        <title>{`${port.label} (${port.kind})`}</title>
                      </circle>
                    );
                  })}
                </g>

                <text x="0" y={halfH + 14} className="instance-label" textAnchor="middle">{instance.name}</text>

                {isSelected && (
                  <g>
                    <line x1="0" y1={-halfH} x2="0" y2={-halfH - 18} stroke="var(--accent)" strokeWidth="1" />
                    <circle cx="0" cy={-halfH - 20} r="5" className="rotate-ring" onPointerDown={handleRotatePointerDown}>
                      <title>Drag to Rotate (Shift to snap)</title>
                    </circle>
                    {[{ cls: "tl", x: -halfW - 3, y: -halfH - 3 }, { cls: "tr", x: halfW - 3, y: -halfH - 3 }, { cls: "bl", x: -halfW - 3, y: halfH - 3 }, { cls: "br", x: halfW - 3, y: halfH - 3 }].map((h) => (
                      <rect key={h.cls} x={h.x} y={h.y} width="6" height="6" className={`resize-handle ${h.cls}`} onPointerDown={(e) => handleResizePointerDown(e, h.cls)} />
                    ))}
                  </g>
                )}
              </g>
            );
          })}

          {selectionStart && selectionEnd && (
            <rect x={Math.min(selectionStart.x, selectionEnd.x)} y={Math.min(selectionStart.y, selectionEnd.y)}
              width={Math.abs(selectionStart.x - selectionEnd.x)} height={Math.abs(selectionStart.y - selectionEnd.y)}
              className="selection-marquee" />
          )}
        </g>
      </svg>

      <div className="canvas-minimap" title="Canvas Minimap">
        <svg viewBox="-500 -500 1000 1000" className="minimap-svg">
          <rect x="-500" y="-500" width="1000" height="1000" fill="var(--bg-dark)" stroke="var(--border)" strokeWidth="8" rx="20" />
          {instances.map((inst) => (
            <circle key={inst.id} cx={inst.position.x} cy={inst.position.y} r="22" fill="var(--accent-alt)" />
          ))}
          <rect x={-pan.x / zoom - 300} y={-pan.y / zoom - 200} width={600 / zoom} height={400 / zoom}
            fill="rgba(86,130,196,0.08)" stroke="var(--accent-alt)" strokeWidth="12" rx="10" />
        </svg>
      </div>

      <p className="canvas-help">
        Drag items from sidebar | Pointer-drag to move | Scroll to zoom | Shift+Drag for box select | Click sockets to link | Del to delete
      </p>
    </section>
  );
}
