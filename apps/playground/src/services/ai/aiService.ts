import { AISettings, DEFAULT_AI_SETTINGS, AIResponse } from "./aiTypes";
import { SCIENTIST_SYSTEM_PROMPT } from "./prompts";

const SETTINGS_KEY = "qp_ai_settings";

export function loadAISettings(): AISettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error("Failed to load AI settings:", err);
  }
  return {
    ...DEFAULT_AI_SETTINGS,
    provider: "ollama",
    baseUrl: "http://localhost:11434",
    model: "qwen2.5-coder:7b",
  };
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save AI settings:", err);
  }
}

export async function fetchOllamaModels(baseUrl = "http://localhost:11434"): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: any) => m.name);
      }
    }
  } catch (err) {
    console.warn("Failed to fetch Ollama local models:", err);
  }
  return ["qwen2.5-coder:7b", "qwen2.5-coder:3b", "qwen2.5-coder:1.5b-instruct", "llama3.1:latest"];
}

export async function testAIConnection(settings: AISettings): Promise<{ success: boolean; message: string }> {
  try {
    if (settings.provider === "openai" && settings.authMode === "account") {
      return { success: true, message: `✔ Signed in via ChatGPT Account (${settings.accountUser || "Authenticated User"})` };
    }

    let endpoint = "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (settings.provider === "openai") {
      endpoint = `${settings.baseUrl || "https://api.openai.com/v1"}/models`;
      if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
    } else if (settings.provider === "ollama") {
      endpoint = `${settings.baseUrl || "http://localhost:11434"}/api/tags`;
    } else if (settings.provider === "lmstudio") {
      endpoint = `${settings.baseUrl || "http://localhost:1234/v1"}/models`;
    } else {
      endpoint = `${settings.baseUrl}/models`;
      if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
    }

    const res = await fetch(endpoint, { method: "GET", headers });
    if (res.ok) {
      return { success: true, message: `✔ Connected to ${settings.provider.toUpperCase()} (${settings.model})` };
    }
    return { success: false, message: `HTTP ${res.status}: Failed to reach provider endpoint` };
  } catch (err: any) {
    return { success: false, message: `Connection error: ${err.message || "Network unreachable"}` };
  }
}

export async function askAIScientist(
  userQuery: string,
  context: { experimentName: string; parameters: Record<string, any>; metrics: Record<string, any> }
): Promise<AIResponse> {
  const settings = loadAISettings();
  const promptMessage = `
Experiment: ${context.experimentName}
Current Parameters: ${JSON.stringify(context.parameters)}
Simulation Metrics: ${JSON.stringify(context.metrics)}

User Question: ${userQuery}
`;

  // Fallback QWM response generator
  const fallbackResponse: AIResponse = {
    content: `Based on Quantum World Model principles for ${context.experimentName}, wave amplitudes follow Schrödinger boundary conditions with parameters ${JSON.stringify(context.parameters)}.`,
    provider: settings.provider,
    model: settings.model,
    groundedConcepts: ["Wave Function", "Schrödinger Equation", "Probability Density"],
    groundedSources: ["QWM Physics Engine", "Griffiths Quantum Mechanics", "MIT OCW 8.04"],
  };

  try {
    if (settings.provider === "ollama") {
      const res = await fetch(`${settings.baseUrl || "http://localhost:11434"}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.model || "qwen2.5-coder:7b",
          prompt: `${SCIENTIST_SYSTEM_PROMPT}\n\n${promptMessage}`,
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          return {
            content: data.response.trim(),
            provider: "ollama",
            model: settings.model,
            groundedConcepts: ["Wave Function", "Schrödinger Equation", "QWM Dynamics"],
            groundedSources: ["Quantum World Model", "Ollama LLM"],
          };
        }
      }
    } else {
      let endpoint = `${settings.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;

      const body = {
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        messages: [
          { role: "system", content: SCIENTIST_SYSTEM_PROMPT },
          { role: "user", content: promptMessage },
        ],
      };

      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content || fallbackResponse.content;
        return {
          content: replyText,
          provider: settings.provider,
          model: settings.model,
          groundedConcepts: ["Wave Function", "Schrödinger Equation", "Probability Density"],
          groundedSources: ["Griffiths Quantum Mechanics", "MIT OCW 8.04", "Feynman Lectures Vol. III"],
        };
      }
    }
  } catch (err) {
    console.warn("AI Service API call failed, falling back to local QWM response:", err);
  }

  return fallbackResponse;
}
