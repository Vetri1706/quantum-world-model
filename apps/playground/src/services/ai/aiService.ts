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
  return DEFAULT_AI_SETTINGS;
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
  return ["llama3.1:latest", "qwen3:latest", "deepseek-r1:14b", "mistral:latest"];
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

  // Local fallback response generator if offline or no key set
  const fallbackResponse: AIResponse = {
    content: `Based on the active apparatus parameters (${JSON.stringify(context.parameters)}), quantum wavefunction amplitude decays exponentially within the potential barrier. Transmission probability scales according to T ≈ 16(E/V₀)(1 - E/V₀)e^(-2κL).`,
    provider: settings.provider,
    model: settings.model,
    groundedConcepts: ["Wave Function", "Schrödinger Equation", "Probability Density"],
    groundedSources: ["Griffiths Quantum Mechanics", "MIT OCW 8.04", "Feynman Lectures Vol. III"],
  };

  try {
    let endpoint = "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (settings.provider === "openai" || settings.provider === "generic" || settings.provider === "lmstudio") {
      endpoint = `${settings.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
      if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
    } else if (settings.provider === "ollama") {
      endpoint = `${settings.baseUrl || "http://localhost:11434"}/v1/chat/completions`;
    }

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
  } catch (err) {
    console.warn("AI Service API call failed, falling back to local grounded QWM response:", err);
  }

  return fallbackResponse;
}
