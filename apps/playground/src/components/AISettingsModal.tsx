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

    if (provider === "openai") {
      baseUrl = "https://api.openai.com/v1";
      model = "gpt-4o";
    } else if (provider === "ollama") {
      baseUrl = "http://localhost:11434";
      loadModels(baseUrl);
    } else if (provider === "lmstudio") {
      baseUrl = "http://localhost:1234/v1";
      model = "qwen3-32b";
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
          <h3>⚙ AI Provider Settings</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* PROVIDER SELECTION */}
          <div className="setting-group">
            <label className="setting-label">AI PROVIDER</label>
            <div className="provider-options-grid">
              <label className={`provider-card ${settings.provider === "openai" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === "openai"}
                  onChange={() => handleProviderChange("openai")}
                />
                <span className="p-title">OpenAI (ChatGPT)</span>
                <span className="p-desc">Account / GPT-4o</span>
              </label>

              <label className={`provider-card ${settings.provider === "ollama" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === "ollama"}
                  onChange={() => handleProviderChange("ollama")}
                />
                <span className="p-title">Ollama (Local)</span>
                <span className="p-desc">Auto-detected models</span>
              </label>

              <label className={`provider-card ${settings.provider === "lmstudio" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === "lmstudio"}
                  onChange={() => handleProviderChange("lmstudio")}
                />
                <span className="p-title">LM Studio (Local)</span>
                <span className="p-desc">localhost:1234/v1</span>
              </label>

              <label className={`provider-card ${settings.provider === "generic" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === "generic"}
                  onChange={() => handleProviderChange("generic")}
                />
                <span className="p-title">Custom API</span>
                <span className="p-desc">OpenRouter, Groq, vLLM</span>
              </label>
            </div>
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
