// AI Mentor Provider Settings Modal (Ollama Autodetection, ChatGPT OAuth Proxy, API Keys, QWM Local Engine)

import React, { useState, useEffect } from "react";
import { X, RefreshCw, Check, Bot, Sparkles, Key, Server, Cpu } from "lucide-react";
import { useQuantumLabStore } from "../store/useQuantumLabStore";
import { autodetectOllamaModels, AIProvider } from "../services/aiMentorService";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AIMentorSettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const aiConfig = useQuantumLabStore((state) => state.aiConfig);
  const updateAIConfig = useQuantumLabStore((state) => state.updateAIConfig);
  const availableOllamaModels = useQuantumLabStore((state) => state.availableOllamaModels);
  const setOllamaModels = useQuantumLabStore((state) => state.setOllamaModels);

  const [provider, setProvider] = useState<AIProvider>(aiConfig.provider);
  const [ollamaUrl, setOllamaUrl] = useState(aiConfig.ollamaBaseUrl);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState(aiConfig.ollamaModel);
  const [proxyUrl, setProxyUrl] = useState(aiConfig.proxyBaseUrl);
  const [apiKey, setApiKey] = useState(aiConfig.openaiApiKey);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanOllama = async () => {
    setIsScanning(true);
    const models = await autodetectOllamaModels(ollamaUrl);
    setOllamaModels(models);
    if (models.length > 0) {
      setSelectedOllamaModel(models[0]);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleScanOllama();
    }
  }, [isOpen]);

  const handleSave = () => {
    updateAIConfig({
      provider,
      ollamaBaseUrl: ollamaUrl,
      ollamaModel: selectedOllamaModel,
      proxyBaseUrl: proxyUrl,
      openaiApiKey: apiKey,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Mentor Provider & Model Settings</h3>
              <p className="text-xs text-slate-400">Connect local Ollama, ChatGPT OAuth proxy, or OpenAI API</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Select Active AI Provider
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. QWM Local Fallback Engine */}
            <button
              onClick={() => setProvider("qwm_local")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                provider === "qwm_local"
                  ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                  : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">QWM Physics Local</h4>
                <p className="text-[11px] text-slate-400">Grounded physics explanations (No API key needed)</p>
              </div>
            </button>

            {/* 2. Ollama Local Autodetect */}
            <button
              onClick={() => setProvider("ollama")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                provider === "ollama"
                  ? "border-purple-500 bg-purple-950/40 text-purple-200"
                  : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Server className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Ollama Local</h4>
                <p className="text-[11px] text-slate-400">Autodetect downloaded local models</p>
              </div>
            </button>

            {/* 3. ChatGPT OAuth / OpenClaw Proxy */}
            <button
              onClick={() => setProvider("chatgpt_oauth")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                provider === "chatgpt_oauth"
                  ? "border-green-500 bg-green-950/40 text-green-200"
                  : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Sparkles className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">ChatGPT OAuth Proxy</h4>
                <p className="text-[11px] text-slate-400">Via OpenCode / OpenClaw local port</p>
              </div>
            </button>

            {/* 4. OpenAI Direct API Key */}
            <button
              onClick={() => setProvider("openai")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                provider === "openai"
                  ? "border-amber-500 bg-amber-950/40 text-amber-200"
                  : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-200">OpenAI API Key</h4>
                <p className="text-[11px] text-slate-400">Direct API key (GPT-4o)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Provider Inputs */}
        {provider === "ollama" && (
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Ollama Instance URL</label>
              <button
                onClick={handleScanOllama}
                disabled={isScanning}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                <span>Autodetect Models</span>
              </button>
            </div>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
            />

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Downloaded Ollama Model ({availableOllamaModels.length} detected)
              </label>
              {availableOllamaModels.length > 0 ? (
                <select
                  value={selectedOllamaModel}
                  onChange={(e) => setSelectedOllamaModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  {availableOllamaModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedOllamaModel}
                  onChange={(e) => setSelectedOllamaModel(e.target.value)}
                  placeholder="e.g. llama3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
              )}
            </div>
          </div>
        )}

        {provider === "chatgpt_oauth" && (
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              ChatGPT OAuth Local Proxy Address
            </label>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://localhost:8000/v1"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Run OpenCode or OpenClaw proxy on your machine to route prompts directly through your active ChatGPT subscription.
            </p>
          </div>
        )}

        {provider === "openai" && (
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">OpenAI API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
            />
          </div>
        )}

        {/* Save & Apply */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
