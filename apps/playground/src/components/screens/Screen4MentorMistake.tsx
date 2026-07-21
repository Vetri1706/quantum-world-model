// Screen 4: Mentor Catches a Mistake (Card sliding in via Framer Motion when equipment is missing)

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, PlusCircle, ArrowRight } from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";

export const Screen4MentorMistake: React.FC = () => {
  const missingEquipment = useQuantumLabStore((state) => state.missingEquipment);
  const addEquipment = useQuantumLabStore((state) => state.addEquipment);
  const setScreen = useQuantumLabStore((state) => state.setScreen);

  const handleAddBack = () => {
    missingEquipment.forEach((comp) => {
      addEquipment(comp);
    });
    setScreen(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 text-slate-100"
    >
      <div className="max-w-xl w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
          <div className="p-3 rounded-xl bg-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mentor Notice: Apparatus Missing!</h2>
            <p className="text-xs text-amber-200/80">
              The experiment cannot run properly without essential equipment.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-200">
            Missing Elements Required for Measurement:
          </h3>
          <ul className="space-y-2">
            {missingEquipment.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-sm capitalize"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{item.replace("-", " ")}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          Why this matters: In quantum mechanics, a wave packet requires a potential barrier to demonstrate tunneling, and a particle detector is required to collapse the superposition state into an observable probability density measurement.
        </p>

        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleAddBack}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Missing Equipment Back to Stage</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
