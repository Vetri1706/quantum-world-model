// Screen 2: Concept + Elements Briefing (Mentor Explanation & Required Elements Checklist)

import React from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, Play, Wrench, ArrowLeft, Eye, ListChecks } from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";

export const Screen2ConceptBriefing: React.FC = () => {
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const setScreen = useQuantumLabStore((state) => state.setScreen);
  const resetLabState = useQuantumLabStore((state) => state.resetLabState);
  const setInstalledEquipment = useQuantumLabStore((state) => state.setInstalledEquipment);

  const components = activeExperiment.configuration.components;

  const handleBuildStepByStep = () => {
    setScreen(3);
  };

  const handleBuildForMe = () => {
    const requiredComps = components.map((c) => c.component);
    setInstalledEquipment(requiredComps);
    setScreen(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto my-10 px-6 text-slate-100"
    >
      <button
        onClick={resetLabState}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Question Prompt</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-8">
        {/* Mentor Header */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
          <h2 className="text-xl font-bold text-cyan-300">
              {activeExperiment.name}
            </h2>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              "{activeExperiment.scientific_question}"
            </p>
            <p className="text-cyan-100/70 text-sm mt-3 leading-relaxed">{activeExperiment.short_description}</p>
          </div>
        </div>

        {/* Educational Notes */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">The Physics Concept</h3>
          <p className="text-slate-400 text-sm leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            {activeExperiment.educational_notes}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-3">
              <ListChecks className="w-4 h-4" />
              <span>Try this</span>
            </div>
            <ol className="space-y-2 text-sm text-slate-300">
              {activeExperiment.steps.map((step, index) => <li key={step}><span className="mr-2 text-cyan-400 font-mono">{index + 1}.</span>{step}</li>)}
            </ol>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm mb-3">
              <Eye className="w-4 h-4" />
              <span>Watch for</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {activeExperiment.what_to_watch.map((observation) => <li key={observation} className="flex gap-2"><span className="text-purple-400">•</span>{observation}</li>)}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
          <strong>Expected result:</strong> {activeExperiment.expected_observation}
        </div>

        {/* Required Equipment Checklist */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">
            Required Apparatus Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {components.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm capitalize">
                    {c.component.replace("-", " ")}
                  </h4>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Role: {c.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleBuildStepByStep}
            className="flex-1 py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Build It Step by Step</span>
          </button>

          <button
            onClick={handleBuildForMe}
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Just Build It For Me & Run 3D Lab</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
