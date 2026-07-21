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
} from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import { QuantumLabCanvas } from "../canvas/QuantumLabCanvas";

export const ScreenFreeSandbox: React.FC = () => {
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const selectExperiment = useQuantumLabStore((state) => state.selectExperiment);
  const installedEquipment = useQuantumLabStore((state) => state.installedEquipment);
  const toggleEquipment = useQuantumLabStore((state) => state.toggleEquipment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const updatePhysicsParams = useQuantumLabStore((state) => state.updatePhysicsParams);
  const setInstalledEquipment = useQuantumLabStore((state) => state.setInstalledEquipment);
  const resetEquipmentPositions = useQuantumLabStore((state) => state.resetEquipmentPositions);
  const setSelectedEquipment = useQuantumLabStore((state) => state.setSelectedEquipment);

  const [activeCategory, setActiveCategory] = useState<"quantum" | "classical" | "chemistry">("quantum");

  // Real GLB & Scientific Elements Palette
  const quantumElements = [
    { id: "atomic-source", name: "Atomic Model Source (GLB)", role: "source", color: "border-cyan-500/40 text-cyan-400" },
    { id: "crystal-capsule", name: "Crystal Capsule Chamber (GLB)", role: "chamber", color: "border-purple-500/40 text-purple-400" },
    { id: "nuclear-reactor", name: "PWR Nuclear Reactor (GLB)", role: "chamber", color: "border-emerald-500/40 text-emerald-400" },
    { id: "riemann-sphere", name: "Qubit Riemann Sphere (GLB)", role: "analyzer", color: "border-cyan-400/40 text-cyan-300" },
    { id: "solenoid-magnet", name: "Solenoid Electromagnet (GLB)", role: "em", color: "border-pink-500/40 text-pink-400" },
    { id: "potential-barrier", name: "Potential Barrier Wall", role: "barrier", color: "border-purple-500/40 text-purple-400" },
    { id: "detector", name: "Particle Detector", role: "detector", color: "border-green-500/40 text-green-400" },
  ];

  const classicalElements = [
    { id: "newtons-cradle", name: "Newton's Cradle Apparatus (GLB)", role: "momentum", color: "border-amber-500/40 text-amber-400" },
    { id: "solenoid-magnet", name: "Solenoid Magnetic Coil (GLB)", role: "em", color: "border-pink-500/40 text-pink-400" },
  ];

  const chemistryElements = [
    { id: "bunsen-burner", name: "Chemistry Bunsen Burner (GLB)", role: "thermal", color: "border-orange-500/40 text-orange-400" },
    { id: "beaker", name: "Glass Beaker Vessel", role: "vessel", color: "border-cyan-400/40 text-cyan-300" },
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
            ? `${item.color} bg-slate-800/80 shadow-md`
            : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
        }`}
      >
        <div>
          <h4 className="font-semibold text-sm">{item.name}</h4>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Role: {item.role}
          </span>
        </div>
        <div
          className={`p-1.5 rounded-lg ${
            isInstalled ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"
          }`}
        >
          {isInstalled ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full grid grid-cols-12 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Panel: Scientific Elements Shelf (Col 1-3) */}
      <div className="col-span-3 border-r border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>SCIENTIFIC ELEMENTS SHELF</span>
            </div>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
              3D GLB LOADED
            </span>
          </div>

          {/* Experiment Switcher Header */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => selectExperiment("quantum-tunneling")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "quantum-tunneling" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Tunneling
            </button>
            <button
              onClick={() => selectExperiment("wave-interference")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "wave-interference" ? "bg-purple-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Interference
            </button>
            <button
              onClick={() => selectExperiment("mach-zehnder")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "mach-zehnder" ? "bg-blue-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Mach-Zehnder
            </button>
            <button
              onClick={() => selectExperiment("stern-gerlach")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "stern-gerlach" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Stern-Gerlach
            </button>
            <button
              onClick={() => selectExperiment("photoelectric-effect")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "photoelectric-effect" ? "bg-yellow-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Photoelectric
            </button>
            <button
              onClick={() => selectExperiment("newtons-cradle")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "newtons-cradle" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Newton Cradle
            </button>
            <button
              onClick={() => selectExperiment("crystal-capsule")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "crystal-capsule" ? "bg-pink-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Crystal Capsule
            </button>
            <button
              onClick={() => selectExperiment("rutherford-scattering")}
              className={`py-1.5 px-2 rounded-lg transition-all ${
                activeExperiment.id === "rutherford-scattering" ? "bg-rose-500 text-slate-950 font-bold" : "text-slate-400"
              }`}
            >
              Rutherford
            </button>
          </div>

          {/* Unified Domain Category Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveCategory("quantum")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "quantum"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Quantum</span>
            </button>

            <button
              onClick={() => setActiveCategory("classical")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "classical"
                  ? "bg-purple-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Classical</span>
            </button>

            <button
              onClick={() => setActiveCategory("chemistry")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeCategory === "chemistry"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chemistry</span>
            </button>
          </div>

          {/* Category List Render */}
          <div className="h-[calc(100vh-320px)] overflow-y-auto space-y-2 pr-1">
            {activeCategory === "quantum" && (
              <>
                <p className="text-[11px] text-slate-400 mb-2">
                  Quantum GLB Models (Click to toggle on 3D stage):
                </p>
                {quantumElements.map(renderEquipmentButton)}
              </>
            )}

            {activeCategory === "classical" && (
              <>
                <p className="text-[11px] text-slate-400 mb-2">
                  Classical Physics GLB Models:
                </p>
                {classicalElements.map(renderEquipmentButton)}
              </>
            )}

            {activeCategory === "chemistry" && (
              <>
                <p className="text-[11px] text-slate-400 mb-2">
                  Chemistry GLB Models:
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
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset 3D Stage & Positions</span>
          </button>
        </div>
      </div>

      {/* Center Panel: Pure 3D Canvas (Col 4-9) */}
      <div className="col-span-6 relative h-full">
        <QuantumLabCanvas />

        {/* Live Dragging Helper Overlay */}
        <div className="absolute top-4 left-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center gap-3">
          <Move className="w-5 h-5 text-cyan-400 animate-bounce" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              3D GLB Drag & Drop Enabled
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Drag PivotControls gizmos to move real 3D models on stage
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel: Physics Parameter Controls (Col 10-12) */}
      <div className="col-span-3 border-l border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm border-b border-slate-800 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>PHYSICS PARAMETERS</span>
          </div>

          <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {activeExperiment.id === "quantum-tunneling" && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Barrier Height (V0)</span>
                    <span className="text-cyan-400 font-mono">{physicsState.barrierHeight} eV</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={physicsState.barrierHeight}
                    onChange={(e) => updatePhysicsParams({ barrierHeight: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Barrier Width (L)</span>
                    <span className="text-purple-400 font-mono">{physicsState.barrierWidth} nm</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={physicsState.barrierWidth}
                    onChange={(e) => updatePhysicsParams({ barrierWidth: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeExperiment.id === "wave-interference" && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Wavelength (λ)</span>
                    <span className="text-cyan-400 font-mono">{physicsState.wavelength} nm</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="800"
                    step="10"
                    value={physicsState.wavelength}
                    onChange={(e) => updatePhysicsParams({ wavelength: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeExperiment.id === "newtons-cradle" && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-200 text-xs leading-relaxed">
                <Sparkles className="w-4 h-4 mb-1 text-amber-400" />
                <p>
                  <strong>Newton's Cradle Experiment</strong>: Demonstrates elastic collision and linear momentum transfer using real 3D GLB pendulum assets.
                </p>
              </div>
            )}

            {activeExperiment.id === "crystal-capsule" && (
              <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-purple-200 text-xs leading-relaxed">
                <Sparkles className="w-4 h-4 mb-1 text-purple-400" />
                <p>
                  <strong>Crystal Capsule Experiment</strong>: Demonstrates quantum wave packet confinement in periodic crystal lattices using real GLB geometry.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 text-xs leading-relaxed">
          <p>
            💡 <strong>Real 3D GLB Stage</strong>: Loaded GLB models for Newton's Cradle, Crystal Capsule, Bunsen Burner, Solenoid Magnet, and Nuclear Reactor!
          </p>
        </div>
      </div>
    </div>
  );
};
