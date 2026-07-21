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

            <button
              onClick={() => selectExperiment("quantum-tunneling")}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-left"
            >
              <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 mb-3">
                <Orbit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  Quantum Ring (3D GLB)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Aharonov-Bohm magnetic phase & 3D ring electron interference
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Historical Evolution of Atomic Models Showcase */}
        <div className="pt-16 pb-8 border-t border-slate-800/80 text-left max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Atom className="w-3.5 h-3.5" />
              <span>Historical Timeline</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100">
              Historical Evolution of Atomic Models (1803 – 1926)
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Explore how humanity's understanding of matter progressed from Dalton's solid billiard ball to Schrödinger's 3D quantum orbital probability clouds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">1803</span>
              <h3 className="text-base font-bold text-slate-100 mt-1">John Dalton</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <strong>Solid Sphere Model</strong>: Atoms are indivisible, neutral hard spheres.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                Billiards Ball
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">1904</span>
              <h3 className="text-base font-bold text-slate-100 mt-1">J.J. Thomson</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <strong>Plum Pudding Model</strong>: Negative corpuscles embedded in positive sphere.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                Subatomic Charge
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider font-mono">1911</span>
              <h3 className="text-base font-bold text-slate-100 mt-1">E. Rutherford</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <strong>Nuclear Model</strong>: Gold foil experiment proved a dense positive nucleus.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                Planetary Orbits
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">1913</span>
              <h3 className="text-base font-bold text-slate-100 mt-1">Niels Bohr</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <strong>Quantized Shells</strong>: Discrete orbits with E = -13.6/n² eV quanta transitions.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                Energy Quanta
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">1926</span>
              <h3 className="text-base font-bold text-slate-100 mt-1">E. Schrödinger</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <strong>Quantum Cloud Model</strong>: 3D probability density wavefunctions |Ψ(x,y,z)|².
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                Wave Orbitals
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
