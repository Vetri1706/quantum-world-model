// Quantum Lab Main AppShell Container with Mode Toggle (AI Guided Builder vs Free Sandbox Lab)

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, Sparkles, Bot, Microscope, Rocket } from "lucide-react";
import { useQuantumLabStore } from "./store/useQuantumLabStore";
import { Screen1AskQuestion } from "./components/screens/Screen1AskQuestion";
import { Screen2ConceptBriefing } from "./components/screens/Screen2ConceptBriefing";
import { Screen3Playground } from "./components/screens/Screen3Playground";
import { Screen4MentorMistake } from "./components/screens/Screen4MentorMistake";
import { Screen5DiscoveryRecap } from "./components/screens/Screen5DiscoveryRecap";
import { ScreenFreeSandbox } from "./components/screens/ScreenFreeSandbox";
import { AISettingsModal } from "./components/AISettingsModal";
import { QuantumLeapLoadingScreen } from "./components/QuantumLeapLoadingScreen";

export const App: React.FC = () => {
  const currentScreen = useQuantumLabStore((state) => state.currentScreen);
  const setScreen = useQuantumLabStore((state) => state.setScreen);
  const labMode = useQuantumLabStore((state) => state.labMode);
  const setLabMode = useQuantumLabStore((state) => state.setLabMode);
  const aiConfig = useQuantumLabStore((state) => state.aiConfig);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingScreenOpen, setIsLoadingScreenOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-white selection:text-slate-900">
      {/* Top Header Navigation Chrome (BlenderGPT Style) */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setScreen(1)}>
          <img src="/noeta_logo.png" alt="noeta" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="font-black text-xl tracking-tight text-white lowercase leading-none">
              noeta
            </h1>
            <span className="text-[10px] text-slate-400 lowercase tracking-tight font-medium block mt-0.5">
              learn by discovering, not reading
            </span>
          </div>
        </div>

        {/* Mode Toggle Switch: AI Guided Builder vs Free Sandbox Lab */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => {
              setIsLoadingScreenOpen(true);
              setLabMode("ai_builder");
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              labMode === "ai_builder"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Guided Builder</span>
          </button>

          <button
            onClick={() => {
              setIsLoadingScreenOpen(true);
              setLabMode("free_sandbox");
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              labMode === "free_sandbox"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Free Sandbox (No AI)</span>
          </button>
        </div>

        {/* Mode-Specific Actions & Quantum Warp Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLoadingScreenOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs border border-slate-800"
            title="Preview 3D Noeta Warp Loading Screen"
          >
            <Rocket className="w-4 h-4" />
            <span>Noeta Warp Load</span>
          </button>

          {labMode === "ai_builder" ? (
            <>
              {/* Screen Step Navigation Pills */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-full border border-slate-800">
                {[
                  { id: 1, label: "1. Question" },
                  { id: 2, label: "2. Briefing" },
                  { id: 3, label: "3. 3D Builder" },
                  { id: 4, label: "4. Notice" },
                  { id: 5, label: "5. Discoveries" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setIsLoadingScreenOpen(true);
                      setScreen(s.id as any);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                      currentScreen === s.id
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* AI Provider Config Trigger */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold border border-slate-800 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="capitalize">{aiConfig.provider.replace("_", " ")}</span>
                <Settings className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <Microscope className="w-4 h-4 text-white" />
              <span>Pure Sandbox Mode</span>
            </div>
          )}
        </div>
      </header>

      {/* Main View Router */}
      <main className="w-full">
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

      {/* AI Settings Modal & 3D Quantum Leap Loading Screen */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <QuantumLeapLoadingScreen
        isOpen={isLoadingScreenOpen}
        onClose={() => {
          setIsLoadingScreenOpen(false);
          window.scrollTo(0, 0);
        }}
      />
    </div>
  );
};

export default App;
