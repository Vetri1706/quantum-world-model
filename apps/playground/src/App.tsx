import { useEffect, useCallback, useMemo } from "react";
import type { EquipmentInstance, CanvasConnection } from "./types/playground";
import { CanvasWorkspace } from "./canvas/CanvasWorkspace";
import { EquipmentLibrary } from "./components/EquipmentLibrary";
import { InspectorPanel } from "./components/InspectorPanel";
import { AIScientistPanel } from "./components/AIScientistPanel";
import { PromptBar } from "./components/PromptBar";
import { AISettingsModal } from "./components/AISettingsModal";
import { KnowledgeStudioModal } from "./components/KnowledgeStudioModal";
import { AITrainingHubModal } from "./components/AITrainingHubModal";
import { QuantumStateInspector } from "./components/QuantumStateInspector";
import { ManyWorldsTreeWidget } from "./components/ManyWorldsTreeWidget";
import { generateExperimentTopology } from "./services/ai/aiBuilder";
import { equipmentRegistry } from "./data/equipmentRegistry";
import { SimulationAdapter } from "./simulation/SimulationAdapter";
import { useLabStore } from "./store/useLabStore";

const simulation = new SimulationAdapter();

export function App() {
  const store = useLabStore();

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "diy" || hash === "guided" || hash === "build") {
        store.setMode(hash);
      } else {
        window.location.hash = "#diy";
        store.setMode("diy");
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const handleChooseMode = useCallback((mode: "diy" | "guided" | "build") => {
    window.location.hash = `#${mode}`;
    store.setMode(mode);
    store.resetLab();
  }, []);

  const handleExitLab = useCallback(() => {
    window.location.hash = "#home";
    store.setMode(null);
  }, []);

  const handleDragStart = useCallback((event: React.DragEvent, definitionId: string) => {
    event.dataTransfer.setData("application/react-flow", definitionId);
    event.dataTransfer.setData("text/plain", definitionId);
    event.dataTransfer.effectAllowed = "all";
  }, []);

  const handleAddEquipmentQuick = useCallback((def: (typeof equipmentRegistry)[number]) => {
    const instances = useLabStore.getState().instances;
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
    store.addInstance(newInstance);
    store.setSelectedIds([newInstance.id]);
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    const { selectedIds, instances, connections } = useLabStore.getState();
    if (selectedIds.length === 0) return;
    const duplicated: EquipmentInstance[] = [];
    const idMap: Record<string, string> = {};

    selectedIds.forEach((id) => {
      const orig = instances.find((i) => i.id === id);
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

    store.addInstances(duplicated);

    const newConns: CanvasConnection[] = [];
    connections.forEach((conn) => {
      if (selectedIds.includes(conn.fromId) && selectedIds.includes(conn.toId) && idMap[conn.fromId] && idMap[conn.toId]) {
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
      const current = useLabStore.getState().connections;
      store.setConnections([...current, ...newConns]);
    }
    store.setSelectedIds(duplicated.map((d) => d.id));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const { selectedIds } = useLabStore.getState();
    store.removeInstances(selectedIds);
  }, []);

  const handleLoadPreset = useCallback((presetName: string) => {
    const lower = presetName.toLowerCase();

    if (lower.includes("tunneling")) {
      const gId = `electron-gun-${Math.round(Math.random() * 1000)}`;
      const bId = `potential-barrier-${Math.round(Math.random() * 1000)}`;
      const dId = `detector-${Math.round(Math.random() * 1000)}`;
      const cId = `counter-${Math.round(Math.random() * 1000)}`;
      const pId = `probability-plot-${Math.round(Math.random() * 1000)}`;

      store.setInstances([
        { id: gId, definitionId: "electron-gun", name: "Electron Gun", position: { x: 120, y: 220 }, rotation: 0, size: { width: 90, height: 50 }, parameters: { energy: 5.5, beamWidth: 1.5, particle: "electron", emissionRate: 15 } },
        { id: bId, definitionId: "potential-barrier", name: "Potential Barrier", position: { x: 340, y: 220 }, rotation: 0, size: { width: 60, height: 100 }, parameters: { height: 6.5, width: 1.2, material: "semiconductor" } },
        { id: dId, definitionId: "detector", name: "Quantum Detector", position: { x: 550, y: 220 }, rotation: 0, size: { width: 70, height: 60 }, parameters: { efficiency: 90, darkCount: 30, deadTime: 50 } },
        { id: cId, definitionId: "counter", name: "Signal Counter", position: { x: 740, y: 220 }, rotation: 0, size: { width: 80, height: 50 }, parameters: { gateTime: 1.5, displayMode: "counts-per-sec" } },
        { id: pId, definitionId: "probability-plot", name: "Wave Plotter", position: { x: 340, y: 410 }, rotation: 0, size: { width: 160, height: 100 }, parameters: { verticalScale: 1.2, plotStyle: "solid" } },
      ]);
      store.setConnections([
        { id: `${gId}-out-to-${bId}-in`, fromId: gId, fromPort: "out", toId: bId, toPort: "in", kind: "flow" },
        { id: `${bId}-out-to-${dId}-in`, fromId: bId, fromPort: "out", toId: dId, toPort: "in", kind: "flow" },
        { id: `${dId}-signal-to-${cId}-in`, fromId: dId, fromPort: "signal", toId: cId, toPort: "in", kind: "measurement" },
        { id: `${dId}-signal-to-${pId}-in`, fromId: dId, fromPort: "signal", toId: pId, toPort: "in", kind: "measurement" },
      ]);
      store.setSelectedIds([gId]);
    } else if (lower.includes("double slit") || lower.includes("diffraction") || lower.includes("young")) {
      const sId = `photon-source-${Math.round(Math.random() * 1000)}`;
      const slId = `double-slit-${Math.round(Math.random() * 1000)}`;
      const scrId = `projection-screen-${Math.round(Math.random() * 1000)}`;

      store.setInstances([
        { id: sId, definitionId: "photon-source", name: "Photon Source", position: { x: 120, y: 220 }, rotation: 0, size: { width: 80, height: 50 }, parameters: { wavelength: 532, intensity: 5, mode: "single" } },
        { id: slId, definitionId: "double-slit", name: "Double Slit", position: { x: 380, y: 220 }, rotation: 0, size: { width: 30, height: 120 }, parameters: { slitWidth: 0.4, separation: 2.2, thickness: 1 } },
        { id: scrId, definitionId: "projection-screen", name: "Phosphor Screen", position: { x: 650, y: 220 }, rotation: 0, size: { width: 40, height: 160 }, parameters: { resolution: "high", persistence: 300 } },
      ]);
      store.setConnections([
        { id: `${sId}-out-to-${slId}-in`, fromId: sId, fromPort: "out", toId: slId, toPort: "in", kind: "flow" },
        { id: `${slId}-out-to-${scrId}-in`, fromId: slId, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" },
      ]);
      store.setSelectedIds([sId]);
    } else if (lower.includes("polarization") || lower.includes("malus")) {
      const lId = `laser-${Math.round(Math.random() * 1000)}`;
      const p1Id = `polarizer-${Math.round(Math.random() * 1000)}`;
      const phId = `phase-plate-${Math.round(Math.random() * 1000)}`;
      const p2Id = `polarizer-${Math.round(Math.random() * 1000)}`;
      const dId = `detector-${Math.round(Math.random() * 1000)}`;
      const vId = `state-viewer-${Math.round(Math.random() * 1000)}`;

      store.setInstances([
        { id: lId, definitionId: "laser", name: "Laser Source", position: { x: 80, y: 220 }, rotation: 0, size: { width: 90, height: 40 }, parameters: { wavelength: 633, power: 10, polarization: 0 } },
        { id: p1Id, definitionId: "polarizer", name: "Polarizer A", position: { x: 250, y: 220 }, rotation: 0, size: { width: 60, height: 60 }, parameters: { angle: 0, extinction: 100000 } },
        { id: phId, definitionId: "phase-plate", name: "Wave Retarder", position: { x: 410, y: 220 }, rotation: 0, size: { width: 50, height: 60 }, parameters: { phaseShift: 90, axis: 45 } },
        { id: p2Id, definitionId: "polarizer", name: "Polarizer B", position: { x: 570, y: 220 }, rotation: 0, size: { width: 60, height: 60 }, parameters: { angle: 45, extinction: 100000 } },
        { id: dId, definitionId: "detector", name: "Photodiode", position: { x: 740, y: 220 }, rotation: 0, size: { width: 70, height: 60 }, parameters: { efficiency: 80, darkCount: 20, deadTime: 50 } },
        { id: vId, definitionId: "state-viewer", name: "State Viewer", position: { x: 920, y: 220 }, rotation: 0, size: { width: 150, height: 100 }, parameters: { basis: "Z-basis", showPhase: true } },
      ]);
      store.setConnections([
        { id: `${lId}-out-to-${p1Id}-in`, fromId: lId, fromPort: "out", toId: p1Id, toPort: "in", kind: "flow" },
        { id: `${p1Id}-out-to-${phId}-in`, fromId: p1Id, fromPort: "out", toId: phId, toPort: "in", kind: "flow" },
        { id: `${phId}-out-to-${p2Id}-in`, fromId: phId, fromPort: "out", toId: p2Id, toPort: "in", kind: "flow" },
        { id: `${p2Id}-out-to-${dId}-in`, fromId: p2Id, fromPort: "out", toId: dId, toPort: "in", kind: "flow" },
        { id: `${dId}-signal-to-${vId}-in`, fromId: dId, fromPort: "signal", toId: vId, toPort: "in", kind: "measurement" },
      ]);
      store.setSelectedIds([lId]);
    } else if (lower.includes("interferometer") || lower.includes("michelson")) {
      const lId = `laser-${Math.round(Math.random() * 1000)}`;
      const bsId = `beam-splitter-${Math.round(Math.random() * 1000)}`;
      const m1Id = `mirror-${Math.round(Math.random() * 1000)}`;
      const m2Id = `mirror-${Math.round(Math.random() * 1000)}`;
      const scrId = `projection-screen-${Math.round(Math.random() * 1000)}`;

      store.setInstances([
        { id: lId, definitionId: "laser", name: "HeNe Laser", position: { x: 100, y: 350 }, rotation: 0, size: { width: 90, height: 40 }, parameters: { wavelength: 632.8, power: 15, polarization: 45 } },
        { id: bsId, definitionId: "beam-splitter", name: "50/50 Splitter Cube", position: { x: 300, y: 350 }, rotation: 0, size: { width: 60, height: 60 }, parameters: { ratio: "50/50", type: "non-polarizing" } },
        { id: m1Id, definitionId: "mirror", name: "Reference Mirror", position: { x: 300, y: 150 }, rotation: 90, size: { width: 60, height: 60 }, parameters: { reflectivity: 99.9, coating: "dielectric" } },
        { id: m2Id, definitionId: "mirror", name: "Delay Mirror", position: { x: 500, y: 350 }, rotation: -45, size: { width: 60, height: 60 }, parameters: { reflectivity: 99.9, coating: "dielectric" } },
        { id: scrId, definitionId: "projection-screen", name: "Interference Screen", position: { x: 300, y: 550 }, rotation: 0, size: { width: 40, height: 160 }, parameters: { resolution: "high", persistence: 500 } },
      ]);
      store.setConnections([
        { id: `${lId}-out-to-${bsId}-in`, fromId: lId, fromPort: "out", toId: bsId, toPort: "in", kind: "flow" },
        { id: `${bsId}-refl-to-${m1Id}-in`, fromId: bsId, fromPort: "refl", toId: m1Id, toPort: "in", kind: "flow" },
        { id: `${bsId}-trans-to-${m2Id}-in`, fromId: bsId, fromPort: "trans", toId: m2Id, toPort: "in", kind: "flow" },
        { id: `${m1Id}-out-to-${scrId}-in`, fromId: m1Id, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" },
        { id: `${m2Id}-out-to-${scrId}-in`, fromId: m2Id, fromPort: "out", toId: scrId, toPort: "in", kind: "flow" },
      ]);
      store.setSelectedIds([bsId]);
    } else {
      alert("Setup not recognized. Try typing 'quantum tunneling' or 'double slit'!");
    }
  }, []);

  const handleGeneratePrompt = useCallback(async (prompt: string) => {
    store.setAiGenerating(true);
    try {
      const result = await generateExperimentTopology(prompt);
      store.setInstances(result.instances);
      store.setConnections(result.connections);
    } catch (err) {
      console.error("AI Builder generation error:", err);
    } finally {
      store.setAiGenerating(false);
    }
  }, []);

  const handleToggleSim = useCallback(() => {
    const current = useLabStore.getState().simulationStatus;
    if (current === "running") {
      store.setSimulationStatus(simulation.pause());
    } else {
      store.setSimulationStatus(simulation.run());
    }
  }, []);

  const handleResetSim = useCallback(() => {
    store.setSimulationStatus(simulation.reset());
    store.resetLab();
  }, []);

  const activeSelectedInstance = useMemo(() => {
    const { selectedIds, instances } = useLabStore.getState();
    return selectedIds.length > 0 ? instances.find((i) => i.id === selectedIds[0]) || null : null;
  }, [store.selectedIds, store.instances]);

  if (!store.mode) {
    return (
      <main className="home-page">
        <header className="brand">
          <span className="brand-mark">Q</span>
          <span>Quantum World Model</span>
        </header>

        <section className="home-intro">
          <p className="eyebrow">Interactive Quantum & Optics Research</p>
          <h1>Design Your Own Experiment</h1>
          <p>An infinite laboratory workbench to assemble scientific apparatus, build light/particle beams, and observe wave equations in real-time.</p>
        </section>

        <section className="mode-grid">
          <button className="mode-card" onClick={() => handleChooseMode("diy")}>
            <span className="mode-icon">/</span>
            <h2>DIY Lab Sandbox</h2>
            <p>Start with an empty workbench. Build your experiment entirely from scratch.</p>
            <span className="mode-action">Open Workbench</span>
          </button>
          <button className="mode-card" onClick={() => handleChooseMode("guided")}>
            <span className="mode-icon">*</span>
            <h2>Learn with AI</h2>
            <p>Assemble experiments while a real-time AI Scientist panel predicts outcomes and explains physics.</p>
            <span className="mode-action">Enter Guided Lab</span>
          </button>
          <button className="mode-card" onClick={() => handleChooseMode("build")}>
            <span className="mode-icon">+</span>
            <h2>Generate with AI</h2>
            <p>Type what experiment you want, and the AI deploys the apparatus setup instantly.</p>
            <span className="mode-action">Spawn Experiment</span>
          </button>
        </section>

        <footer className="home-footer">
          <p>Built with QWM Core for Advanced Physics Instruction</p>
        </footer>
      </main>
    );
  }

  return (
    <main className={`lab-shell ${store.leftCollapsed ? "left-collapsed" : ""} ${store.rightCollapsed ? "right-collapsed" : ""}`}>
      {!store.leftCollapsed && (
        <EquipmentLibrary
          onDragStart={handleDragStart}
          onAddEquipment={handleAddEquipmentQuick}
          onLoadPreset={handleLoadPreset}
        />
      )}

      <section className="lab-main">
        <header className="toolbar">
          <div className="lab-mode-info">
            <button className="toolbar-toggle-btn" onClick={store.toggleLeftSidebar} title="Toggle Left Sidebar">
              {store.leftCollapsed ? ">" : "<"}
            </button>
            <div className="figma-breadcrumbs">
              <span className="crumb-root">QWM</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-mode">
                {store.mode === "diy" ? "DIY" : store.mode === "guided" ? "Guided" : "AI Build"}
              </span>
            </div>
            <button className="text-button back-link" onClick={handleExitLab}>
              Exit
            </button>
          </div>

          <div className="toolbar-actions">
            <span className="runtime-status" style={{ color: store.simulationStatus === "running" ? "var(--accent)" : "var(--text-dim)" }}>
              {store.simulationStatus === "running" ? "Running" : store.simulationStatus === "paused" ? "Paused" : "Idle"}
            </span>
            <button onClick={handleToggleSim} disabled={store.simulationStatus === "running"} className="btn-run">
              Run
            </button>
            <button onClick={handleToggleSim} disabled={store.simulationStatus !== "running"} className="btn-pause">
              Pause
            </button>
            <button onClick={handleResetSim} className="btn-reset">
              Reset
            </button>
            <button onClick={() => store.setIsKnowledgeStudioOpen(true)} className="btn-knowledge-studio">
              Knowledge
            </button>
            <button onClick={() => store.setIsTrainingHubOpen(true)} className="btn-training-hub">
              Training
            </button>
            <button className="toolbar-toggle-btn" onClick={store.toggleRightSidebar} title="Toggle Right Sidebar">
              {store.rightCollapsed ? "<" : ">"}
            </button>
          </div>
        </header>

        {store.mode === "build" && (
          <PromptBar onGenerate={handleGeneratePrompt} isLoading={store.aiGenerating} />
        )}

        <CanvasWorkspace
          instances={store.instances}
          connections={store.connections}
          selectedIds={store.selectedIds}
          isSimulating={store.simulationStatus === "running"}
          onSelect={store.setSelectedIds}
          onUpdateInstance={store.updateInstance}
          onAddInstance={store.addInstance}
          onAddConnection={store.addConnection}
          onDeleteConnection={store.removeConnection}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
        />

        <footer className="blender-status-bar">
          <span className="status-indicator">Ready</span>
          <span className="status-item">Objects: {store.instances.length}</span>
          <span className="status-item">Connections: {store.connections.length}</span>
          <span className="status-item">Simulation: {store.simulationStatus === "running" ? "Running" : store.simulationStatus === "paused" ? "Paused" : "Idle"}</span>
          <span className="status-item">Grid: 10px Snap</span>
        </footer>
      </section>

      {!store.rightCollapsed && (
        <aside className="right-sidebar-shell">
          {activeSelectedInstance ? (
            <InspectorPanel
              selectedInstance={activeSelectedInstance}
              onUpdateInstance={store.updateInstance}
              onDeleteInstance={(id) => store.removeInstance(id)}
              onDuplicateInstance={(id) => {
                const orig = store.instances.find((i) => i.id === id);
                if (!orig) return;
                const newInstance = {
                  ...orig,
                  id: `${orig.definitionId}-${Date.now().toString().substring(7)}`,
                  name: `${orig.name} Copy`,
                  position: { x: orig.position.x + 30, y: orig.position.y + 30 },
                };
                store.addInstance(newInstance);
                store.setSelectedIds([newInstance.id]);
              }}
            />
          ) : (
            <AIScientistPanel
              instances={store.instances}
              connections={store.connections}
              mode={store.mode || "diy"}
              isSimulating={store.simulationStatus === "running"}
              onLoadPreset={handleLoadPreset}
              onAskScientist={(q) => alert(`AI processing: "${q}"`)}
              onRestoreState={(restored) => store.setInstances(restored)}
              onOpenSettings={() => store.setIsAISettingsOpen(true)}
            />
          )}

          <div className="quantum-inspection-subpanel">
            <QuantumStateInspector selectedInstance={activeSelectedInstance} />
            <ManyWorldsTreeWidget instances={store.instances} />
          </div>
        </aside>
      )}

      <AISettingsModal isOpen={store.isAISettingsOpen} onClose={() => store.setIsAISettingsOpen(false)} />
      <KnowledgeStudioModal
        isOpen={store.isKnowledgeStudioOpen}
        onClose={() => store.setIsKnowledgeStudioOpen(false)}
        onDeployToCanvas={(newInst) => {
          store.addInstance(newInst);
          store.setSelectedIds([newInst.id]);
        }}
      />
      <AITrainingHubModal
        isOpen={store.isTrainingHubOpen}
        onClose={() => store.setIsTrainingHubOpen(false)}
        onDeployTrainedModel={(modelName) => console.log("Deployed:", modelName)}
      />
    </main>
  );
}
