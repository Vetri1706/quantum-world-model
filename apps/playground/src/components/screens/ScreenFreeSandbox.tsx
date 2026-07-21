// Screen Free Sandbox: Pure Hands-On 3D Physics Laboratory (No AI Guidance or Popups)
// Features unified categorized Scientific Elements shelf with Real GLB 3D Models & 3D Dragging

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Check,
  SlidersHorizontal,
  RotateCcw,
  Atom,
  Boxes,
  FlaskConical,
  Move,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import { QuantumLabCanvas } from "../canvas/QuantumLabCanvas";
import { SimulationResultsPanel } from "../SimulationResultsPanel";

export const ScreenFreeSandbox: React.FC = () => {
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const installedEquipment = useQuantumLabStore((state) => state.installedEquipment);
  const toggleEquipment = useQuantumLabStore((state) => state.toggleEquipment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const updatePhysicsParams = useQuantumLabStore((state) => state.updatePhysicsParams);
  const setInstalledEquipment = useQuantumLabStore((state) => state.setInstalledEquipment);
  const resetEquipmentPositions = useQuantumLabStore((state) => state.resetEquipmentPositions);
  const setSelectedEquipment = useQuantumLabStore((state) => state.setSelectedEquipment);

  const [activeCategory, setActiveCategory] = useState<"quantum" | "classical" | "chemistry">("quantum");
  const [showResultsPanel, setShowResultsPanel] = useState(true);

  // Real GLB & Scientific Elements Palette (No Nuclear Reactor)
  const quantumElements = [
    { id: "quantum-ring", name: "Quantum Ring Resonator (GLB)", role: "ring phase interference", color: "border-slate-300 text-slate-900" },
    { id: "crystal-capsule", name: "Crystal Capsule Chamber (GLB)", role: "lattice confinement", color: "border-slate-300 text-slate-900" },
    { id: "riemann-sphere", name: "Qubit Riemann Sphere (GLB)", role: "state analyzer", color: "border-slate-300 text-slate-900" },
    { id: "solenoid-magnet", name: "Solenoid Electromagnet (GLB)", role: "em field", color: "border-slate-300 text-slate-900" },
    { id: "mach-zehnder", name: "Mach-Zehnder Interferometer", role: "phase splitter", color: "border-slate-300 text-slate-900" },
    { id: "double-slit-mask", name: "Young's Double-Slit Plate", role: "interference mask", color: "border-slate-300 text-slate-900" },
    { id: "potential-barrier", name: "Potential Barrier Wall", role: "tunneling barrier", color: "border-slate-300 text-slate-900" },
    { id: "detector", name: "Particle & Wave Detector", role: "quantum collector", color: "border-slate-300 text-slate-900" },
  ];

  const classicalElements = [
    { id: "newtons-cradle", name: "Newton's Cradle Apparatus (GLB)", role: "elastic momentum", color: "border-slate-300 text-slate-900" },
    { id: "solenoid-magnet", name: "Solenoid Magnetic Coil (GLB)", role: "lorentz b-field", color: "border-slate-300 text-slate-900" },
    { id: "foucault-pendulum", name: "Foucault Precession Pendulum", role: "harmonic oscillator", color: "border-slate-300 text-slate-900" },
    { id: "prism-refraction", name: "Glass Triangular Prism", role: "snell dispersion", color: "border-slate-300 text-slate-900" },
  ];

  const chemistryElements = [
    { id: "bunsen-burner", name: "Chemistry Bunsen Burner (GLB)", role: "thermal excitation", color: "border-slate-300 text-slate-900" },
    { id: "beaker", name: "Glass Beaker & Solution Vessel", role: "reaction vessel", color: "border-slate-300 text-slate-900" },
    { id: "molecular-lattice", name: "NaCl Crystal Unit Lattice", role: "ionic bonding", color: "border-slate-300 text-slate-900" },
  ];

  const handleResetStage = () => {
    setInstalledEquipment([]);
    setSelectedEquipment(null);
    resetEquipmentPositions();
    updatePhysicsParams({
      barrierHeight: 5.0,
      barrierWidth: 1.0,
      incidentEnergy: 1.0,
      transmissionProb: 0.15,
    });
  };

  const renderEquipmentButton = (item: { id: string; name: string; role: string; color: string }) => {
    const isInstalled = installedEquipment.includes(item.id);
    return (
      <button
        key={item.id}
        onClick={() => toggleEquipment(item.id)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          isInstalled
            ? "border-white bg-white text-slate-950 shadow-md font-semibold"
            : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
        }`}
      >
        <div>
          <h4 className="font-bold text-xs">{item.name}</h4>
          <span className={`text-[10px] uppercase tracking-wider font-mono ${isInstalled ? "text-slate-700" : "text-slate-400"}`}>
            Role: {item.role}
          </span>
        </div>
        <div
          className={`p-1.5 rounded-lg ${
            isInstalled ? "bg-slate-205 text-slate-950 border border-slate-300" : "bg-slate-950 text-slate-400"
          }`}
        >
          {isInstalled ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </div>
      </button>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full grid grid-cols-12 bg-slate-900 text-slate-100 overflow-hidden">
      {/* Left Panel: Scientific Elements Shelf (Col 1-3) */}
      <div className="col-span-3 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wider">
              <Layers className="w-4 h-4 text-white" />
              <span>SCIENTIFIC SHELF</span>
            </div>
            <span className="text-[10px] bg-white text-slate-950 px-2.5 py-0.5 rounded-full font-mono font-bold">
              3D READY
            </span>
          </div>

          {/* Unified Domain Category Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveCategory("quantum")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "quantum"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Quantum</span>
            </button>

            <button
              onClick={() => setActiveCategory("classical")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "classical"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Classical</span>
            </button>

            <button
              onClick={() => setActiveCategory("chemistry")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "chemistry"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chemistry</span>
            </button>
          </div>

          {/* Category List Render */}
          <div className="h-[calc(100vh-220px)] overflow-y-auto space-y-2 pr-1">
            {activeCategory === "quantum" && (
              <>
                <p className="text-[11px] text-slate-400 font-medium mb-2">
                  Quantum Equipment (Click to toggle on stage):
                </p>
                {quantumElements.map(renderEquipmentButton)}
              </>
            )}

            {activeCategory === "classical" && (
              <>
                <p className="text-[11px] text-slate-400 font-medium mb-2">
                  Classical Physics Equipment:
                </p>
                {classicalElements.map(renderEquipmentButton)}
              </>
            )}

            {activeCategory === "chemistry" && (
              <>
                <p className="text-[11px] text-slate-400 font-medium mb-2">
                  Chemistry Equipment:
                </p>
                {chemistryElements.map(renderEquipmentButton)}
              </>
            )}
          </div>
        </div>

        {/* Reset Stage Button */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={handleResetStage}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 border border-slate-800 transition-all text-xs shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Reset 3D Stage & Positions</span>
          </button>
        </div>
      </div>

      {/* Center Panel: Full Spacious 3D Canvas (Col 4-12) */}
      <div className="col-span-9 relative h-full">
        <QuantumLabCanvas />

        {/* Live Dragging Helper Overlay (Top Left) */}
        <div className="absolute top-4 left-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-md flex items-center gap-3 pointer-events-none text-white">
          <Move className="w-4 h-4 text-white animate-bounce" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              3D Drag & Drop Stage
            </span>
            <span className="text-xs font-bold text-white">
              Drag Gizmos to position equipment in 3D
            </span>
          </div>
        </div>

        {/* Floating Compact Physics Parameters Panel (Top Right Overlay) */}
        <div className="absolute top-12 right-4 w-80 p-4 rounded-2xl bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl shadow-lg space-y-3 z-10 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <SlidersHorizontal className="w-4 h-4 text-white" />
              <span>REAL-TIME PARAMETERS</span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-bold">
              {activeExperiment.id}
            </span>
          </div>

          <div className="space-y-3">
            {activeExperiment.id === "quantum-tunneling" && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Barrier Height (V0)</span>
                    <span className="text-white font-mono">{physicsState.barrierHeight} eV</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={physicsState.barrierHeight}
                    onChange={(e) => updatePhysicsParams({ barrierHeight: parseFloat(e.target.value) })}
                    className="w-full accent-white bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Barrier Width (L)</span>
                    <span className="text-white font-mono">{physicsState.barrierWidth} nm</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={physicsState.barrierWidth}
                    onChange={(e) => updatePhysicsParams({ barrierWidth: parseFloat(e.target.value) })}
                    className="w-full accent-white bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeExperiment.id === "wave-interference" && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Wavelength (λ)</span>
                    <span className="text-white font-mono">{physicsState.wavelength} nm</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="800"
                    step="10"
                    value={physicsState.wavelength}
                    onChange={(e) => updatePhysicsParams({ wavelength: parseFloat(e.target.value) })}
                    className="w-full accent-white bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeExperiment.id === "newtons-cradle" && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 mb-1 text-white" />
                <p>
                  <strong>Newton's Cradle</strong>: Demonstrates elastic collision and linear momentum transfer using real GLB pendulum assets.
                </p>
              </div>
            )}

            {activeExperiment.id === "crystal-capsule" && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 mb-1 text-white" />
                <p>
                  <strong>Crystal Capsule</strong>: Demonstrates wave packet confinement in periodic crystal lattices.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Quantitative Results Overlay Button */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setShowResultsPanel(!showResultsPanel)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showResultsPanel ? "Hide Live Results" : "Show Quantitative Results"}</span>
          </button>
        </div>

        {/* Floating Quantitative Experiment Results Panel (Bottom Right) */}
        {showResultsPanel && (
          <div className="absolute bottom-16 right-4 w-96 max-h-96 overflow-y-auto p-4 rounded-2xl bg-white/95 border border-slate-200 backdrop-blur-xl shadow-xl z-10">
            <SimulationResultsPanel
              instances={installedEquipment.map((id) => ({
                id,
                definitionId: id,
                name: id,
                position: { x: 0, y: 0 },
                rotation: 0,
                size: { width: 100, height: 100 },
                parameters: {},
              }))}
              connections={[]}
              isSimulating={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
