// Screen 1: Ask a Question (Natural Language Query & Quick-Start Tags)

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Atom, Sparkles, Waves, ArrowRight, Boxes, Gem, Compass, Sun, Shield, Orbit } from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import { generateExperimentTopology } from "../../services/ai/aiBuilder";

export const Screen1AskQuestion: React.FC = () => {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const selectExperiment = useQuantumLabStore((state) => state.selectExperiment);
  const applyGeneratedSetup = useQuantumLabStore((state) => state.applyGeneratedSetup);
  const addMentorMessage = useQuantumLabStore((state) => state.addMentorMessage);
  const setScreen = useQuantumLabStore((state) => state.setScreen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setMessage("Tell me what physical phenomenon you want to explore!");
      return;
    }

    const result = await generateExperimentTopology(query);
    if (result.message) {
      setMessage(result.message);
      addMentorMessage(result.message, "mentor");
    }

    if (result.supported && result.instances.length > 0) {
      if (result.experimentId) {
        selectExperiment(result.experimentId);
      }
      applyGeneratedSetup(result.instances, result.connections);
      setScreen(3); // Navigate straight to 3D Builder stage
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-slate-100 py-8"
    >
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-sm font-medium backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Interactive Scientific 3D Experiment Playground</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent sm:text-6xl">
          What physical phenomenon do you want to explore today?
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Ask your AI mentor a question or specify an experiment. The AI will parse your intent, construct the 3D lab topology, and guide your observations in real time.
        </p>

        {/* Question Search Box */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'build a Mach-Zehnder interferometer' or 'show quantum tunneling'"
            className="w-full px-6 py-5 rounded-2xl bg-slate-900/90 border border-slate-700/60 text-slate-100 placeholder-slate-500 text-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 shadow-2xl backdrop-blur-xl transition-all"
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg transition-all"
          >
            <span>Ask AI Builder</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        {message && (
          <p role="status" className="max-w-2xl mx-auto -mt-4 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-3 text-left text-sm text-cyan-200">
            {message}
          </p>
        )}

        {/* Quick-Start Experiment Cards */}
        <div className="pt-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Or choose a high-level 3D lab experiment:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <button
              onClick={() => selectExperiment("quantum-tunneling")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 mb-3">
                <Atom className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  Quantum Tunneling
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Electron wave penetration & Scanning Tunneling Microscope (STM)
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("wave-interference")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-3">
                <Waves className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">
                  Young's Double Slit
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Wave-particle duality & interference pattern fringes
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("mach-zehnder")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                  Mach-Zehnder
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Photon path splitting & phase superposition interference
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("stern-gerlach")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-3">
                <Orbit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Stern-Gerlach
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Spatial quantization of intrinsic quantum spin (ħ/2)
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("photoelectric-effect")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-yellow-500/10 text-yellow-400 mb-3">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-yellow-400 transition-colors">
                  Photoelectric Effect
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Light quanta energy E = hf & photoelectron ejection
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("newtons-cradle")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400 mb-3">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  Newton's Cradle
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Momentum conservation & 3D elastic pendulum collisions
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("crystal-capsule")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-pink-500/10 text-pink-400 mb-3">
                <Gem className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-pink-400 transition-colors">
                  Crystal Band Structure
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Periodic potential wells & bandgap energy trapping
                </p>
              </div>
            </button>

            <button
              onClick={() => selectExperiment("rutherford-scattering")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-rose-500/10 text-rose-400 mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-rose-400 transition-colors">
                  Rutherford Scattering
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Alpha particle backscattering & dense atomic nucleus
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
