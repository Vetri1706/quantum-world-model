import { useState, useMemo, useEffect } from "react";
import type { EquipmentInstance, CanvasConnection, EquipmentDefinition, PlaygroundModel, PlaygroundComponent, PlaygroundConnection, PlaygroundControl } from "./types/playground";
import { CanvasWorkspace } from "./canvas/CanvasWorkspace";
import { EquipmentLibrary } from "./components/EquipmentLibrary";
import { InspectorPanel } from "./components/InspectorPanel";
import { AIScientistPanel } from "./components/AIScientistPanel";
import { PromptBar } from "./components/PromptBar";
import { AISettingsModal } from "./components/AISettingsModal";
import { generateExperimentTopology } from "./services/ai/aiBuilder";
import { equipmentRegistry } from "./data/equipmentRegistry";
import { SimulationAdapter, type SimulationStatus } from "./simulation/SimulationAdapter";

const simulation = new SimulationAdapter();

export function App() {
  const [mode, setMode] = useState<"diy" | "guided" | "build" | null>(null);
  
  // Workspace States
  const [instances, setInstances] = useState<EquipmentInstance[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

  // Sync state with URL hash routing (#diy, #guided, #build, #home)
  useEffect(() => {
    const syncHashWithState = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "diy" || hash === "guided" || hash === "build") {
        setMode(hash);
      } else {
        setMode(null);
      }
    };

    // Initial sync on page load
    syncHashWithState();

    window.addEventListener("hashchange", syncHashWithState);
    window.addEventListener("popstate", syncHashWithState);

    return () => {
      window.removeEventListener("hashchange", syncHashWithState);
      window.removeEventListener("popstate", syncHashWithState);
    };
  }, []);

  // Home Screen choose mode with URL routing
  const handleChooseMode = (chosenMode: "diy" | "guided" | "build") => {
    window.location.hash = `#${chosenMode}`;
    setMode(chosenMode);
    setInstances([]);
    setConnections([]);
    setSelectedIds([]);
    setStatus("idle");
  };

  // Exit Lab back handler with URL reset
  const handleExitLab = () => {
    window.location.hash = "#home";
    setMode(null);
  };

  // Drag and Drop from library state helper
  const handleDragStart = (event: React.DragEvent, definitionId: string) => {
    event.dataTransfer.setData("application/react-flow", definitionId);
    event.dataTransfer.setData("text/plain", definitionId);
    event.dataTransfer.effectAllowed = "all";
  };

  // Add Component Instance
  const handleAddInstance = (instance: EquipmentInstance) => {
    setInstances((prev) => [...prev, instance]);
  };

  // Add Component from Library Quick Button
  const handleAddEquipmentQuick = (def: EquipmentDefinition) => {
    const newInstance: EquipmentInstance = {
      id: `${def.id}-${Date.now().toString().substring(7)}`,
      definitionId: def.id,
      name: `${def.name} ${instances.filter((i) => i.definitionId === def.id).length + 1}`,
      position: {
        x: 200 + (instances.length * 40) % 200,
        y: 200 + (instances.length * 30) % 150,
      },
      rotation: 0,
      size: { ...def.defaultSize },
      parameters: def.inspector.reduce((acc, field) => {
        acc[field.id] = field.defaultValue;
        return acc;
      }, {} as Record<string, any>),
    };
    handleAddInstance(newInstance);
    setSelectedIds([newInstance.id]);
  };

  // Update Instance Properties
  const handleUpdateInstance = (id: string, updates: Partial<EquipmentInstance>) => {
    setInstances((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates } : inst))
    );
  };

  // Delete Selection
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setInstances((prev) => prev.filter((inst) => !selectedIds.includes(inst.id)));
    setConnections((prev) =>
      prev.filter((conn) => !selectedIds.includes(conn.fromId) && !selectedIds.includes(conn.toId))
    );
    setSelectedIds([]);
  };

  // Duplicate Selection
  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const duplicated: EquipmentInstance[] = [];
    const idMap: Record<string, string> = {};

    selectedIds.forEach((id) => {
      const orig = instances.find((inst) => inst.id === id);
      if (!orig) return;

      const newId = `${orig.definitionId}-${Date.now().toString().substring(7)}-dup-${Math.round(Math.random() * 100)}`;
      idMap[id] = newId;

      duplicated.push({
        ...orig,
        id: newId,
        name: `${orig.name} Copy`,
        position: { x: orig.position.x + 40, y: orig.position.y + 40 },
        parameters: { ...orig.parameters },
      });
    });

    setInstances((prev) => [...prev, ...duplicated]);
    
    // Duplicate internal connections between selected elements
    const newConns: CanvasConnection[] = [];
    connections.forEach((conn) => {
      if (selectedIds.includes(conn.fromId) && selectedIds.includes(conn.toId)) {
        newConns.push({
          id: `${idMap[conn.fromId]}-${conn.fromPort}-to-${idMap[conn.toId]}-${conn.toPort}`,
          fromId: idMap[conn.fromId],
          fromPort: conn.fromPort,
          toId: idMap[conn.toId],
          toPort: conn.toPort,
          kind: conn.kind,
        });
      }
    });

    if (newConns.length > 0) {
      setConnections((prev) => [...prev, ...newConns]);
    }

    setSelectedIds(duplicated.map((d) => d.id));
  };

  // Add Connection
  const handleAddConnection = (conn: CanvasConnection) => {
    // Avoid duplicate connections
    if (connections.some((c) => c.fromId === conn.fromId && c.fromPort === conn.fromPort && c.toId === conn.toId && c.toPort === conn.toPort)) {
      return;
    }
    setConnections((prev) => [...prev, conn]);
  };

  // Delete Connection
  const handleDeleteConnection = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  // Generate Preset Lab Layouts (DIY / guided triggers or prompt bar)
  const handleLoadPreset = (presetName: string) => {
    const lower = presetName.toLowerCase();
    
    if (lower.includes("tunneling")) {
      const gId = `electron-gun-${Math.round(Math.random() * 1000)}`;
      const bId = `potential-barrier-${Math.round(Math.random() * 1000)}`;
      const dId = `detector-${Math.round(Math.random() * 1000)}`;
      const cId = `counter-${Math.round(Math.random() * 1000)}`;
      const pId = `probability-plot-${Math.round(Math.random() * 1000)}`;

      setInstances([
        {
          id: gId,
          definitionId: "electron-gun",
          name: "Electron Gun",
          position: { x: 120, y: 220 },
          rotation: 0,
          size: { width: 90, height: 50 },
          parameters: { energy: 5.5, beamWidth: 1.5, particle: "electron", emissionRate: 15 },
        },
        {
          id: bId,
          definitionId: "potential-barrier",
          name: "Potential Barrier",
          position: { x: 340, y: 220 },
          rotation: 0,
          size: { width: 60, height: 100 },
          parameters: { height: 6.5, width: 1.2, material: "semiconductor" },
        },
        {
          id: dId,
          definitionId: "detector",
          name: "Quantum Detector",
          position: { x: 550, y: 220 },
          rotation: 0,
          size: { width: 70, height: 60 },
          parameters: { efficiency: 90, darkCount: 30, deadTime: 50 },
        },
        {
          id: cId,
          definitionId: "counter",
          name: "Signal Counter",
          position: { x: 740, y: 220 },
          rotation: 0,
          size: { width: 80, height: 50 },
          parameters: { gateTime: 1.5, displayMode: "counts-per-sec" },
        },
        {
          id: pId,
          definitionId: "probability-plot",
          name: "Wave Plotter",
          position: { x: 340, y: 410 },
          rotation: 0,
          size: { width: 160, height: 100 },
          parameters: { verticalScale: 1.2, plotStyle: "solid" },
        }
      ]);

      setConnections([
        { id: `${gId}-out-to-${bId}-in`, fromId: gId, fromPort: "out", toId: bId, toPort: "in", kind: "flow" },
        { id: `${bId}-out-to-${dId}-in`, fromId: bId, fromPort: "out", toId: dId, toPort: "in", kind: "flow" },
        { id: `${dId}-signal-to-${cId}-in`, fromId: dId, fromPort: "signal", toId: cId, toPort: "in", kind: "measurement" },
        { id: `${dId}-signal-to-${pId}-in`, fromId: dId, fromPort: "signal", toId: pId, toPort: "in", kind: "measurement" }
      ]);

      setSelectedIds([gId]);
    } else if (lower.includes("double slit") || lower.includes("diffraction") || lower.includes("young")) {
      const sId = `photon-source-${Math.round(Math.random() * 1000)}`;
      const slId = `double-slit-${Math.round(Math.random() * 1000)}`;
      const scrId = `projection-screen-${Math.round(Math.random() * 1000)}`;

      setInstances([
        {
          id: sId,
          definitionId: "photon-source",
          name: "Photon Source",
          position: { x: 120, y: 220 },
          rotation: 0,
          size: { width: 80, height: 50 },
          parameters: { wavelength: 532, intensity: 5, mode: "single" },
        },
        {
          id: slId,
          definitionId: "double-slit",
          name: "Double Slit",
          position: { x: 380, y: 220 },
          rotation: 0,
          size: { width: 30, height: 120 },
          parameters: { slitWidth: 0.4, separation: 2.2, thickness: 1 },
        },
        {
          id: scrId,
          definitionId: "projection-screen",
          name: "Phosphor Screen",
          position: { x: 650, y: 220 },
          rotation: 0,
          size: { width: 40, height: 160 },
          parameters: { resolution: "high", persistence: 300 },
        }
      ]);

      setConnections([
        { id: `${sId}-out-to-${slId}-in`, fromId: sId, fromPort: "out", toId: slId, toPort: "in", kind: "flow" },
        { id: `${slId}-out-to-${scrId}-in`, fromId: slId, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" }
      ]);

      setSelectedIds([sId]);
    } else if (lower.includes("polarization") || lower.includes("malus")) {
      const lId = `laser-${Math.round(Math.random() * 1000)}`;
      const p1Id = `polarizer-${Math.round(Math.random() * 1000)}`;
      const phId = `phase-plate-${Math.round(Math.random() * 1000)}`;
      const p2Id = `polarizer-${Math.round(Math.random() * 1000)}`;
      const dId = `detector-${Math.round(Math.random() * 1000)}`;
      const vId = `state-viewer-${Math.round(Math.random() * 1000)}`;

      setInstances([
        {
          id: lId,
          definitionId: "laser",
          name: "Laser Source",
          position: { x: 80, y: 220 },
          rotation: 0,
          size: { width: 90, height: 40 },
          parameters: { wavelength: 633, power: 10, polarization: 0 },
        },
        {
          id: p1Id,
          definitionId: "polarizer",
          name: "Polarizer A",
          position: { x: 250, y: 220 },
          rotation: 0,
          size: { width: 60, height: 60 },
          parameters: { angle: 0, extinction: 100000 },
        },
        {
          id: phId,
          definitionId: "phase-plate",
          name: "Wave Retarder",
          position: { x: 410, y: 220 },
          rotation: 0,
          size: { width: 50, height: 60 },
          parameters: { phaseShift: 90, axis: 45 },
        },
        {
          id: p2Id,
          definitionId: "polarizer",
          name: "Polarizer B",
          position: { x: 570, y: 220 },
          rotation: 0,
          size: { width: 60, height: 60 },
          parameters: { angle: 45, extinction: 100000 },
        },
        {
          id: dId,
          definitionId: "detector",
          name: "Photodiode",
          position: { x: 740, y: 220 },
          rotation: 0,
          size: { width: 70, height: 60 },
          parameters: { efficiency: 80, darkCount: 20, deadTime: 50 },
        },
        {
          id: vId,
          definitionId: "state-viewer",
          name: "State Viewer",
          position: { x: 920, y: 220 },
          rotation: 0,
          size: { width: 150, height: 100 },
          parameters: { basis: "Z-basis", showPhase: true },
        }
      ]);

      setConnections([
        { id: `${lId}-out-to-${p1Id}-in`, fromId: lId, fromPort: "out", toId: p1Id, toPort: "in", kind: "flow" },
        { id: `${p1Id}-out-to-${phId}-in`, fromId: p1Id, fromPort: "out", toId: phId, toPort: "in", kind: "flow" },
        { id: `${phId}-out-to-${p2Id}-in`, fromId: phId, fromPort: "out", toId: p2Id, toPort: "in", kind: "flow" },
        { id: `${p2Id}-out-to-${dId}-in`, fromId: p2Id, fromPort: "out", toId: dId, toPort: "in", kind: "flow" },
        { id: `${dId}-signal-to-${vId}-in`, fromId: dId, fromPort: "signal", toId: vId, toPort: "in", kind: "measurement" }
      ]);

      setSelectedIds([lId]);
    } else if (lower.includes("interferometer") || lower.includes("michelson")) {
      const lId = `laser-${Math.round(Math.random() * 1000)}`;
      const bsId = `beam-splitter-${Math.round(Math.random() * 1000)}`;
      const m1Id = `mirror-${Math.round(Math.random() * 1000)}`;
      const m2Id = `mirror-${Math.round(Math.random() * 1000)}`;
      const scrId = `projection-screen-${Math.round(Math.random() * 1000)}`;

      setInstances([
        {
          id: lId,
          definitionId: "laser",
          name: "HeNe Laser",
          position: { x: 100, y: 350 },
          rotation: 0,
          size: { width: 90, height: 40 },
          parameters: { wavelength: 632.8, power: 15, polarization: 45 },
        },
        {
          id: bsId,
          definitionId: "beam-splitter",
          name: "50/50 Splitter Cube",
          position: { x: 300, y: 350 },
          rotation: 0,
          size: { width: 60, height: 60 },
          parameters: { ratio: "50/50", type: "non-polarizing" },
        },
        {
          id: m1Id,
          definitionId: "mirror",
          name: "Reference Mirror",
          position: { x: 300, y: 150 },
          rotation: 90,
          size: { width: 60, height: 60 },
          parameters: { reflectivity: 99.9, coating: "dielectric" },
        },
        {
          id: m2Id,
          definitionId: "mirror",
          name: "Delay Mirror",
          position: { x: 500, y: 350 },
          rotation: -45,
          size: { width: 60, height: 60 },
          parameters: { reflectivity: 99.9, coating: "dielectric" },
        },
        {
          id: scrId,
          definitionId: "projection-screen",
          name: "Interference Screen",
          position: { x: 300, y: 550 },
          rotation: 0,
          size: { width: 40, height: 160 },
          parameters: { resolution: "high", persistence: 500 },
        }
      ]);

      setConnections([
        { id: `${lId}-out-to-${bsId}-in`, fromId: lId, fromPort: "out", toId: bsId, toPort: "in", kind: "flow" },
        { id: `${bsId}-refl-to-${m1Id}-in`, fromId: bsId, fromPort: "refl", toId: m1Id, toPort: "in", kind: "flow" },
        { id: `${bsId}-trans-to-${m2Id}-in`, fromId: bsId, fromPort: "trans", toId: m2Id, toPort: "in", kind: "flow" },
        { id: `${m1Id}-out-to-${scrId}-in`, fromId: m1Id, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" },
        { id: `${m2Id}-out-to-${scrId}-in`, fromId: m2Id, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" }
      ]);

      setSelectedIds([bsId]);
    } else {
      // Default placeholder generate setup
      alert("Setup not recognized. Try typing 'quantum tunneling' or 'double slit'!");
    }
  };

  // AI scientist question submit callback
  const handleAskScientist = (query: string) => {
    alert(`The AI Scientist is processing your question:\n"${query}"\n\nUnder active QWM model, this setup simulates valid observables.`);
  };

  // Parse prompts in Generate mode using AI Builder engine
  const handleGeneratePrompt = async (prompt: string) => {
    setAiGenerating(true);
    try {
      const result = await generateExperimentTopology(prompt);
      setInstances(result.instances);
      setConnections(result.connections);
    } catch (err) {
      console.error("AI Builder generation error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Convert active workspace state to core PlaygroundModel schema
  const serializedModel: PlaygroundModel = useMemo(() => {
    const comps: PlaygroundComponent[] = instances.map((inst) => ({
      id: inst.id,
      role: inst.name,
      kind: inst.definitionId,
      asset: inst.definitionId,
      position: inst.position,
      rotation: inst.rotation,
      editable: true,
    }));

    const conns: PlaygroundConnection[] = connections.map((conn) => ({
      id: conn.id,
      from: conn.fromId,
      to: conn.toId,
      kind: conn.kind,
    }));

    // Gathers first selected component parameters to controls (if selected)
    const selectedInst = selectedIds.length > 0 ? instances.find((i) => i.id === selectedIds[0]) : null;
    const def = selectedInst ? equipmentRegistry.find((d) => d.id === selectedInst.definitionId) : null;
    
    const ctrls: PlaygroundControl[] = [];
    if (selectedInst && def) {
      def.inspector.forEach((field) => {
        ctrls.push({
          id: field.id,
          label: field.label,
          quantity: field.id,
          unit: field.unit || "",
          value: selectedInst.parameters[field.id] !== undefined ? selectedInst.parameters[field.id] : field.defaultValue,
          minimum: field.minimum,
          maximum: field.maximum,
          allowedValues: field.allowedValues,
        });
      });
    }

    return {
      experimentId: "interactive-lab-session",
      rendererMode: "canvas-3d-stylized",
      components: comps,
      connections: conns,
      controls: ctrls,
      viewport: {
        width: 1200,
        height: 800,
        background: "#070b19",
      },
    };
  }, [instances, connections, selectedIds]);

  // Expose serialization to window for compliance checks
  if (typeof window !== "undefined") {
    (window as any).serializedModel = serializedModel;
  }

  const activeSelectedInstance = selectedIds.length > 0 ? instances.find((i) => i.id === selectedIds[0]) || null : null;

  if (!mode) {
    // Mode Selection Screen
    return (
      <main className="home-page">
        <header className="brand">
          <span className="brand-mark">⚛</span>
          <span>Quantum Playground Laboratory</span>
        </header>

        <section className="home-intro">
          <p className="eyebrow">INTERACTIVE QUANTUM & OPTICS RESEARCH</p>
          <h1>Design Your Own Experiment</h1>
          <p>
            An infinite laboratory workbench to assemble scientific apparatus, build light/particle beams, and observe wave equations in real-time.
          </p>
        </section>

        <section className="mode-grid" aria-label="Choose laboratory working mode">
          <button className="mode-card" onClick={() => handleChooseMode("diy")}>
            <span className="mode-icon">⌁</span>
            <h2>DIY Lab Sandbox</h2>
            <p>Start with an empty workbench. Build your experiment entirely from scratch without AI interruptions.</p>
            <span className="mode-action">Open Workbench →</span>
          </button>

          <button className="mode-card" onClick={() => handleChooseMode("guided")}>
            <span className="mode-icon">✦</span>
            <h2>Learn with AI</h2>
            <p>Assemble experiments while a real-time AI Scientist panel predicts outcomes, explains physics, and points out errors.</p>
            <span className="mode-action">Enter Guided Lab →</span>
          </button>

          <button className="mode-card" onClick={() => handleChooseMode("build")}>
            <span className="mode-icon">✺</span>
            <h2>Generate with AI</h2>
            <p>Type what experiment you want to construct, and the AI will deploy the initial apparatus setup instantly.</p>
            <span className="mode-action">Spawn Experiment →</span>
          </button>
        </section>

        <footer className="home-footer">
          <p>Pairs seamlessly with QWM Core • Built for Advanced Physics Instruction</p>
        </footer>
      </main>
    );
  }

  return (
    <main className="lab-shell">
      {/* Sidebars left - Equipment Library */}
      <EquipmentLibrary
        onDragStart={handleDragStart}
        onAddEquipment={handleAddEquipmentQuick}
        onLoadPreset={handleLoadPreset}
      />

      {/* Main Sandbox Workspace area */}
      <section className="lab-main">
        <header className="toolbar">
          <div className="lab-mode-info">
            {/* Figma-style Top Breadcrumbs */}
            <div className="figma-breadcrumbs">
              <span className="crumb-root">Quantum Playground</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-mode">
                {mode === "diy" ? "DIY Lab Sandbox" : mode === "guided" ? "Learn with AI" : "Generate with AI"}
              </span>
              <span className="crumb-sep">›</span>
              <span className="crumb-doc">Untitled Experiment #1</span>
            </div>
            <button className="text-button back-link" onClick={handleExitLab}>
              ← Exit Lab
            </button>
          </div>

          {/* Running controllers */}
          <div className="toolbar-actions">
            <span className={`runtime-status ${status}`}>
              {status === "running" ? "● Emitting Beams" : status === "paused" ? "Ⅱ Simulation Paused" : "○ Circuit Closed"}
            </span>
            <button
              onClick={() => setStatus(simulation.run())}
              disabled={status === "running"}
              className="btn-run"
            >
              ▶ Run Lab
            </button>
            <button
              onClick={() => setStatus(simulation.pause())}
              disabled={status !== "running"}
              className="btn-pause"
            >
              Ⅱ Pause
            </button>
            <button
              onClick={() => {
                setStatus(simulation.reset());
                setInstances([]);
                setConnections([]);
                setSelectedIds([]);
              }}
              className="btn-reset"
            >
              ↺ Reset Bench
            </button>
          </div>
        </header>

        {/* Generate Prompt bar shown at top in Build mode */}
        {mode === "build" && (
          <PromptBar onGenerate={handleGeneratePrompt} isLoading={aiGenerating} />
        )}

        <CanvasWorkspace
          instances={instances}
          connections={connections}
          selectedIds={selectedIds}
          isSimulating={status === "running"}
          onSelect={setSelectedIds}
          onUpdateInstance={handleUpdateInstance}
          onAddInstance={handleAddInstance}
          onAddConnection={handleAddConnection}
          onDeleteConnection={handleDeleteConnection}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
        />

        {/* Blender-style Bottom Status Bar */}
        <footer className="blender-status-bar">
          <span className="status-indicator">● Ready</span>
          <span className="status-item">Objects: {instances.length}</span>
          <span className="status-item">Connections: {connections.length}</span>
          <span className="status-item">Simulation: {status === "running" ? "Running" : status === "paused" ? "Paused" : "Idle"}</span>
          <span className="status-item">Grid: 10px Snap</span>
          <span className="status-item">FPS: 60</span>
        </footer>
      </section>

      {/* Sidebars right - Inspector Panel (when selected) OR AI Scientist/Progress Panel (in AI modes) */}
      {activeSelectedInstance ? (
        <InspectorPanel
          selectedInstance={activeSelectedInstance}
          onUpdateInstance={handleUpdateInstance}
          onDeleteInstance={(id) => {
            setInstances((prev) => prev.filter((i) => i.id !== id));
            setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id));
            setSelectedIds([]);
          }}
          onDuplicateInstance={(id) => {
            const orig = instances.find((i) => i.id === id);
            if (!orig) return;
            const newInstance = {
              ...orig,
              id: `${orig.definitionId}-${Date.now().toString().substring(7)}`,
              name: `${orig.name} Copy`,
              position: { x: orig.position.x + 30, y: orig.position.y + 30 },
            };
            setInstances((prev) => [...prev, newInstance]);
            setSelectedIds([newInstance.id]);
          }}
        />
      ) : (
        <AIScientistPanel
          instances={instances}
          connections={connections}
          mode={mode || "diy"}
          isSimulating={status === "running"}
          onLoadPreset={handleLoadPreset}
          onAskScientist={handleAskScientist}
          onRestoreState={(restored) => setInstances(restored)}
          onOpenSettings={() => setIsAISettingsOpen(true)}
        />
      )}

      {/* AI Provider Settings Modal */}
      <AISettingsModal isOpen={isAISettingsOpen} onClose={() => setIsAISettingsOpen(false)} />
    </main>
  );
}
