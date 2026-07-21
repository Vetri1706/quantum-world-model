// Screen 3: Builder / Playground (3-Panel Layout: Palette, 3D R3F Canvas, Leva Controls & AI Mentor Commentary)

import React, { useState, useEffect } from "react";
import {
  Layers,
  Settings,
  Bot,
  Plus,
  Check,
  Send,
  SlidersHorizontal,
  Award,
} from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import { QuantumLabCanvas } from "../canvas/QuantumLabCanvas";
import { generateMentorCommentary } from "../../services/aiMentorService";
import { generateExperimentTopology } from "../../services/ai/aiBuilder";

export const Screen3Playground: React.FC<{ onOpenAISettings: () => void }> = ({
  onOpenAISettings,
}) => {
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const installedEquipment = useQuantumLabStore((state) => state.installedEquipment);
  const toggleEquipment = useQuantumLabStore((state) => state.toggleEquipment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const updatePhysicsParams = useQuantumLabStore((state) => state.updatePhysicsParams);
  const mentorFeed = useQuantumLabStore((state) => state.mentorFeed);
  const addMentorMessage = useQuantumLabStore((state) => state.addMentorMessage);
  const aiConfig = useQuantumLabStore((state) => state.aiConfig);
  const setScreen = useQuantumLabStore((state) => state.setScreen);
  const missingEquipment = useQuantumLabStore((state) => state.missingEquipment);
  const applyGeneratedSetup = useQuantumLabStore((state) => state.applyGeneratedSetup);
  const selectExperiment = useQuantumLabStore((state) => state.selectExperiment);

  const [userPrompt, setUserPrompt] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [builderPrompt, setBuilderPrompt] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [builderMessage, setBuilderMessage] = useState("");

  // Available equipment items
  const availablePalette = [
    { id: "electron-source", name: "Electron Source", role: "source", color: "border-cyan-500/40 text-cyan-400" },
    { id: "potential-barrier", name: "Potential Barrier", role: "barrier", color: "border-purple-500/40 text-purple-400" },
    { id: "detector", name: "Particle Detector", role: "detector", color: "border-green-500/40 text-green-400" },
    { id: "laser-source", name: "Laser Source", role: "source", color: "border-cyan-500/40 text-cyan-400" },
    { id: "double-slit-mask", name: "Double-Slit Plate", role: "barrier", color: "border-purple-500/40 text-purple-400" },
    { id: "screen-detector", name: "Target Screen", role: "detector", color: "border-green-500/40 text-green-400" },
    { id: "newtons-cradle", name: "Newton's Cradle", role: "classical apparatus", color: "border-amber-500/40 text-amber-400" },
    { id: "crystal-capsule", name: "Crystal Capsule", role: "quantum lattice", color: "border-pink-500/40 text-pink-400" },
    { id: "solenoid-magnet", name: "Solenoid Magnet", role: "field source", color: "border-pink-500/40 text-pink-400" },
    { id: "riemann-sphere", name: "Qubit Sphere", role: "state analyzer", color: "border-cyan-400/40 text-cyan-300" },
    { id: "bunsen-burner", name: "Bunsen Burner", role: "thermal source", color: "border-orange-500/40 text-orange-400" },
    { id: "beaker", name: "Glass Beaker", role: "vessel", color: "border-cyan-400/40 text-cyan-300" },
  ];

  // If missing equipment detected, switch to Screen 4
  useEffect(() => {
    if (missingEquipment.length > 0) {
      setScreen(4);
    }
  }, [missingEquipment.length, setScreen]);

  const handleAskMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;

    const query = userPrompt.trim();
    setUserPrompt("");
    addMentorMessage(query, "user");
    setIsAsking(true);

    const commentary = await generateMentorCommentary(
      {
        experimentId: activeExperiment.id,
        experimentName: activeExperiment.name,
        incidentEnergy: physicsState.incidentEnergy,
        barrierHeight: physicsState.barrierHeight,
        barrierWidth: physicsState.barrierWidth,
        transmissionProb: physicsState.transmissionProb,
        missingEquipment,
        userQuery: query,
      },
      aiConfig
    );

    addMentorMessage(commentary, "mentor");
    setIsAsking(false);
  };

  const handleBuildPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = builderPrompt.trim();
    if (!prompt || isBuilding) return;
    setIsBuilding(true);
    setBuilderMessage("");
    const result = await generateExperimentTopology(prompt);
    if (!result.supported) {
      setBuilderMessage(result.message);
      addMentorMessage(result.message, "mentor");
      setIsBuilding(false);
      return;
    }
    if (result.experimentId && result.experimentId !== activeExperiment.id) {
      selectExperiment(result.experimentId);
    }
    applyGeneratedSetup(result.instances, result.connections);
    setBuilderPrompt("");
    setBuilderMessage(result.message);
    addMentorMessage(result.message, "mentor");
    setIsBuilding(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full grid grid-cols-12 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Panel: Elements Palette (Col 1-3) */}
      <div className="col-span-3 border-r border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>ELEMENTS PALETTE</span>
          </div>

          <p className="text-xs text-slate-400">
            Click to add or remove physical equipment from the 3D lab stage:
          </p>

          <form onSubmit={handleBuildPrompt} className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2">
            <label htmlFor="builder-prompt" className="text-[10px] uppercase tracking-wider font-bold text-cyan-300">AI setup builder</label>
            <input
              id="builder-prompt"
              value={builderPrompt}
              onChange={(event) => setBuilderPrompt(event.target.value)}
              placeholder="e.g. build a double-slit lab"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
            <button type="submit" disabled={isBuilding || !builderPrompt.trim()} className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
              {isBuilding ? "Reading your request..." : "Build this setup"}
            </button>
            {builderMessage && <p role="status" className="text-[11px] leading-relaxed text-cyan-100">{builderMessage}</p>}
          </form>

          <div className="space-y-2">
            {availablePalette.map((item) => {
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
            })}
          </div>
        </div>

        {/* Finish Experiment Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => setScreen(5)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all text-sm"
          >
            <Award className="w-4 h-4" />
            <span>Complete & View Discoveries</span>
          </button>
        </div>
      </div>

      {/* Center Panel: 3D R3F Scene Canvas (Col 4-8) */}
      <div className="col-span-6 relative h-full">
        <QuantumLabCanvas />

        {/* Real-time Transmission Probability Overlay */}
        <div className="absolute top-4 left-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Transmission Probability (T)
            </span>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {(physicsState.transmissionProb * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-400 transition-all duration-300"
              style={{ width: `${Math.min(100, physicsState.transmissionProb * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Panel: Leva Controls & AI Mentor Feed (Col 9-12) */}
      <div className="col-span-3 border-l border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-4">
          {/* Controls Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>REAL-TIME CONTROLS</span>
            </div>

            <button
              onClick={onOpenAISettings}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Configure AI Mentor Provider"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="capitalize">{aiConfig.provider.replace("_", " ")}</span>
            </button>
          </div>

          {/* Real-time Parameters (Leva style) */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            {activeExperiment.id === "quantum-tunneling" ? (
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
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg"
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
                    className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Incident Energy (E)</span>
                    <span className="text-green-400 font-mono">{physicsState.incidentEnergy} eV</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="10.0"
                    step="0.2"
                    value={physicsState.incidentEnergy}
                    onChange={(e) => updatePhysicsParams({ incidentEnergy: parseFloat(e.target.value) })}
                    className="w-full accent-green-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              </>
            ) : (
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
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Slit Separation (d)</span>
                    <span className="text-purple-400 font-mono">{physicsState.slitSeparation} μm</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={physicsState.slitSeparation}
                    onChange={(e) => updatePhysicsParams({ slitSeparation: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              </>
            )}
          </div>

          {/* AI Mentor Chat Feed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs border-b border-slate-800 pb-2">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE MENTOR COMMENTARY</span>
            </div>

            <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs">
              {mentorFeed.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl border ${
                    msg.sender === "mentor"
                      ? "bg-slate-900/90 border-slate-800 text-slate-300"
                      : "bg-cyan-950/50 border-cyan-500/30 text-cyan-200 ml-4"
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleAskMentor} className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Ask mentor about physics..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isAsking}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
