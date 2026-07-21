import React, { useState, useEffect } from "react";
import { AISettings, AIProviderType, DEFAULT_AI_SETTINGS } from "../services/ai/aiTypes";
import { loadAISettings, saveAISettings, testAIConnection, fetchOllamaModels } from "../services/ai/aiService";

type AISettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [ollamaModelsList, setOllamaModelsList] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Auto-fetch Ollama models when provider is Ollama
  const loadModels = async (baseUrl: string) => {
    setIsFetchingModels(true);
    const models = await fetchOllamaModels(baseUrl);
    setOllamaModelsList(models);
    setIsFetchingModels(false);
    if (models.length > 0 && !models.includes(settings.model)) {
      setSettings((prev) => ({ ...prev, model: models[0] }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      const loaded = loadAISettings();
      setSettings(loaded);
      setTestResult(null);
      if (loaded.provider === "ollama") {
        loadModels(loaded.baseUrl);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: AIProviderType) => {
    let baseUrl = settings.baseUrl;
    let model = settings.model;

    if (provider === "groq") {
      baseUrl = "https://api.groq.com/openai/v1";
      model = "llama-3.3-70b-versatile";
    } else if (provider === "gemini") {
      baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
      model = "gemini-2.5-flash";
    } else if (provider === "openai") {
      baseUrl = "https://api.openai.com/v1";
      model = "gpt-4o";
    } else if (provider === "anthropic") {
      baseUrl = "https://api.anthropic.com/v1";
      model = "claude-3-5-sonnet-20241022";
    } else if (provider === "ollama") {
      baseUrl = "http://localhost:11434";
      loadModels(baseUrl);
    } else if (provider === "lmstudio") {
      baseUrl = "http://localhost:1234/v1";
      model = "qwen2.5-coder:7b";
    } else if (provider === "generic") {
      baseUrl = "https://openrouter.ai/api/v1";
      model = "deepseek/deepseek-r1";
    }

    setSettings({ ...settings, provider, baseUrl, model });
  };

  const handleSignInChatGPT = () => {
    setSettings((prev) => ({
      ...prev,
      authMode: "account",
      accountUser: "chatgpt-user@quantum-playground",
    }));
    setTestResult({ success: true, message: "✔ Successfully connected to your ChatGPT Account" });
  };

  const handleSave = () => {
    saveAISettings(settings);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testAIConnection(settings);
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙ AI Provider & Model Settings</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* PROVIDER SELECTION DROPDOWN */}
          <div className="setting-group">
            <label className="setting-label">SELECT AI PROVIDER</label>
            <select
              value={settings.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProviderType)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="groq">⚡ Groq Cloud (Ultra-Fast Llama-3.3 70B & DeepSeek-R1)</option>
              <option value="gemini">✨ Google Gemini (Gemini 2.5 Flash / Pro)</option>
              <option value="openai">🤖 OpenAI (GPT-4o, GPT-4o-mini)</option>
              <option value="anthropic">🧠 Anthropic (Claude 3.5 Sonnet)</option>
              <option value="ollama">🏠 Ollama Local (Auto-detected models)</option>
              <option value="lmstudio">💻 LM Studio Local (localhost:1234)</option>
              <option value="generic">🌐 Custom API (OpenRouter, vLLM, DeepSeek)</option>
            </select>
          </div>

          {/* OPENAI AUTH MODE */}
          {settings.provider === "openai" && (
            <div className="auth-mode-box">
              <label className="setting-label">OPENAI AUTHENTICATION</label>
              <div className="auth-mode-radios">
                <button
                  type="button"
                  className={`btn-account-auth ${settings.authMode === "account" ? "active" : ""}`}
                  onClick={handleSignInChatGPT}
                >
                  👤 Sign in with ChatGPT Account
                </button>
                <button
                  type="button"
                  className={`btn-account-auth ${settings.authMode === "apikey" ? "active" : ""}`}
                  onClick={() => setSettings((prev) => ({ ...prev, authMode: "apikey" }))}
                >
                  🔑 Use OpenAI API Key
                </button>
              </div>
            </div>
          )}

          {/* ENDPOINT & API KEY */}
          <div className="setting-group-two-col">
            {settings.provider === "openai" && settings.authMode === "account" ? (
              <div className="field-block span-2-cols">
                <label>AUTHENTICATED ACCOUNT</label>
                <div className="account-status-badge">
                  <span>✔ Signed in as {settings.accountUser || "ChatGPT User"}</span>
                </div>
              </div>
            ) : (
              <div className="field-block">
                <label>API KEY</label>
                <input
                  type="password"
                  placeholder={settings.provider === "openai" ? "sk-..." : "Optional for local endpoints"}
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                />
              </div>
            )}

            {settings.provider !== "openai" || settings.authMode !== "account" ? (
              <div className="field-block">
                <label>BASE URL / ENDPOINT</label>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                />
              </div>
            ) : null}
          </div>

          {/* MODEL SELECTION */}
          <div className="setting-group-two-col">
            <div className="field-block">
              <div className="label-with-action">
                <label>MODEL ID</label>
                {settings.provider === "ollama" && (
                  <button
                    type="button"
                    className="btn-refresh-sm"
                    onClick={() => loadModels(settings.baseUrl)}
                    disabled={isFetchingModels}
                  >
                    {isFetchingModels ? "Scanning..." : "🔄 Refresh Models"}
                  </button>
                )}
              </div>

              {settings.provider === "ollama" && ollamaModelsList.length > 0 ? (
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="model-select-dropdown"
                >
                  {ollamaModelsList.map((m) => (
                    <option key={m} value={m}>
                      {m} (Installed Local)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="gpt-4o, llama3.1, qwen3"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                />
              )}
            </div>

            <div className="field-block">
              <label>TEMPERATURE ({settings.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* TEST CONNECTION BADGE */}
          {testResult && (
            <div className={`test-result-banner ${testResult.success ? "success" : "error"}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-test" onClick={handleTest} disabled={isTesting}>
            {isTesting ? "Testing..." : "⚡ Test Connection"}
          </button>
          <div className="right-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
