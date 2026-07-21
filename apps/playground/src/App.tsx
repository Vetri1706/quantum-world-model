// Quantum Lab Main AppShell Container with Mode Toggle (AI Guided Builder vs Free Sandbox Lab)

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Atom, Settings, Sparkles, Bot, Microscope } from "lucide-react";
import { useQuantumLabStore } from "./store/useQuantumLabStore";
import { Screen1AskQuestion } from "./components/screens/Screen1AskQuestion";
import { Screen2ConceptBriefing } from "./components/screens/Screen2ConceptBriefing";
import { Screen3Playground } from "./components/screens/Screen3Playground";
import { Screen4MentorMistake } from "./components/screens/Screen4MentorMistake";
import { Screen5DiscoveryRecap } from "./components/screens/Screen5DiscoveryRecap";
import { ScreenFreeSandbox } from "./components/screens/ScreenFreeSandbox";
import { AIMentorSettingsModal } from "./components/AIMentorSettingsModal";

export const App: React.FC = () => {
  const labMode = useQuantumLabStore((state) => state.labMode);
  const setLabMode = useQuantumLabStore((state) => state.setLabMode);
  const currentScreen = useQuantumLabStore((state) => state.currentScreen);
  const setScreen = useQuantumLabStore((state) => state.setScreen);
  const aiConfig = useQuantumLabStore((state) => state.aiConfig);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation Chrome */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setScreen(1)}>
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Atom className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Quantum Lab 3D
            </h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
              Grounded QWM Sandbox
            </span>
          </div>
        </div>

        {/* Mode Toggle Switch: AI Guided Builder vs Free Sandbox Lab */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
          <button
            onClick={() => setLabMode("ai_builder")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              labMode === "ai_builder"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Guided Builder</span>
          </button>

          <button
            onClick={() => setLabMode("free_sandbox")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              labMode === "free_sandbox"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Free Sandbox (No AI)</span>
          </button>
        </div>

        {/* Mode-Specific Actions */}
        <div className="flex items-center gap-3">
          {labMode === "ai_builder" ? (
            <>
              {/* Screen Step Navigation Pills */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-slate-800/80">
                {[
                  { id: 1, label: "1. Question" },
                  { id: 2, label: "2. Briefing" },
                  { id: 3, label: "3. 3D Builder" },
                  { id: 4, label: "4. Notice" },
                  { id: 5, label: "5. Discoveries" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScreen(s.id as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      currentScreen === s.id
                        ? "bg-cyan-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* AI Provider Config Trigger */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-medium border border-slate-700/80 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">{aiConfig.provider.replace("_", " ")}</span>
                <Settings className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-purple-400" />
              <span>Pure Sandbox Mode</span>
            </div>
          )}
        </div>
      </header>

      {/* Dynamic Screen View Controller */}
      <main className="relative">
        <AnimatePresence mode="wait">
          {labMode === "free_sandbox" ? (
            <ScreenFreeSandbox key="sandbox" />
          ) : (
            <>
              {currentScreen === 1 && <Screen1AskQuestion key="screen1" />}
              {currentScreen === 2 && <Screen2ConceptBriefing key="screen2" />}
              {currentScreen === 3 && (
                <Screen3Playground
                  key="screen3"
                  onOpenAISettings={() => setIsSettingsOpen(true)}
                />
              )}
              {currentScreen === 4 && <Screen4MentorMistake key="screen4" />}
              {currentScreen === 5 && <Screen5DiscoveryRecap key="screen5" />}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* AI Settings Modal */}
      <AIMentorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
