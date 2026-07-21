// Screen 5: What You Discovered (Closing Recap & Next Experiment Prompt)

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, ArrowRight, Sparkles } from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";

export const Screen5DiscoveryRecap: React.FC = () => {
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const selectExperiment = useQuantumLabStore((state) => state.selectExperiment);
  const resetLabState = useQuantumLabStore((state) => state.resetLabState);

  const isTunneling = activeExperiment.id === "quantum-tunneling";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="max-w-4xl mx-auto my-10 px-6 text-slate-100"
    >
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-950/60 border border-green-500/30 text-green-400 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-green-400" />
          <span>Experiment Completed Successfully!</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-green-400 to-emerald-400 bg-clip-text text-transparent sm:text-5xl">
            What You Discovered in the 3D Lab
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Session summary of physical relationships observed using split-step Fourier numerical simulation:
          </p>
        </div>

        {/* Observed Physics Relationships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {isTunneling ? (
            <>
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Exponential Width Decay</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transmission probability T drops exponentially as barrier width L increases (T ∝ exp(-2κL)).
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1">
                  Observed at L = {physicsState.barrierWidth} nm → T = {(physicsState.transmissionProb * 100).toFixed(2)}%
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Energy vs Potential Barrier</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When particle energy E approaches barrier height V0, quantum wave packet transmission increases significantly.
                </p>
                <div className="text-xs font-mono text-purple-300 pt-1">
                  Observed E = {physicsState.incidentEnergy} eV vs V0 = {physicsState.barrierHeight} eV
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Constructive & Destructive Interference</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Superposition of wave amplitudes creates alternating bright (constructive) and dark (destructive) intensity fringes on the target screen.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Wavelength Dependence</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fringe spacing widens as wavelength increases or slit separation decreases.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={resetLabState}
            className="flex-1 py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Restart Experiment</span>
          </button>

          <button
            onClick={() =>
              selectExperiment(
                isTunneling ? "wave-interference" : "quantum-tunneling"
              )
            }
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all text-sm"
          >
            <span>Try Next Experiment ({isTunneling ? "Wave Interference" : "Quantum Tunneling"})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
