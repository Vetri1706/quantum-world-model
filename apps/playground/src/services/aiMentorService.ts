// AI Mentor Service supporting Ollama Autodetect, OpenAI / ChatGPT OAuth Proxy, API Keys, and QWM Physics Grounding

export type AIProvider = "ollama" | "chatgpt_oauth" | "openai" | "qwm_local";

export type AIMentorConfig = {
  provider: AIProvider;
  ollamaModel: string;
  ollamaBaseUrl: string;
  proxyBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
};

export const defaultConfig: AIMentorConfig = {
  provider: "ollama",
  ollamaModel: "qwen2.5-coder:7b",
  ollamaBaseUrl: "http://localhost:11434",
  proxyBaseUrl: "http://localhost:8000/v1",
  openaiApiKey: "",
  openaiModel: "gpt-4o",
};

export type MentorPromptContext = {
  experimentId: string;
  experimentName: string;
  incidentEnergy: number;
  barrierHeight: number;
  barrierWidth: number;
  transmissionProb: number;
  missingEquipment: string[];
  userQuery?: string;
};

/**
 * Autodetects downloaded local Ollama models by querying /api/tags
 */
export async function autodetectOllamaModels(baseUrl = "http://localhost:11434"): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: any) => m.name || m.model);
    }
    return [];
  } catch (err) {
    console.warn("Ollama autodetection offline or not running:", err);
    return [];
  }
}

/**
 * Generates AI Mentor physics commentary grounded in real live calculations & QWM data
 */
export async function generateMentorCommentary(
  context: MentorPromptContext,
  config: AIMentorConfig = defaultConfig
): Promise<string> {
  const {
    incidentEnergy,
    barrierHeight,
    barrierWidth,
    transmissionProb,
    missingEquipment,
    userQuery,
  } = context;

  // Handling missing mandatory apparatus
  if (missingEquipment.length > 0) {
    return `⚠️ Missing Element Detected: The experiment cannot observe physics without ${missingEquipment.join(
      ", "
    )}. In quantum tunneling, a potential barrier must be present to attenuate the wavefunction, and a detector is required to collapse the state!`;
  }

  const systemPrompt = `You are a Quantum Physics AI Mentor teaching students through an interactive 3D laboratory.
Strictly base your answers on real physical calculations:
- Incident Energy E = ${incidentEnergy.toFixed(2)} eV
- Barrier Height V0 = ${barrierHeight.toFixed(2)} eV
- Barrier Width L = ${barrierWidth.toFixed(2)} nm
- Transmission Probability T = ${(transmissionProb * 100).toFixed(2)}%

Cross-reference principles:
1. When E < V0, classical particles are 100% reflected. Quantum wave packets decay exponentially T ≈ exp(-2 * K * L).
2. Increasing barrier width L dramatically suppresses transmission exponentially.
3. Increasing particle energy E brings it closer to V0, increasing transmission probability T.

Keep explanations clear, engaging, and encouraging! Max 3 sentences.`;

  const userPromptText = userQuery
    ? userQuery
    : `Explain the current observed transmission probability of ${(transmissionProb * 100).toFixed(1)}% when barrier height is ${barrierHeight} eV and width is ${barrierWidth} nm.`;

  // 1. Ollama Provider
  if (config.provider === "ollama") {
    try {
      const res = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ollamaModel,
          prompt: `${systemPrompt}\n\nStudent Question: ${userPromptText}`,
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.response.trim();
      }
    } catch (e) {
      console.warn("Ollama request failed, falling back to QWM Local Mentor:", e);
    }
  }

  // 2. ChatGPT OAuth Proxy / OpenClaw Provider
  if (config.provider === "chatgpt_oauth") {
    try {
      const res = await fetch(`${config.proxyBaseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptText },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0]?.message?.content?.trim() || "";
      }
    } catch (e) {
      console.warn("ChatGPT OAuth proxy failed, falling back to QWM Local Mentor:", e);
    }
  }

  // 3. OpenAI Direct API
  if (config.provider === "openai" && config.openaiApiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.openaiModel || "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptText },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0]?.message?.content?.trim() || "";
      }
    } catch (e) {
      console.warn("OpenAI API request failed, falling back to QWM Local Mentor:", e);
    }
  }

  // 4. Default QWM Grounded Local Engine Fallback
  return generateQWMGroundedFallback(context);
}

function generateQWMGroundedFallback(ctx: MentorPromptContext): string {
  const { incidentEnergy, barrierHeight, barrierWidth, transmissionProb } = ctx;

  if (incidentEnergy < barrierHeight) {
    if (transmissionProb > 0.05) {
      return `Notice how the electron wave packet tunnels through the ${barrierHeight} eV potential barrier even though its incident energy (${incidentEnergy} eV) is below the wall! The transmission chance is ${(
        transmissionProb * 100
      ).toFixed(1)}%. Quantum mechanics allows non-zero amplitude to penetrate the barrier exponentially.`;
    } else {
      return `The barrier is currently too wide (${barrierWidth} nm) or high (${barrierHeight} eV), causing exponential decay of the wave packet. The transmission probability drops to ${(
        transmissionProb * 100
      ).toFixed(2)}%. Try reducing barrier width to watch tunneling occur!`;
    }
  } else {
    return `Particle energy (${incidentEnergy} eV) exceeds the potential barrier height (${barrierHeight} eV). Most of the wave packet passes through cleanly with ${(
      transmissionProb * 100
    ).toFixed(1)}% transmission, with small quantum reflections at the boundary edges.`;
  }
}
